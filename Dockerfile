FROM node:22-slim AS base

WORKDIR /app

# Install openssl for Prisma and standard glibc tools
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --include=dev --no-audit

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npm start"]

