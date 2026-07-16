# ─────────────────────────────────────────────
# Stage 1: Dependency installer
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy lockfile + manifest and install production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev


# ─────────────────────────────────────────────
# Stage 2: Builder – build the Next.js app
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy ALL node_modules (incl. devDependencies) for the build step
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Next.js standalone output – keeps the Docker image small
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ─────────────────────────────────────────────
# Stage 3: Runtime – serve the standalone build
# ─────────────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
