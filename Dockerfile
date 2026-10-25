# Container build (Fly.io): the Claude Agent SDK's native binary (~270MB) exceeds Vercel's function size limit,
# so the subscription-backed coach needs a container host, like Peek's mimic on ECS.
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production PORT=8080 HOME=/tmp
EXPOSE 8080
CMD ["npx", "next", "start", "-p", "8080"]
