FROM node:24-bookworm-slim
WORKDIR /app
RUN npm install -g pnpm@11.19.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
ENV DATA_DIR=/var/data/wgc
EXPOSE 3000
CMD ["node", "scripts/start-production.mjs"]
