# RentalDash Software Specification

## 1. Product Overview

RentalDash is a rental property discovery dashboard that helps users collect, map, favourite, compare, and evaluate rental listings from multiple sources. The product centers on a clean modern web interface with an interactive map, allowing users to browse rental listings from sources such as Rentals.ca and REW, manually import Facebook Marketplace rental listings by URL, and compare shortlisted properties against price, amenities, commute times, and frequent personal locations.

## 2. Goals

- Provide a fast, modern dashboard for rental property discovery.
- Display rental listings on an interactive map with zoom-aware listing density, similar to Airbnb.
- Allow users to save favourite listings across sessions.
- Allow authenticated users to import Facebook Marketplace rental listing links into their private account.
- Help users compare favourite listings across practical decision factors.
- Show commute information from selected properties to user-defined frequent locations such as work, gym, school, church, or family.

## 3. Non-Goals for MVP

- In-app lease signing, rent payment, or tenant screening.
- Messaging landlords or property managers from inside the app.
- Full automated scraping of Facebook Marketplace private pages.
- Guaranteeing complete listing coverage from external providers.
- Mobile native applications.

## 4. Users

### Primary User

A renter searching for a property who wants to evaluate options across multiple rental listing sources in one place.

### Secondary User

A developer or administrator maintaining integrations, map behavior, listing normalization, and data freshness.

## 5. Key Assumptions

- Rentals.ca and REW listing access may require official APIs, partner feeds, permitted scraping, or third-party data providers. The system should be designed with source adapters so integrations can change without rewriting the product.
- Facebook Marketplace listings may not expose reliable structured metadata from a public URL. MVP should support manual URL import with user-editable fields and optional metadata extraction when technically and legally available.
- Commute calculations will require a maps provider such as Google Maps Platform, Mapbox, HERE, or OpenRouteService.
- Users must log in to persist favourites, imported Facebook Marketplace listings, and frequent locations.
- The first version should prioritize desktop and responsive web use.

## 6. Core Features

### 6.1 Authentication

Users can create an account, log in, log out, and return later to see their favourites, imported listings, and frequent locations.

Recommended MVP authentication options:

- Email and password.
- OAuth sign-in with Google as an optional enhancement.
- Session-based or token-based authentication.

### 6.2 Listing Aggregation

The system should ingest rental listings from multiple source adapters.

Initial listing sources:

- Rentals.ca.
- REW.
- User-imported Facebook Marketplace URL.

Each listing should be normalized into a common data model:

- Source.
- Source URL.
- External listing ID if available.
- Title.
- Address or approximate location.
- Latitude and longitude.
- Price.
- Bedrooms.
- Bathrooms.
- Property type.
- Amenities.
- Images.
- Description.
- Availability date.
- Last updated timestamp.

### 6.3 Interactive Map

The map is the primary browsing interface.

Expected behavior:

- Listings appear as map markers or price pins.
- Listings update based on current viewport and zoom level.
- Dense areas cluster listings at low zoom levels.
- Selecting a marker opens a listing preview.
- Clicking a preview opens a detailed listing panel or page.
- The map and listing list stay synchronized.
- Users can pan, zoom, and filter without a full page reload.

### 6.4 Listing Filters

Users can narrow visible listings by:

- Price range.
- Bedrooms.
- Bathrooms.
- Property type.
- Source.
- Pet friendly.
- Parking.
- Furnished.
- Availability date.
- Favourite status.

### 6.5 Favourites

Users can favourite listings they are considering.

Expected behavior:

- A favourite action is available from map previews, listing cards, and listing detail views.
- Favourites persist to the authenticated user account.
- Users can view a dedicated favourites list.
- Users can remove listings from favourites.
- Imported Facebook Marketplace listings can also be favourited.

### 6.6 Facebook Marketplace Listing Import

Users can paste a Facebook Marketplace rental listing URL and add it to their account.

MVP behavior:

- User pastes a Facebook Marketplace URL.
- System validates that the URL is from Facebook Marketplace.
- System creates a draft imported listing.
- User can manually enter or edit title, price, address, bedrooms, bathrooms, amenities, notes, and images if automatic extraction is unavailable.
- User can save the imported listing.
- Saved imported listings appear on the map if they have a valid address or coordinates.
- Saved imported listings appear in favourites and comparison workflows.

Future behavior:

