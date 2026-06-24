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
  getListingSourceOptions,
  importFacebookListing,
  importListingFeed,
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

test("imports approved listing feeds and exposes source filter options", () => {
  let state = registerUser(createInitialState(), "feeds@example.com");
  const firstImport = importListingFeed(state, {
    sourceName: "Partner Feed",
    sourceUrl: "https://partner.example/feed.json",
    complianceConfirmed: "on",
    payload: JSON.stringify({
      listings: [
        {
          externalId: "unit-101",
          title: "Partner downtown rental",
          price: 1725,
          bedrooms: 1,
          bathrooms: 1,
          propertyType: "Apartment",
          address: "Downtown Calgary",
          lat: 51.046,
          lng: -114.07,
          amenities: ["Parking", "Laundry"],
          availability: "2026-08-01",
          url: "https://partner.example/listings/unit-101"
        }
      ]
    })
  });

  state = firstImport.state;
  assert.deepEqual(firstImport.summary, {
    addedCount: 1,
    updatedCount: 0,
    totalCount: 1
  });

  const imported = state.sourceListingsByUser[state.currentUser][0];
  assert.equal(imported.source, "Partner Feed");
  assert.equal(imported.price, 1725);
  assert.equal(imported.feedImported, true);
  assert.deepEqual(imported.amenities, ["Parking", "Laundry"]);
  assert.equal(getListingSourceOptions([...seedListings, imported]).includes("Partner Feed"), true);

  const secondImport = importListingFeed(state, {
    sourceName: "Partner Feed",
    sourceUrl: "https://partner.example/feed.json",
    complianceConfirmed: true,
    payload: JSON.stringify([
      {
        externalId: "unit-101",
        title: "Partner downtown rental",
        price: 1695,
        address: "Downtown Calgary",
        lat: 51.046,
        lng: -114.07,
        url: "https://partner.example/listings/unit-101"
      }
    ])
  });

  assert.equal(secondImport.summary.addedCount, 0);
  assert.equal(secondImport.summary.updatedCount, 1);
  assert.equal(secondImport.state.sourceListingsByUser[state.currentUser][0].price, 1695);
});

test("rejects listing feed imports without authorization confirmation", () => {
  const state = registerUser(createInitialState(), "blocked-feed@example.com");
  assert.throws(
    () =>
      importListingFeed(state, {
        sourceName: "Unapproved Feed",
        payload: "[]"
      }),
    /Confirm that this feed is authorized/
  );
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
