FROM node:22-alpine AS base

WORKDIR /app

# Install dependencies needed for sharp and build tools
RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
RUN npm install --no-audit

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npm start"]

