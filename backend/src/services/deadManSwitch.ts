import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export const startDeadManSwitch = (): void => {
  cron.schedule(config.deadManCron, async () => {
    logger.info('🕐 Running Dead-Man Switch check...');

    try {
      const now = new Date();

      // Find users with dead-man switch enabled who haven't been active
      const users = await prisma.user.findMany({
        where: {
          deadManEnabled: true,
          isActive: true,
          lastActiveAt: { not: null },
          deadManTriggeredAt: null,
        },
        include: {
          nominees: { where: { isActive: true } },
          notifications: {
            where: { type: 'DEAD_MAN_WARNING', createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
          },
        },
      });

      for (const user of users) {
        const lastActive = user.lastActiveAt!;
        const inactiveMs = now.getTime() - lastActive.getTime();
        const inactiveDays = Math.floor(inactiveMs / (24 * 60 * 60 * 1000));
        const triggerDays = user.deadManDays;

        // Warning at 80% of inactivity period
        const warningDays = Math.floor(triggerDays * 0.8);

        if (inactiveDays >= triggerDays) {
          // TRIGGER: Notify all nominees
          logger.warn(`⚡ Dead-Man Switch TRIGGERED for user ${user.id} (inactive ${inactiveDays} days)`);

          await prisma.user.update({
            where: { id: user.id },
            data: { deadManTriggeredAt: now },
          });

          // Notify each nominee
          for (const nominee of user.nominees) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: 'Dead-Man Switch Triggered',
                body: `Nominee ${nominee.name} has been notified per your vault instructions.`,
                type: 'DEAD_MAN_WARNING',
                data: JSON.stringify({ nomineeId: nominee.id, nomineeName: nominee.name, inactiveDays }),
              },
            });
            logger.info(`Notified nominee ${nominee.name} for user ${user.id}`);
            // In production: send SMS/email to nominee.phone / nominee.email
          }

        } else if (inactiveDays >= warningDays && user.notifications.length === 0) {
          // WARNING: Notify user to check in
          const daysLeft = triggerDays - inactiveDays;

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: '⚠️ Vault Inactivity Warning',
              body: `You have been inactive for ${inactiveDays} days. Your vault will notify nominees in ${daysLeft} days. Please sign in to reset.`,
              type: 'DEAD_MAN_WARNING',
              data: JSON.stringify({ inactiveDays, daysLeft, triggerDays }),
            },
          });

          logger.info(`⚠️ Warning sent to user ${user.id}: ${daysLeft} days until trigger`);
          // In production: send push notification via FCM
        }
      }

      logger.info('✅ Dead-Man Switch check complete');
    } catch (err) {
      logger.error('Dead-Man Switch cron error:', err);
    }
  });

  logger.info(`🕐 Dead-Man Switch cron scheduled: ${config.deadManCron}`);
};
