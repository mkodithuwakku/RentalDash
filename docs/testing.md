# Testing Documentation

## Current Test Stack

RentalDash currently uses Node's built-in test runner. This keeps Phase 1 dependency-free and runnable immediately.

## Commands

Run the suite once:

```sh
npm test
```

Run continuously while developing:

```sh
npm run test:watch
```

## Current Coverage

The test suite covers:

- Facebook Marketplace URL validation.
- User registration and login behavior.
- Favourite toggling.
- Listing filters.
- Facebook listing import and automatic favouriting.
- Frequent locations.
- Commute estimate generation.
- Comparison row construction.

## Testing Rules for Future Work

- Add or update tests for every behavior change.
- Keep domain logic in testable modules instead of burying it inside DOM code.
- Add regression tests when fixing bugs.
- Update this document when commands, tools, or coverage expectations change.
- When a real framework is introduced, keep fast unit tests and add browser-level smoke tests.

## Planned Additions

- DOM smoke tests for the static MVP.
- End-to-end tests after the frontend framework is chosen.
- API integration tests after the backend exists.
- Accessibility checks for keyboard navigation and focus behavior.
