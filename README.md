# Tourny — Tournament Manager

A small local React/Vite application for organising sport-agnostic tournaments with Swiss-style rounds.

## GitHub Pages

[Open Tourny on GitHub Pages](https://annadamm.github.io/tournament-planner/)

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

## GitHub Pages / PWA

The [GitHub Pages version](https://annadamm.github.io/tournament-planner/) remains a
standalone tournament manager. It works without a local host service and persists data
only in the browser's `localStorage`. Once the PWA has been loaded while online, it can
also be opened offline; data is not synchronised with other devices.

The local-network documentation and viewer QR-code actions are intentionally hidden in
this mode.

## Local master mode

Local master mode runs the production app and a small, in-memory LAN relay together.
Open the master at `http://localhost:8080/`; it owns the tournament data and publishes a
complete snapshot whenever it changes. Every device that opens the LAN URL receives a
read-only live view through Server-Sent Events (SSE). There is no cloud service, database,
or Internet requirement.

The master sees a platform-aware Wi-Fi setup guide and a QR-code action. The QR code only
contains the public viewer URL—viewers do not need a token or a special URL. A private,
random master credential is supplied only to the master page and protects snapshot updates.

### Run directly with Node.js

```bash
pnpm install
pnpm host
```

The local host automatically selects a LAN IPv4 address for the QR code. Connect all
devices to the same Wi-Fi or hotspot, then open the printed `Viewer URL` (or scan its QR
code). Keep the master page open for the duration of the tournament.

### Run the local host with Docker

The host start script detects the laptop's primary private LAN IPv4 address and passes it to
Docker Compose automatically. It does not require Node.js or pnpm on the host. Each worktree
gets its own stable Compose project name and the next available port starting at `8080`, so
multiple worktrees can run at the same time without sharing containers, networks, or URLs:

```bash
./scripts/start
```

On Windows, double-click `scripts\\start.bat` in File Explorer. It starts the same Docker
Compose setup and keeps its window open if startup fails.

Open the printed `http://localhost:<port>/` address on the tournament laptop as the master and
use the QR-code action in the upper-right corner for the viewer URL. Allow incoming connections
to the selected port in the laptop firewall when prompted.

If the laptop has several active network adapters (for example a VPN), override the selected
address explicitly:

```bash
TOURNY_VIEWER_URL=http://192.168.178.42:8080/ ./scripts/start
```

To pick a specific port or Compose project name instead of the automatic values, set
`TOURNY_PORT` or `TOURNY_COMPOSE_PROJECT` before starting the script. When
`TOURNY_VIEWER_URL` is set, its port is automatically used as the host port. This is useful for
a repeatable local URL in development.

OrbStack also supplies automatic host-only service domains in the form
`host.<compose-project>.orb.local`; the generated Compose project name makes these distinct per
worktree as well. The QR code deliberately continues to use the laptop's LAN IP and selected
port, because that is the portable address for phones and other devices on the tournament Wi-Fi.
See the [OrbStack domain documentation](https://docs.orbstack.dev/docker/domains) for details.

Tournament data remains in the master's browser `localStorage`; the relay only retains the
latest snapshot in memory and forgets it when it stops. The master republishes its current state
every five seconds, so the relay automatically recovers after a restart without persisting
tournament data on the server. `localhost:8080` is a different browser origin from GitHub Pages,
so import an exported tournament JSON there the first time you use local master mode.

## Documentation

Detailed user documentation is available in the deployed application:

[Open the Tourny documentation](https://annadamm.github.io/tournament-planner/docs/)

The documentation is bundled with the React application, available in English and German
based on the browser language, and accessible offline after the application has been loaded.
English remains the canonical source-code language.

The repository Wiki serves as a small landing page that links to this canonical documentation.

## Requirements

- Docker and Docker Compose for local master mode
- Node.js LTS for direct local hosting or development

## Development

Start the Vite development server:

```bash
corepack enable
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Docker Compose is reserved for local master mode. The development server uses Vite directly,
which keeps its live-reload workflow separate from the production-like LAN host.

The pre-commit hook is configured automatically by `pnpm install` and runs Prettier, Oxlint and TypeScript checks before every commit. To enable it manually in an existing checkout:

```bash
git config core.hooksPath .githooks
```

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
