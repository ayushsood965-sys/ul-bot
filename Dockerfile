FROM node:22-slim AS base

WORKDIR /app

# Install openssl for Prisma and build tools
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package.json only to avoid Windows lockfile optional dependency pinning
COPY package.json ./

# Install dependencies and explicitly install the linux x64 oxide binary for Tailwind v4
RUN npm install --include=dev --no-audit
RUN npm install --save-optional @tailwindcss/oxide-linux-x64-gnu@4.3.3

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npm start"]
