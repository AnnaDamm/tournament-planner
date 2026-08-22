# Local runtime and checks

This project must be usable locally with Docker alone. Do not require users or
contributors to install Node.js, npm, pnpm, or project dependencies on the host.

## Choose the correct Docker command

- `./scripts/start` (macOS/Linux) and `scripts\\start.bat` (Windows) are the
  supported entry points for the local LAN host. They select an isolated Compose
  project, an available port, and the viewer URL before calling Compose.
- The Compose `host` service is a long-running production-like LAN server. Start
  it with `docker compose ... up --build` (normally through the start scripts).
  Do **not** use `docker compose run` or `docker compose exec` to start it.
- Use `docker run --rm <build-image> pnpm ...` for one-off commands such as
  formatting, linting, type checking, and tests. Build `<build-image>` from the
  Dockerfile's `build` stage first; use a worktree-specific image tag when more
  than one checkout may be active.
- `pnpm exec <tool>` means “run a package binary” inside the selected runtime.
  It is not Docker's `exec`. In the Docker-only path it belongs after
  `docker run --rm <build-image> pnpm`.

## Host-tool safeguards

- Never call host `pnpm`, `npm`, or `node` merely because `pnpm` or
  `node_modules` happens to exist. A usable host path requires both the package
  manager and its matching `node` binary.
- Do not run `pnpm install` on the host to make a check or Git hook work.
  `node_modules` is platform-specific and must not be mounted into a Linux
  check container as a substitute for Linux dependencies.
- Git hooks must fall back to a Docker `build`-stage image followed by
  `docker run --rm`; they must not reference the removed Compose service `app`.
  Keep the fallback independent of `TOURNY_VIEWER_URL`, which is only required
  when starting the LAN host.

## Verification

- After changes to application or server code, validate the production path with
  `docker build --target build ...` (or the equivalent Compose production build).
- Run TypeScript, Oxlint, and Prettier inside the build-stage image when the host
  runtime is unavailable. The existing pre-commit hook implements this fallback;
  preserve that behaviour when editing it.
- Do not work around a failed host hook with `--no-verify` before the equivalent
  Docker checks have succeeded. Report when a host-only check cannot run and use
  the Docker path instead.
- Always run the repository's pre-commit hooks at the end of the task as the
  final quality checks.

## Accessibility

- Always provide an accessible name for every interactive control.
- Icon-only buttons must have a meaningful `aria-label` and a matching `title` tooltip.
- Mark decorative icons with `aria-hidden="true"` and associate form controls with visible labels.
- Preserve keyboard access, focus states, semantic HTML, and live-region announcements when changing UI behaviour.
