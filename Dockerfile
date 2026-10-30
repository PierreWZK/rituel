# Rituel : Next.js + Prisma (PostgreSQL), déployé par Coolify.
FROM node:22-alpine

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dépendances d'abord (cache Docker) ; le postinstall génère le client Prisma, d'où le schéma copié avant.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Les migrations s'appliquent à chaque démarrage ; le remplissage des jeux se lance une seule fois à la main (voir README).
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
