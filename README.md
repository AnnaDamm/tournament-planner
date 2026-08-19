# Courtly — Swiss Badminton Tournament

A small local React/Vite application for organising badminton tournaments with Swiss-style rounds.

## Requirements

- Docker and Docker Compose
- Node.js LTS (only required when running Vite outside Docker)

## Development with Docker

Start the Vite development server:

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Stop the server with `Ctrl+C`, or run:

```bash
docker compose down
```

The Compose setup builds the local `Dockerfile` from the current `node:lts-alpine` image, enables pnpm through Corepack, and mounts the project directory for live reload.

Run quality checks inside Docker:

```bash
docker compose run --rm app pnpm lint
docker compose run --rm app pnpm lint:fix
docker compose run --rm app pnpm typecheck
```

The pre-commit hook is configured automatically by `pnpm install` and runs Prettier, Oxlint and TypeScript checks before every commit. To enable it manually in an existing checkout:

```bash
git config core.hooksPath .githooks
```

## Development without Docker

```bash
corepack enable
pnpm install
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Production build

Create a production build locally:

```bash
pnpm install
pnpm build
```

The generated files are written to `dist/`. Preview the production build with:

```bash
pnpm preview
```

The preview server is available at [http://localhost:4173](http://localhost:4173).

## Code quality

Run the checks locally without Docker:

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm format
pnpm format:check
```

Prettier is the project formatter for React and TypeScript files. GitHub Actions runs Oxlint, Prettier and the TypeScript check on every push and pull request. The pre-commit hook checks all three before allowing a commit.

Oxlint enforces one React component per file and a maximum of 200 lines per function or component.

## GitHub releases

Pushing a version tag such as `v1.0.0` triggers the GitHub Actions workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow installs dependencies, runs the production build, creates a GitHub Release, and attaches the generated `dist/index.html` as `index.html`.

## Features

- Player management, including bulk entry and deletion
- Sortable standings table
- Swiss-style round generation grouped by wins
- Bye handling for an odd number of players
- Drag-and-drop opponent changes
- Local browser persistence with `localStorage`
- Browser language detection with English fallback and German translations
- Automatic light/dark mode based on the browser or operating system preference
