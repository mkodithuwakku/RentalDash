import test from "node:test";
import assert from "node:assert/strict";
import {
  addFrequentLocation,
  buildComparisonRows,
  calculateCommute,
  createInitialState,
  filterListings,
  getFavouriteIds,
  getFavouriteNotes,
  importFacebookListing,
  isFacebookMarketplaceUrl,
  locationAreaBounds,
  loginUser,
  registerUser,
  seedListings,
  sortComparisonRows,
  toggleFavourite,
  updateFavouriteNote,
  updateImportedListing
} from "../src/rentaldash.js";

test("validates Facebook Marketplace URLs", () => {
  assert.equal(
    isFacebookMarketplaceUrl("https://www.facebook.com/marketplace/item/123456789"),
    true
  );
  assert.equal(isFacebookMarketplaceUrl("https://rentals.ca/calgary/123"), false);
  assert.equal(isFacebookMarketplaceUrl("not a url"), false);
});

test("registers and logs in a user with normalized email", () => {
  let state = createInitialState();

  state = registerUser(state, "USER@Example.com", "Mika");
  assert.equal(state.users[0].email, "user@example.com");
  assert.equal(state.currentUser, state.users[0].id);

  state = { ...state, currentUser: null };
  state = loginUser(state, "user@example.com");
  assert.equal(state.currentUser, state.users[0].id);
});

test("toggles favourites for the current user", () => {
  let state = registerUser(createInitialState(), "renter@example.com");

  state = toggleFavourite(state, "rentals-ca-001");
  assert.deepEqual(getFavouriteIds(state), ["rentals-ca-001"]);

  state = toggleFavourite(state, "rentals-ca-001");
  assert.deepEqual(getFavouriteIds(state), []);
});

test("filters listings by price, bedrooms, source, and favourites", () => {
  const filtered = filterListings(
    seedListings,
    {
      maxPrice: 1900,
      bedrooms: "1",
      source: "Rentals.ca",
      favouritesOnly: false
    },
    []
  );

  assert.deepEqual(
    filtered.map((listing) => listing.id),
    ["rentals-ca-001", "rentals-ca-002"]
  );

  const favouritesOnly = filterListings(
    seedListings,
    {
      maxPrice: 4000,
      bedrooms: "any",
      source: "any",
      favouritesOnly: true
    },
    ["rew-001"]
  );

  assert.deepEqual(
    favouritesOnly.map((listing) => listing.id),
    ["rew-001"]
  );
});

test("imports a Facebook listing and favourites it", () => {
  let state = registerUser(createInitialState(), "importer@example.com");

  state = importFacebookListing(state, {
    url: "https://www.facebook.com/marketplace/item/987",
    title: "Facebook basement suite",
    price: "1550",
    bedrooms: "1",
    bathrooms: "1",
    propertyType: "Suite",
    address: "Calgary, AB",
    lat: "51.05",
    lng: "-114.08",
    amenities: "Parking, Laundry"
  });

  const imported = state.importedByUser[state.currentUser][0];
  assert.equal(imported.source, "Facebook Marketplace");
  assert.equal(imported.price, 1550);
  assert.deepEqual(imported.amenities, ["Parking", "Laundry"]);
  assert.equal(getFavouriteIds(state).includes(imported.id), true);
});

test("updates imported Facebook listing details", () => {
  let state = registerUser(createInitialState(), "editor@example.com");
  state = importFacebookListing(state, {
    url: "https://www.facebook.com/marketplace/item/111",
    title: "Original suite",
    price: "1550",
    bedrooms: "1",
    bathrooms: "1",
    propertyType: "Suite",
    address: "Calgary, AB",
    lat: "51.05",
    lng: "-114.08",
    amenities: "Parking",
    notes: "Original note"
  });

  const listingId = state.importedByUser[state.currentUser][0].id;
  state = updateImportedListing(state, listingId, {
    url: "https://www.facebook.com/marketplace/item/111",
    title: "Updated suite",
    price: "1650",
    bedrooms: "2",
    bathrooms: "1.5",
    propertyType: "Basement",
    address: "Beltline, Calgary, AB",
    lat: "51.044",
    lng: "-114.071",
    availability: "2026-08-01",
    amenities: "Parking, Laundry",
    notes: "Updated note"
  });

  const updated = state.importedByUser[state.currentUser][0];
  assert.equal(updated.title, "Updated suite");
  assert.equal(updated.price, 1650);
  assert.equal(updated.bathrooms, 1.5);
  assert.deepEqual(updated.amenities, ["Parking", "Laundry"]);
  assert.equal(updated.notes, "Updated note");
});

test("saves favourite notes for comparison", () => {
  let state = registerUser(createInitialState(), "notes@example.com");
  state = toggleFavourite(state, "rentals-ca-001");
  state = updateFavouriteNote(state, "rentals-ca-001", "Great light, ask about parking.");

  assert.equal(getFavouriteNotes(state)["rentals-ca-001"], "Great light, ask about parking.");

  const rows = buildComparisonRows([seedListings[0]], [], getFavouriteNotes(state));
  assert.equal(rows[0].notes, "Great light, ask about parking.");
});

test("adds frequent locations and builds comparison commute rows", () => {
  let state = registerUser(createInitialState(), "commuter@example.com");
  state = addFrequentLocation(state, {
    name: "Work",
    category: "Work",
    address: "Downtown",
    lat: "51.044",
    lng: "-114.071"
  });

  const location = state.locationsByUser[state.currentUser][0];
  const commute = calculateCommute(seedListings[0], location);
  assert.equal(commute.distanceKm >= 0, true);
  assert.equal(commute.durationMinutes >= 1, true);

  const rows = buildComparisonRows([seedListings[0]], [location]);
  assert.equal(rows[0].commutes[0].locationName, "Work");
});

test("sorts comparison rows and highlights lowest price and fastest commute", () => {
  const rows = buildComparisonRows([seedListings[0], seedListings[2]], [
    {
      id: "location-1",
      name: "Work",
      category: "Work",
      address: "Downtown",
      lat: 51.044,
      lng: -114.071
    }
  ]);

  const byPrice = sortComparisonRows(rows, "price");
  assert.deepEqual(
    byPrice.map((row) => row.id),
    ["rentals-ca-001", "rentals-ca-002"]
  );
  assert.equal(byPrice[0].isCheapest, true);

  const byCommute = sortComparisonRows(rows, "commute");
  assert.equal(byCommute[0].isFastest, true);
});

test("calculates a 100 square km location search area", () => {
  const bounds = locationAreaBounds(53.5461, -113.4938);
  assert.equal(Number((bounds.north - bounds.south).toFixed(3)), 0.09);
  assert.equal(bounds.west < -113.4938, true);
  assert.equal(bounds.east > -113.4938, true);
});
