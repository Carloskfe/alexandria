FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./

# ─── Development ────────────────────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npx", "nest", "start", "--watch"]

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
EXPOSE 4000
CMD ["node", "dist/main"]
