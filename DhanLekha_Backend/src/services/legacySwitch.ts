import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export const startLegacySwitch = (): void => {
  cron.schedule(config.deadManCron, async () => {
    logger.info('🕐 Running Legacy Switch check...');

    try {
      const now = new Date();

      // Find users with legacy switch enabled who haven't been active
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
            where: { type: 'LEGACY_SWITCH_WARNING', createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
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
          logger.warn(`⚡ Legacy Switch TRIGGERED for user ${user.id} (inactive ${inactiveDays} days)`);

          await prisma.user.update({
            where: { id: user.id },
            data: { deadManTriggeredAt: now },
          });

          // Notify each nominee
          for (const nominee of user.nominees) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: 'Legacy Switch Triggered',
                body: `Nominee ${nominee.name} has been notified per your vault instructions.`,
                type: 'LEGACY_SWITCH_WARNING',
                data: { nomineeId: nominee.id, nomineeName: nominee.name, inactiveDays },
              },
            });
            logger.info(`Notified nominee ${nominee.name} for user ${user.id}`);
          }

        } else if (inactiveDays >= warningDays && user.notifications.length === 0) {
          // WARNING: Notify user to check in
          const daysLeft = triggerDays - inactiveDays;

          await prisma.notification.create({
            data: {
              userId: user.id,
              title: '⚠️ Vault Inactivity Warning',
              body: `You have been inactive for ${inactiveDays} days. Your vault will notify nominees in ${daysLeft} days. Please sign in to reset.`,
              type: 'LEGACY_SWITCH_WARNING',
              data: { inactiveDays, daysLeft, triggerDays },
            },
          });

          logger.info(`⚠️ Warning sent to user ${user.id}: ${daysLeft} days until trigger`);
        }
      }

      logger.info('✅ Legacy Switch check complete');
    } catch (err) {
      logger.error('Legacy Switch cron error:', err);
    }
  });

  logger.info(`🕐 Legacy Switch cron scheduled: ${config.deadManCron}`);
};
