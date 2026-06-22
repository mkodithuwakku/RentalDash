import test from "node:test";
import assert from "node:assert/strict";
import {
  addFrequentLocation,
  buildComparisonRows,
  calculateCommute,
  createInitialState,
  filterListings,
  getFavouriteIds,
  importFacebookListing,
  isFacebookMarketplaceUrl,
  loginUser,
  registerUser,
  seedListings,
  toggleFavourite
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