- Attempt metadata extraction from public Open Graph tags or permitted APIs.
- Browser extension or share-sheet workflow for easier imports.

### 6.7 Compare Tab

Users can compare favourite listings side by side.

Comparison fields:

- Price.
- Bedrooms.
- Bathrooms.
- Square footage if available.
- Property type.
- Amenities.
- Included utilities.
- Parking.
- Pet policy.
- Furnishing.
- Availability date.
- Commute times to frequent locations.
- User notes.
- Source.

Expected behavior:

- Compare tab defaults to favourite listings.
- Users can select which favourites to compare.
- Comparison table is horizontally scrollable on smaller screens.
- Important missing data is shown clearly as unavailable rather than blank.
- Users can sort or highlight listings by price and commute time.

### 6.8 Frequent Locations and Commutes

Users can add locations they visit often and evaluate commutes from rental properties.

Examples:

- Work.
- Gym.
- Church.
- School.
- Family.

Expected behavior:

- User can add a location with name, address, and optional category.
- System geocodes the address.
- User can edit or delete saved locations.
- Listing detail and compare views show commute estimates from each selected property to each saved location.
- MVP should support driving commute.
- Future versions may support transit, walking, cycling, and time-of-day commute estimates.

### 6.9 Modern UI

The interface should feel like a polished dashboard, not a marketing landing page.

Design principles:

- Map-first layout.
- Clean typography.
- Responsive panels.
- Clear listing cards.
- Fast filters.
- Subtle colour palette with strong contrast.
- Minimal visual clutter.
- Accessible focus states and keyboard navigation.
- Mobile responsive layout with map/list switching.

## 7. Proposed Information Architecture

- `/login`: User login.
- `/register`: User registration.
- `/dashboard`: Main map and listing browser.
- `/listing/:id`: Listing detail view.
- `/favourites`: Saved favourite listings.
- `/compare`: Favourite listing comparison.
- `/imports/facebook`: Facebook Marketplace import flow.
- `/locations`: Frequent location management.
- `/settings`: Account settings.

## 8. Suggested Technical Architecture

### Frontend

- React with Next.js or Vite.
- TypeScript.
- Mapbox GL JS, MapLibre GL, or Google Maps JavaScript API.
- Component system using Tailwind CSS, shadcn/ui, Radix UI, or a similar accessible UI layer.
- Client-side state management with React Query/TanStack Query for server data.

### Backend

- Node.js with NestJS, Express, or Fastify.
- REST or GraphQL API.
- PostgreSQL with PostGIS for geospatial queries.
- Redis for cache and background job coordination if needed.
- Background workers for listing ingestion, refreshes, geocoding, and commute calculation.

### External Services

- Listing data providers or source-specific adapters.
- Geocoding provider.
- Routing/commute provider.
- Authentication provider if not self-hosted.
- Object storage for imported listing images.

## 9. Data Model Draft

### User

- `id`
- `email`
- `password_hash`
- `name`
- `created_at`
- `updated_at`

### Listing

- `id`
- `source`
- `source_url`
- `external_id`
- `title`
- `description`
- `address`
- `latitude`
- `longitude`
- `price`
- `bedrooms`
- `bathrooms`
- `property_type`
- `availability_date`
- `created_at`
- `updated_at`
- `last_seen_at`

### ListingAmenity

- `id`
- `listing_id`
- `name`

### ListingImage

- `id`
- `listing_id`
- `url`
- `sort_order`

### Favourite

- `id`
- `user_id`
- `listing_id`
- `created_at`

### ImportedListing

- `id`
- `user_id`
- `listing_id`
- `import_url`
- `import_status`
- `user_notes`
- `created_at`
- `updated_at`

### FrequentLocation

- `id`
- `user_id`
- `name`
- `category`
- `address`
- `latitude`
- `longitude`
- `created_at`
- `updated_at`

### CommuteEstimate

- `id`
- `listing_id`
- `frequent_location_id`
- `travel_mode`
- `duration_minutes`
- `distance_km`
- `provider`
- `calculated_at`

## 10. Build Roadmap

### Phase 1: Product Foundation

- Set up frontend, backend, database, and local development environment.
- Implement authentication.
- Create base dashboard shell with navigation.
- Define normalized listing data model.
- Add seed listings for local development.
- Implement responsive layout and design system foundations.

Deliverable: A logged-in user can access a polished dashboard shell with seeded rental listings.

