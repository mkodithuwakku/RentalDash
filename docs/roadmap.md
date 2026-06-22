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
- Map-style listing browser with pan, zoom, viewport filtering, and price pins.
- Compare tab for favourites.
- Frequent locations with estimated driving commutes.
- Node built-in test suite.
- Project docs for context, roadmap, phases, and testing.

Remaining:

- Browser-based smoke testing.
- Improved empty/loading/error states.
- Better mobile polish.

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

Status: Planned.

Goals:

- Integrate Mapbox, MapLibre, or Google Maps.
- Use real marker clustering.
- Add geocoding for imported listings and frequent locations.
- Add viewport-based API queries.

## Phase 4: Listing Source Integrations

Status: Planned.

Goals:

- Build source adapter interface.
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
