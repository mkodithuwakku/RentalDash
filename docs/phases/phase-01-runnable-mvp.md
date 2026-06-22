# Phase 1: Runnable MVP

Status: In progress.

## Objective

Create a version of RentalDash that can run immediately and demonstrate the core product loop without external services.

## Implemented

- Static app entry point.
- Custom map-style dashboard.
- Seed listings.
- Local account simulation.
- Favourites.
- Facebook Marketplace URL import.
- Imported listing editing.
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
- The map uses latitude and longitude math to position price pins in a simulated viewport.
- Commutes are estimates based on haversine distance and assumed average driving speed.
- Tests use `node --test` and import domain functions directly from `src/rentaldash.js`.
- Browser smoke coverage uses Playwright against the local static dev server.

## Known Limitations

- No real authentication security.
- No backend database.
- No real map tiles or geocoding.
- No real routing provider.
- No direct Rentals.ca or REW integration yet.
- Facebook Marketplace import requires manual fields.

## Exit Criteria

- App runs with `npm run dev`.
- Test suite passes with `npm test`.
- Smoke test passes with `npm run test:smoke`.
- Documentation identifies current architecture and next phase.
- A user can complete the MVP loop: register, browse, favourite, import, add location, compare.