### Phase 2: Map-Based Listing Browser

- Integrate map provider.
- Render listings as markers or price pins.
- Add viewport-based listing querying.
- Add marker clustering at lower zoom levels.
- Add listing preview cards.
- Add basic filters.

Deliverable: Users can browse seeded or ingested listings on an interactive map.

### Phase 3: Favourites

- Add favourite and unfavourite actions.
- Persist favourites per user.
- Add favourites list view.
- Ensure favourites are available from map, card, and detail views.

Deliverable: Authenticated users can save and revisit favourite listings.

### Phase 4: Listing Source Integrations

- Build source adapter interface.
- Integrate first external source, starting with the most accessible legal data path.
- Add second source after adapter pattern is proven.
- Add scheduled refresh jobs.
- Track stale or removed listings.

Deliverable: Listings from at least one external rental source appear on the map.

### Phase 5: Facebook Marketplace Import

- Add Facebook Marketplace URL import form.
- Validate URL format.
- Create draft imported listing.
- Add manual metadata editing.
- Geocode imported listing address.
- Add imported listing to map and favourites.

Deliverable: Users can paste a Facebook Marketplace rental URL, complete listing details, and see it in their dashboard.

### Phase 6: Compare Tab

- Add compare view for favourites.
- Create comparison table.
- Add selection controls.
- Show missing data states.
- Add user notes.

Deliverable: Users can compare favourite listings by price, amenities, and key property details.

### Phase 7: Frequent Locations and Commutes

- Add frequent location CRUD.
- Geocode saved locations.
- Calculate commute estimates.
- Display commute data on listing detail and compare views.
- Cache commute results.

Deliverable: Users can compare properties based on commute times to their personal locations.

### Phase 8: Polish, Performance, and Launch Readiness

- Add loading, empty, and error states.
- Improve mobile responsiveness.
- Add accessibility pass.
- Add analytics and logging.
- Add integration monitoring.
- Add automated tests.
- Prepare deployment.

Deliverable: MVP is production-ready for a small beta.

## 11. User Stories and Acceptance Criteria

### Epic 1: Authentication

#### Story 1.1: Create an account

As a renter, I want to create an account so that my favourites, imports, and locations are saved.

Acceptance criteria:

- Given I am not logged in, when I submit a valid email and password, then my account is created.
- Given I submit an email that already exists, then I see a clear error message.
- Given my account is created, then I am redirected to the dashboard.

#### Story 1.2: Log in

As a returning renter, I want to log in so that I can access my saved rental search.

Acceptance criteria:

- Given I have an account, when I submit valid credentials, then I am logged in.
- Given I submit invalid credentials, then I see a clear error message.
- Given I am logged in, when I visit the dashboard, then I can see my saved data.

#### Story 1.3: Log out

As a renter, I want to log out so that my account is protected on shared devices.

Acceptance criteria:

- Given I am logged in, when I click log out, then my session ends.
- Given my session has ended, when I visit protected pages, then I am redirected to login.

### Epic 2: Map Listing Browser

#### Story 2.1: View listings on a map

As a renter, I want to see rental listings on a map so that I can understand where each property is located.

Acceptance criteria:

- Given listings exist with valid coordinates, when I open the dashboard, then listing markers appear on the map.
- Given I click a marker, then I see a listing preview with price, title, bedrooms, bathrooms, and source.
- Given a listing has no coordinates, then it does not appear on the map until location data is available.

#### Story 2.2: Update listings based on map viewport

As a renter, I want listings to update as I pan and zoom so that the map only shows relevant properties.

Acceptance criteria:

- Given I pan the map, when the viewport changes, then listings are refreshed for the visible area.
- Given I zoom out, then nearby listings may cluster to reduce clutter.
- Given I zoom in, then clusters split into individual listings.
- Given listings are loading, then the interface shows a non-blocking loading state.

#### Story 2.3: Filter map listings

As a renter, I want to filter listings so that I can focus on properties that match my needs.

Acceptance criteria:

- Given I set a price range, then only listings within that price range are shown.
- Given I select bedrooms or bathrooms, then only matching listings are shown.
- Given I change filters, then the map and listing list update together.
- Given no listings match, then I see a useful empty state.

### Epic 3: Favourites

#### Story 3.1: Favourite a listing

As a renter, I want to favourite listings so that I can shortlist properties I am considering.

Acceptance criteria:

