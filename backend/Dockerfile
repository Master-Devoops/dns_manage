# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
# python3/make/g++ are required to compile the native bcrypt addon on musl
# (no prebuilt bcrypt binaries are published for linux-musl), openssl is
# required by the Prisma query engine.
RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && npm install --omit=dev \
  && npx prisma generate \
  && apk del .build-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/main"]
