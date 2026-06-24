# RentalDash Roadmap

This roadmap should be updated whenever meaningful work lands. Keep phase status honest so a new contributor can quickly tell what exists, what is partial, and what is planned.

## Phase 1: Runnable MVP Foundation

Status: In progress.

Implemented:

- Zero-dependency static web app.
- Node static dev server.
- Seed rental listings from Rentals.ca and REW-style sources.
- Local email-based account simulation.
- Favourites persisted in `localStorage`.
- Facebook Marketplace URL import with manual listing fields.
- Edit support for imported Facebook Marketplace listings.
- Local authorized JSON listing feed imports through a source-adapter path.
- Map-style listing browser with pan, zoom, viewport filtering, and price pins.
- MapLibre GL JS integration with configurable style URL and fallback map rendering.
- Browser geolocation centering to a 100 square km area around the user.
- Map place search using Nominatim in the static MVP.
- Compare tab for favourites with notes, sorting, and best-value highlights.
- Frequent locations with estimated driving commutes.
- Mobile map/detail switching.
- Dismissible success and error notices.
- Node built-in test suite.
- Browser-based Playwright smoke test for the MVP loop.
- Project docs for context, roadmap, phases, and testing.

Remaining:

- Provider-backed geocoding for imported listings and frequent locations.
- Route-provider integration for accurate commute times.
- Accessibility audit for keyboard and screen-reader behavior.
- Edit support for frequent locations.
- Richer filters for pets, parking, furnishing, and availability.

## Phase 2: Real App Structure

Status: Planned.

Goals:

- Choose production frontend framework.
- Add TypeScript.
- Add component boundaries.
- Replace simulated auth with real authentication.
- Add persistent backend storage.
- Add database schema and migrations.

## Phase 3: Real Map Provider

Status: In progress.

Goals:

- Integrate Mapbox, MapLibre, or Google Maps. MapLibre is the selected first provider.
- Use real marker clustering.
- Add provider-backed geocoding for imported listings and frequent locations.
- Add viewport-based API queries.

## Phase 4: Listing Source Integrations

Status: In progress.

Goals:

- Build source adapter interface. Initial local JSON feed import is implemented.
- Confirm compliant access path for Rentals.ca.
- Confirm compliant access path for REW.
- Add ingestion jobs.
- Track stale listings.

## Phase 5: Compare and Commute Depth

Status: Planned.

Goals:

- Add richer amenity normalization.
- Add user notes.
- Add route provider integration.
- Support driving, transit, walking, and cycling.
- Cache commute estimates.

## Phase 6: Production Readiness

Status: Planned.

Goals:

- Add end-to-end tests.
- Add accessibility audit.
- Add deployment.
- Add monitoring and logging.
- Add privacy and data retention documentation.
