# Phase 1: Runnable MVP

Status: In progress.

## Objective

Create a version of RentalDash that can run immediately and demonstrate the core product loop without external services.

## Implemented

- Static app entry point.
- MapLibre-powered dashboard with fallback map rendering.
- Browser geolocation map centering.
- Map place search.
- Seed listings.
- Local account simulation.
- Favourites.
- Facebook Marketplace URL import.
- Imported listing editing.
- Authorized JSON listing feed import for local source-adapter testing.
- Shortlist notes for saved listings.
- Frequent locations.
- Commute estimates.
- Compare table with sorting and highlights.
- Mobile map/detail switching.
- Dismissible notices for success and error states.
- Documentation system.
- Node test suite.
- Playwright smoke test.

## Technical Notes

- App state is stored in `localStorage` under `rentaldash.state.v1`.
- MapLibre GL JS renders real map tiles when the configured style URL is reachable; the fallback map uses latitude and longitude math to position price pins.
- MapLibre is capped to zoom 18 for the development OSM basemap and switches to fallback UI after repeated map errors or WebGL context loss.
- The Map Provider panel stores an optional MapTiler or compatible style URL in `localStorage` under `rentaldash.mapStyleUrl`.
- Browser geolocation fits the dashboard to a 100 square km area around the user when permission is granted.
- Map search calls Nominatim and fits MapLibre to the returned result bounds.
- The Sources tab imports authorized JSON feeds into per-user `sourceListingsByUser` state and deduplicates listings by source plus external ID or URL.
- Commutes are estimates based on haversine distance and assumed average driving speed.
- Tests use `node --test` and import domain functions directly from `src/rentaldash.js`.
- Browser smoke coverage uses Playwright against the local static dev server.

## Known Limitations

- No real authentication security.
- No backend database.
- The default development style uses OpenStreetMap raster tiles; production tiles require a MapTiler or compatible style URL.
- Imported listings and frequent locations still require manual coordinates.
- Nominatim search is suitable for MVP development only; production geocoding should use a provider adapter.
- No real routing provider.
- No direct Rentals.ca, REW, or Facebook Marketplace automation yet; real pulls require approved APIs, feeds, or partner access.
- Facebook Marketplace import requires manual fields.

## Exit Criteria

- App runs with `npm run dev`.
- Test suite passes with `npm test`.
- Smoke test passes with `npm run test:smoke`.
- Documentation identifies current architecture and next phase.
- A user can complete the MVP loop: register, browse, favourite, import, add location, compare.
