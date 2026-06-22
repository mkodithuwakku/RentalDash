# RentalDash

RentalDash is a runnable MVP for a rental property dashboard. It supports a MapLibre-powered listing browser with a local fallback map, user login stored locally, favourites, Facebook Marketplace URL imports, listing comparison, and frequent-location commute estimates.

## Run Locally

Install dependencies:

```sh
npm install
```

Start the static dev server:

```sh
npm run dev
```

Then open:

```text
http://localhost:4173
```

The app uses browser `localStorage`, seeded listings, MapLibre GL JS, and a small Node static server. The map defaults to MapLibre demo tiles for development; paste a MapTiler style URL in the Map Provider panel for production-style tiles.

## Test

```sh
npm test
```

For continuous testing while developing:

```sh
npm run test:watch
```

## Project Docs

- [Software specification](./docs/software-specification.md)
- [Roadmap](./docs/roadmap.md)
- [Testing documentation](./docs/testing.md)
- [Codex context](./docs/codex-context.md)
- [Phase 1 notes](./docs/phases/phase-01-runnable-mvp.md)

## Maintenance Rule

When implementation changes, update these docs in the same change:

- `docs/codex-context.md` for current architecture, commands, and decisions.
- `docs/roadmap.md` for phase status.
- The active file in `docs/phases/` for implementation notes.
- `docs/testing.md` when test scope, commands, or strategy changes.
