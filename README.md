# Tourny — Tournament Manager

A small local React/Vite application for organising sport-agnostic tournaments with Swiss-style rounds.

## Features

- **Currently only the Swiss system is supported**
- Player management, including bulk entry and deletion
- Sortable standings table
- Swiss-style round generation grouped by wins
- Bye handling for an odd number of players
- Drag-and-drop opponent changes
- Local browser persistence with `localStorage`
- Browser language detection with English fallback and German translations
- Automatic light/dark mode based on the browser or operating system preference

## GitHub Pages

[Open Tourny](https://annadamm.github.io/tournament-planner/)

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

## GitHub Pages deployment

Pushing a version tag such as `v1.0.0` triggers the GitHub Actions workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Tags whose commits belong to `main` automatically run the production build. The workflow
creates a `404.html` fallback for client-side routes, updates the deployment state on the
`gh-pages` branch, and deploys the assembled site with the official Pages deployment
action. In the repository settings, configure GitHub Pages to use **GitHub Actions** as its
source.

Maintainers can deploy a pull request preview manually under **Actions → Deploy static
content to Pages → Run workflow** by entering its pull request number. The preview is
available at `https://annadamm.github.io/tournament-planner/previews/pr-<number>/`.
Running the workflow again with the `remove` action deletes that preview. GitHub restricts
manual workflow runs to users with write access to the repository.

To create a release automatically, run one of these commands:

```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

The command uses `pnpm version`, commits the version bump, creates and pushes a `v...` tag, and that tag automatically starts the Pages build and deployment. The same versioning workflow can also be started manually under **Actions → Create release tag → Run workflow**.
