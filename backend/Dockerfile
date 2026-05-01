FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci --only=production=false
RUN npx prisma generate

COPY src ./src
RUN npm run build

# ─── Production stage ───────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S dhanlekha -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma/

RUN mkdir -p uploads logs && chown -R dhanlekha:nodejs /app

USER dhanlekha

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
