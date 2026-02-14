FROM oven/bun:1.1.22 AS deps
WORKDIR /app
COPY bun.lock package.json tsconfig.json tsconfig.base.json eslint.config.js ./
COPY packages ./packages
RUN bun install --frozen-lockfile

FROM deps AS builder
COPY src ./src
COPY docs ./docs
COPY README.md ./README.md
RUN bun run build

FROM oven/bun:1.1.22 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json bun.lock ./
CMD ["bun", "dist/index.js", "api", "--port", "4000"]
