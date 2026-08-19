FROM node:lts-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM base AS build

COPY . .
RUN pnpm build:host

FROM node:lts-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server/server.js ./server.js
COPY --from=build /app/dist-server/localNetwork.js ./localNetwork.js
COPY --from=build /app/package.json ./package.json

EXPOSE 8080

CMD ["node", "server.js"]
