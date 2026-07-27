# =========================
# 🔨 Build Stage
# =========================
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
