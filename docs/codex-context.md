# Codex Context

Read this file first when starting a new RentalDash coding session.

## Current State

RentalDash is currently a static MVP with one frontend dependency: MapLibre GL JS. It does not require API keys, a database, or a framework for local development.

The project is a git repository with `main` and feature branches pushed to GitHub.

## Commands

Install dependencies:

```sh
npm install
```

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
- `src/maplibre-map.js`: MapLibre initialization, marker rendering, map style configuration, and fallback handling.
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
- The map uses MapLibre GL JS when the configured style URL loads, with the previous CSS map retained as a fallback.
- Users can pan and zoom the map through MapLibre controls or fallback controls.
- On first dashboard load, the app requests browser geolocation and fits the map to a 100 square km area around the user when permission is granted.
- The map toolbar includes place search backed by Nominatim for local development.
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

- Phase 1 keeps the app static and framework-free, but now includes MapLibre for real map rendering.
- Core behavior lives in `src/rentaldash.js` so it can be tested without a browser.
- MapLibre is loaded from `node_modules` by the static server instead of through a bundler.
- MapTiler or another tile provider should be configured by pasting a style URL in the Map Provider panel; the checked-in default is an OpenStreetMap raster style for development only.
- Nominatim powers the current place search in the static MVP; production should move geocoding behind a provider adapter with rate limits and API-key configuration.
- Documentation must be updated with implementation changes.
- Third-party listing access must be handled through compliant APIs, feeds, or approved source adapters in later phases.
- Facebook Marketplace import is manual-first because automatic extraction may be unreliable or disallowed.

## Next Best Work

1. Add provider-backed geocoding for imports and frequent locations.
2. Add a separate commute provider for route-based driving/transit/walking/cycling times.
3. Add accessible keyboard interaction coverage for map pins and mobile toggles.
4. Add edit/delete support for frequent locations.
5. Add richer listing filters for parking, pets, furnishing, and availability.
