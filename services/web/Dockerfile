FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./

# ─── Development ────────────────────────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Build ──────────────────────────────────────────────────────────────────
FROM base AS build
RUN npm install
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV INTERNAL_API_URL=http://api:4000
ENV NEXT_PUBLIC_API_URL=https://noetia.app/api
ENV NEXT_PUBLIC_OAUTH_URL=https://noetia.app/api
RUN npm run build

# ─── Production ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
