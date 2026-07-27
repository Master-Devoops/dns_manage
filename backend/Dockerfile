# =========================
# 🔨 Build Stage
# =========================
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# =========================
# 🚀 Production Stage
# =========================
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Copy .env.example as a reference; actual .env should be
# mounted or supplied via environment variables at runtime.
COPY .env.example .env.example

EXPOSE 4000

CMD ["node", "dist/index.js"]
