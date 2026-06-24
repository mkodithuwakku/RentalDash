# Testing Documentation

## Current Test Stack

RentalDash uses Node's built-in test runner for domain logic and Playwright for the browser MVP smoke loop.

## Commands

Run the suite once:

```sh
npm test
```

Run continuously while developing:

```sh
npm run test:watch
```

Run the browser smoke test:

```sh
npm run test:smoke
```

## Current Coverage

The test suite covers:

- Facebook Marketplace URL validation.
- User registration and login behavior.
- Favourite toggling.
- Listing filters.
- Facebook listing import and automatic favouriting.
- Imported Facebook listing editing.
- Public catalog JSON listing feed import, normalization, dedupe, and source filter discovery.
- Favourite shortlist notes.
- Frequent locations.
- Commute estimate generation.
- Comparison row construction, sorting, and highlights.
- Browser-level MVP flow across MapLibre bootstrapping, zoom stability, fallback visibility, browser geolocation, map search, anonymous public source feed import, register, favourite, Facebook import, edit, notes, locations, and compare.

## Testing Rules for Future Work

- Add or update tests for every behavior change.
- Keep domain logic in testable modules instead of burying it inside DOM code.
- Add regression tests when fixing bugs.
- Update this document when commands, tools, or coverage expectations change.
- When a real framework is introduced, keep fast unit tests and add browser-level smoke tests.

## Planned Additions

- End-to-end tests after the frontend framework is chosen.
- API integration tests after the backend exists.
- Accessibility checks for keyboard navigation and focus behavior.