- Given I am logged in, when I click favourite on a listing, then the listing is added to my favourites.
- Given I favourite a listing from the map preview, then the favourite state updates immediately.
- Given I refresh the page, then the listing remains favourited.

#### Story 3.2: Remove a favourite

As a renter, I want to remove a listing from favourites so that my shortlist stays current.

Acceptance criteria:

- Given a listing is favourited, when I click unfavourite, then it is removed from my favourites.
- Given I remove a favourite, then it no longer appears in my favourites view.
- Given I remove a favourite by mistake, then the interface provides clear feedback.

#### Story 3.3: View favourites

As a renter, I want a dedicated favourites view so that I can review my shortlist.

Acceptance criteria:

- Given I have favourites, when I open the favourites page, then I see all my saved listings.
- Given I have no favourites, then I see an empty state that directs me back to the map.
- Given a favourite listing is imported from Facebook Marketplace, then it appears with its source clearly labeled.

### Epic 4: Facebook Marketplace Import

#### Story 4.1: Import a Facebook Marketplace listing URL

As a renter, I want to paste a Facebook Marketplace rental URL so that I can track listings that are not available through standard sources.

Acceptance criteria:

- Given I am logged in, when I paste a valid Facebook Marketplace URL, then an imported listing draft is created.
- Given I paste a non-Facebook Marketplace URL, then I see a validation error.
- Given the URL has already been imported by me, then the system prevents a duplicate or opens the existing imported listing.

#### Story 4.2: Edit imported listing details

As a renter, I want to edit imported listing details so that I can fill in missing information.

Acceptance criteria:

- Given an imported listing draft exists, when I enter title, price, address, bedrooms, bathrooms, and amenities, then I can save the listing.
- Given I enter an address, then the system attempts to geocode it.
- Given geocoding succeeds, then the imported listing can appear on the map.
- Given required fields are missing, then the system shows field-level validation errors.

#### Story 4.3: Show imported listings on the map

As a renter, I want my imported Facebook Marketplace listings to appear on the map so that I can evaluate them alongside other rentals.

Acceptance criteria:

- Given my imported listing has coordinates, when I open the dashboard, then it appears on the map.
- Given another user imports a Facebook Marketplace listing, then I cannot see it unless it is from a shared public source.
- Given an imported listing is private to me, then it is visible only after I log in.

### Epic 5: Compare Favourites

#### Story 5.1: Open compare tab

As a renter, I want a compare tab so that I can evaluate my favourite listings side by side.

Acceptance criteria:

- Given I have favourite listings, when I open the compare tab, then my favourites are available for comparison.
- Given I have no favourites, then I see an empty state prompting me to add favourites.
- Given I select multiple favourites, then they appear in the comparison table.

#### Story 5.2: Compare property details

As a renter, I want to compare prices, amenities, and property details so that I can make a better rental decision.

Acceptance criteria:

- Given selected favourites have price data, then the compare table shows each price.
- Given selected favourites have amenities, then the compare table shows them in a consistent format.
- Given data is missing, then the field displays "Unavailable" or equivalent.
- Given I remove a listing from the comparison, then the table updates without losing the rest of my selection.

#### Story 5.3: Add notes to compared listings

As a renter, I want to add notes to listings so that I can remember my impressions.

Acceptance criteria:

- Given I am viewing a favourite listing, when I add a note, then it is saved to my account.
- Given I open the compare tab later, then my notes appear with the listing.
- Given I edit a note, then the updated note persists after refresh.

### Epic 6: Frequent Locations and Commutes

#### Story 6.1: Add frequent location

As a renter, I want to add places I frequent so that I can judge how convenient each property is.

Acceptance criteria:

- Given I am logged in, when I add a location name and address, then the location is saved.
- Given the address can be geocoded, then coordinates are stored.
- Given the address cannot be geocoded, then I see an error and can correct it.

#### Story 6.2: Manage frequent locations

As a renter, I want to edit and delete frequent locations so that they stay accurate.

Acceptance criteria:

- Given I have saved locations, when I open the locations page, then I can see them.
- Given I edit a location, then the updated address is re-geocoded.
- Given I delete a location, then it is removed from future commute comparisons.

#### Story 6.3: View commute estimates

As a renter, I want to see commute estimates from listings to my frequent locations so that I can compare convenience.

Acceptance criteria:

