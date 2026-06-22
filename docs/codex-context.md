# Codex Context

Read this file first when starting a new RentalDash coding session.

## Current State

RentalDash is currently a zero-dependency static MVP. It can run immediately with Node and does not require package installation, API keys, a database, or a framework.

The project is not currently a git repository as of the initial implementation.

## Commands

Start the app:

```sh
npm run dev
```

Open:

```text
http://localhost:4173
```

Run tests:

```sh
npm test
```

Run tests in watch mode:

```sh
npm run test:watch
```

## Architecture

- `index.html`: Browser entry point.
- `src/main.js`: DOM rendering, event binding, local persistence, and UI flow.
- `src/rentaldash.js`: Testable domain logic and seeded data.
- `src/styles.css`: App styling.
- `scripts/dev-server.mjs`: Small static file server.
- `tests/rentaldash.test.js`: Node test suite.
- `docs/software-specification.md`: Product specification.
- `docs/roadmap.md`: Phase roadmap.
- `docs/testing.md`: Test strategy and commands.
- `docs/phases/`: Phase-by-phase implementation notes.

## Current Product Behavior

- Users can register and log in with an email. This is local-only and not secure production authentication.
- State is persisted in browser `localStorage`.
- Seed listings represent Rentals.ca and REW-style sources.
- The map is a custom visual MVP, not a real map provider yet.
- Users can pan and zoom the map.
- Listings are filtered by viewport, max price, bedrooms, source, and favourite status.
- Logged-in users can favourite listings.
- Logged-in users can import Facebook Marketplace listing URLs by manually entering listing details.
- Imported Facebook listings are automatically added to favourites.
- Logged-in users can edit imported Facebook Marketplace listings after saving.
- Saved listings support shortlist notes that appear in detail, favourites, and compare views.
- Logged-in users can add frequent locations with latitude and longitude.
- Commute estimates use haversine distance and assumed driving speed, not real traffic/routing.
- Compare shows favourite listings, notes, sortable price/commute columns, and commute estimates to saved locations.
- Small screens can switch between map and listing detail views.
- Error and success messages render as dismissible notices.

## Key Decisions

- Phase 1 intentionally avoids dependencies so the app runs immediately.
- Core behavior lives in `src/rentaldash.js` so it can be tested without a browser.
- Documentation must be updated with implementation changes.
- Third-party listing access must be handled through compliant APIs, feeds, or approved source adapters in later phases.
- Facebook Marketplace import is manual-first because automatic extraction may be unreliable or disallowed.

## Next Best Work

1. Add accessible keyboard interaction coverage for map pins and mobile toggles.
2. Add edit/delete support for frequent locations.
3. Add richer listing filters for parking, pets, furnishing, and availability.
4. Introduce a real framework and TypeScript once the MVP behavior is stable.
5. Add real geocoding and map provider integration.
