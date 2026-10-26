FROM node:22-slim AS base

WORKDIR /app

# Force development environment during build so npm never prunes build dependencies
ENV NODE_ENV=development

# Install openssl for Prisma and build tools
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Configure npm network timeouts and retry resilience
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Copy dependency manifests
COPY package*.json ./

# Install project dependencies and Linux x64 Tailwind oxide engine
RUN npm install --include=dev --no-audit \
    && npm install --include=dev --no-audit @tailwindcss/oxide-linux-x64-gnu@4.3.3

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npm start"]
