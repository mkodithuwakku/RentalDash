# RentalDash

RentalDash is a runnable MVP for a rental property dashboard. It supports a map-style listing browser, user login stored locally, favourites, Facebook Marketplace URL imports, listing comparison, and frequent-location commute estimates.

## Run Locally

```sh
npm run dev
```

Then open:

```text
http://localhost:4173
```

The first version uses browser `localStorage`, seeded listings, and a zero-dependency Node static server so the project can run immediately.

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
