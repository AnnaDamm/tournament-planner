# Courtly — Swiss Badminton Tournament

A small local React/Vite application for organising badminton tournaments with Swiss-style rounds.

## Requirements

- Docker and Docker Compose
- Node.js LTS (only required when running Vite outside Docker)

## Development with Docker

Start the Vite development server:

```bash
docker compose up
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Stop the server with `Ctrl+C`, or run:

```bash
docker compose down
```

The Compose setup uses the current `node:lts-alpine` image. Dependencies are installed when the container starts, and the project directory is mounted for live reload.

## Development without Docker

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Production build

Create a production build locally:

```bash
npm install
npm run build
```

The generated files are written to `dist/`. Preview the production build with:

```bash
npm run preview
```

The preview server is available at [http://localhost:4173](http://localhost:4173).

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
