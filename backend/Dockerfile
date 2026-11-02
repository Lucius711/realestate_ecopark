# Build from the repo root: docker build -f backend/Dockerfile .  (needs frontend/src/data/seed.json for `seed`)
FROM node:22-alpine AS build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production SEED_FILE=/app/seed.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY backend/package.json ./
COPY frontend/src/data/seed.json ./seed.json
# Fallback folders when R2 / Resend are not configured; the app runs as the unprivileged "node" user.
RUN mkdir uploads mail-outbox && chown node uploads mail-outbox
USER node
EXPOSE 4000
CMD ["node", "dist/main.js"]