- Given a listing and frequent location both have coordinates, then the system can calculate a commute estimate.
- Given commute data exists, then listing detail shows commute duration and distance.
- Given I open the compare tab, then commute estimates appear for each selected listing and saved location.
- Given a commute provider fails, then the UI shows that commute data is temporarily unavailable.

### Epic 7: Developer and Admin Experience

#### Story 7.1: Add a new listing source adapter

As a developer, I want a source adapter interface so that new listing providers can be added cleanly.

Acceptance criteria:

- Given a new source adapter is implemented, then it can normalize source listings into the shared Listing model.
- Given an adapter fails, then the failure is logged without breaking other source imports.
- Given a listing already exists from the same source and external ID, then the existing listing is updated rather than duplicated.

#### Story 7.2: Monitor listing freshness

As a developer, I want to track listing freshness so that stale listings can be hidden or flagged.

Acceptance criteria:

- Given a listing is refreshed, then its `last_seen_at` timestamp is updated.
- Given a listing has not been seen after a configured threshold, then it can be marked stale.
- Given a listing is stale, then the UI can hide it or show a stale status.

#### Story 7.3: Maintain a modern map UI

As a developer, I want the dashboard to have a clean modern look so that the product feels trustworthy and pleasant to use.

Acceptance criteria:

- Given the dashboard loads, then the map is the dominant interface.
- Given the user opens filters, previews, or detail panels, then the controls do not obscure essential map interactions.
- Given the screen is mobile-sized, then map and listing views remain usable.
- Given keyboard navigation is used, then core actions are reachable and visible.

## 12. API Endpoint Draft

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Listings

- `GET /api/listings?bbox=&zoom=&filters=`
- `GET /api/listings/:id`
- `POST /api/listings/import/facebook`
- `PATCH /api/imported-listings/:id`

### Favourites

- `GET /api/favourites`
- `POST /api/favourites`
- `DELETE /api/favourites/:listingId`

### Compare

- `GET /api/compare?listingIds=`

### Frequent Locations

- `GET /api/locations`
- `POST /api/locations`
- `PATCH /api/locations/:id`
- `DELETE /api/locations/:id`

### Commutes

- `GET /api/commutes?listingIds=&locationIds=&travelMode=`

## 13. Quality and Testing Strategy

### Unit Tests

- Listing normalization.
- Favourite creation and removal.
- Facebook Marketplace URL validation.
- Geocoding response handling.
- Commute provider response mapping.

### Integration Tests

- Authentication and protected routes.
- Listing viewport queries.
- Favourites persistence.
- Imported listing creation.
- Frequent location CRUD.

### End-to-End Tests

- User signs up, browses map, favourites a listing, and sees it in favourites.
- User imports a Facebook Marketplace URL and adds it to the map.
- User adds work and gym locations, then compares commute times between favourite listings.

### Visual and UX Checks

- Desktop map layout.
- Mobile map/list workflow.
- Empty states.
- Loading states.
- Error states.
- Marker clustering behavior.

## 14. Risks and Mitigations

### External Listing Access

Risk: Rentals.ca and REW may not provide open APIs or may prohibit scraping.

Mitigation: Build source adapters and start with compliant data access paths. Use seed data during development.

### Facebook Marketplace Metadata

Risk: Facebook Marketplace URLs may not expose reliable structured listing data.

Mitigation: Treat Facebook imports as user-managed records in MVP. Add assisted extraction only where allowed.

### Map and Commute Costs

Risk: Geocoding and route APIs can become expensive.

Mitigation: Cache geocoding and commute results. Calculate commutes only for favourites or selected listings.

### Data Quality

Risk: Listings from different sources may have inconsistent fields.

Mitigation: Normalize source data, show missing fields clearly, and allow user notes for subjective details.

### Performance

Risk: Rendering many map markers can slow down the dashboard.

Mitigation: Use viewport queries, clustering, pagination, and map-source rendering techniques.

## 15. MVP Success Criteria

The MVP is successful when:

- A user can create an account and log in.
- A user can browse rental listings on an interactive map.
- The map updates by viewport and supports basic filtering.
- A user can favourite listings and return to them later.
- A user can import a Facebook Marketplace rental URL with manually entered details.
- Imported listings can appear on the map and in favourites.
- A user can add frequent locations.
- A user can compare favourites by price, amenities, and commute time.
- The interface feels clean, modern, and usable on desktop and mobile web.

