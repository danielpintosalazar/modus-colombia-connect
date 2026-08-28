# Modo desarrollo: vite dev con SSR + HMR. Es lo que mejor encaja para la demo
# (el build de producción de este template apunta a Cloudflare Workers).
FROM node:22-slim

WORKDIR /app

# Capa de dependencias cacheable. Se usa `npm install` (no `npm ci`) porque el
# lockfile canónico del proyecto es bun.lock; package-lock.json es secundario.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 8080

# --host 0.0.0.0 para que el server dev sea alcanzable fuera del contenedor.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]
