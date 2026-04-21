FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./

# ─── Development ────────────────────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
CMD ["npx", "ts-node", "src/index.ts"]

# ─── Build ──────────────────────────────────────────────────────────────────
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ─── Production ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN npm install --omit=dev
CMD ["node", "dist/index.js"]
