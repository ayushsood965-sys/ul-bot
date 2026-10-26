FROM node:22-slim AS base

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install openssl for Prisma, ca-certificates, and build tools
RUN apt-get update && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

# Configure npm network timeouts and retry resilience
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Copy dependency manifests
COPY package*.json ./

# Install dependencies and Tailwind Linux oxide binary with ignore-scripts to avoid transient postinstall socket errors
RUN npm install --include=dev --no-audit --ignore-scripts \
    && npm install --include=dev --no-audit --ignore-scripts @tailwindcss/oxide-linux-x64-gnu@4.3.3 @resvg/resvg-js-linux-x64-gnu@2.6.2

COPY . .

# Generate Prisma Client and initialize schema tables for build-time evaluation
RUN npx prisma generate && npx prisma db push --skip-generate

# Build Next.js application in standard production mode
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --skip-generate && npx tsx prisma/seed.ts && (npx tsx src/worker.ts &) && npm start"]
