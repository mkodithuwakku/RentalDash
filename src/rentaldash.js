export const seedListings = [
  {
    id: "rentals-ca-001",
    source: "Rentals.ca",
    title: "Bright Beltline One Bedroom",
    price: 1675,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Apartment",
    address: "121 12 Ave SW, Calgary, AB",
    lat: 51.041,
    lng: -114.073,
    amenities: ["Parking", "Balcony", "Laundry"],
    availability: "2026-06-01",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    url: "https://rentals.ca/",
    imported: false
  },
  {
    id: "rew-001",
    source: "REW",
    title: "Kitsilano Garden Suite",
    price: 2450,
    bedrooms: 1,
    bathrooms: 1,
    propertyType: "Suite",
    address: "West 4th Ave, Vancouver, BC",
    lat: 49.268,
    lng: -123.167,
    amenities: ["Pet friendly", "In-suite laundry", "Storage"],
    availability: "2026-06-15",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80",
    url: "https://www.rew.ca/",
    imported: false
  },
  {
    id: "rentals-ca-002",
    source: "Rentals.ca",
    title: "Oliver Two Bedroom Near River Valley",
    price: 1895,
    bedrooms: 2,
    bathrooms: 1,
    propertyType: "Condo",
    address: "103 Ave NW, Edmonton, AB",
    lat: 53.543,
    lng: -113.519,
    amenities: ["Gym", "Parking", "Dishwasher"],
    availability: "2026-07-01",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    url: "https://rentals.ca/",
    imported: false
  },
  {
    id: "rew-002",
    source: "REW",
    title: "Downtown Victoria Studio",
    price: 1625,
    bedrooms: 0,
    bathrooms: 1,
    propertyType: "Studio",
    address: "Fort St, Victoria, BC",
    lat: 48.426,
    lng: -123.361,
    amenities: ["Bike storage", "Laundry", "Utilities included"],
    availability: "2026-05-20",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
    url: "https://www.rew.ca/",
    imported: false
  }
];

export const defaultState = {
  currentUser: null,
  users: [],
  favouritesByUser: {},
  importedByUser: {},
  locationsByUser: {},
  view: "dashboard",
  selectedListingId: null,
  filters: {
    maxPrice: 3000,
    bedrooms: "any",
    source: "any",
    favouritesOnly: false
  },
  map: {
    centerLat: 51.8,
    centerLng: -119.5,
    zoom: 4
  }
};

export function createInitialState() {
  return structuredClone(defaultState);
}

export function isFacebookMarketplaceUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    return host === "facebook.com" && url.pathname.toLowerCase().includes("/marketplace/");
  } catch {
    return false;
  }
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function registerUser(state, email, name = "") {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail.includes("@")) {
    throw new Error("Use a valid email address.");
  }
  if (state.users.some((user) => user.email === normalizedEmail)) {
    throw new Error("That email already has an account.");
  }
  const user = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    name: name.trim() || normalizedEmail.split("@")[0]
  };
  return {
    ...state,
    currentUser: user.id,
    users: [...state.users, user],
    favouritesByUser: { ...state.favouritesByUser, [user.id]: [] },
    importedByUser: { ...state.importedByUser, [user.id]: [] },
    locationsByUser: { ...state.locationsByUser, [user.id]: [] }
  };
}

export function loginUser(state, email) {
  const normalizedEmail = normalizeEmail(email);
  const user = state.users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) {
    throw new Error("No account exists for that email.");
  }
  return { ...state, currentUser: user.id };
}

export function logoutUser(state) {
  return { ...state, currentUser: null, view: "dashboard", selectedListingId: null };
}

export function getCurrentUser(state) {
  return state.users.find((user) => user.id === state.currentUser) || null;
}

export function getUserListings(state) {
  const imported = state.currentUser ? state.importedByUser[state.currentUser] || [] : [];
  return [...seedListings, ...imported];
}

export function getFavouriteIds(state) {
  if (!state.currentUser) return [];
  return state.favouritesByUser[state.currentUser] || [];
}

export function toggleFavourite(state, listingId) {
  requireUser(state);
  const current = getFavouriteIds(state);
  const next = current.includes(listingId)
    ? current.filter((id) => id !== listingId)
    : [...current, listingId];
  return {
    ...state,
    favouritesByUser: {
      ...state.favouritesByUser,
      [state.currentUser]: next
    }
  };
}

export function importFacebookListing(state, form) {
  requireUser(state);
  if (!isFacebookMarketplaceUrl(form.url)) {
    throw new Error("Paste a valid Facebook Marketplace listing URL.");
  }
  const existing = (state.importedByUser[state.currentUser] || []).find(
    (listing) => listing.url === form.url
  );
  if (existing) {
    throw new Error("You already imported that Facebook Marketplace listing.");
  }
  const title = form.title.trim();
  const price = Number(form.price);
  const lat = Number(form.lat);
  const lng = Number(form.lng);
  if (!title || !Number.isFinite(price) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Title, price, latitude, and longitude are required.");
  }
  const listing = {
    id: `facebook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: "Facebook Marketplace",
    title,
    price,
    bedrooms: Number(form.bedrooms || 0),
    bathrooms: Number(form.bathrooms || 1),
    propertyType: form.propertyType || "Rental",
    address: form.address.trim(),
    lat,
    lng,
    amenities: parseAmenities(form.amenities),
    availability: form.availability || "Flexible",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    url: form.url,
    notes: form.notes?.trim() || "",
    imported: true
  };
  const nextImported = [...(state.importedByUser[state.currentUser] || []), listing];
  const nextFavourites = [...new Set([...getFavouriteIds(state), listing.id])];
  return {
    ...state,
    importedByUser: {
      ...state.importedByUser,
      [state.currentUser]: nextImported
    },
    favouritesByUser: {
      ...state.favouritesByUser,
      [state.currentUser]: nextFavourites
    },
    selectedListingId: listing.id
  };
}

export function addFrequentLocation(state, form) {
  requireUser(state);
  const name = form.name.trim();
  const lat = Number(form.lat);
  const lng = Number(form.lng);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Location name, latitude, and longitude are required.");
  }
  const location = {
    id: `location-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    category: form.category || "Personal",
    address: form.address.trim(),
    lat,
    lng
  };
  return {
    ...state,
    locationsByUser: {
      ...state.locationsByUser,
      [state.currentUser]: [...(state.locationsByUser[state.currentUser] || []), location]
    }
  };
}

export function removeFrequentLocation(state, locationId) {
  requireUser(state);
  return {
    ...state,
    locationsByUser: {
      ...state.locationsByUser,
      [state.currentUser]: (state.locationsByUser[state.currentUser] || []).filter(
        (location) => location.id !== locationId
      )
    }
  };
}

export function filterListings(listings, filters, favouriteIds = []) {
  return listings.filter((listing) => {
    if (listing.price > Number(filters.maxPrice)) return false;
    if (filters.bedrooms !== "any" && listing.bedrooms < Number(filters.bedrooms)) return false;
    if (filters.source !== "any" && listing.source !== filters.source) return false;
    if (filters.favouritesOnly && !favouriteIds.includes(listing.id)) return false;
    return true;
  });
}

export function getVisibleListings(listings, mapState) {
  const latSpan = Math.max(1, 16 / Number(mapState.zoom));
  const lngSpan = Math.max(1.6, 24 / Number(mapState.zoom));
  return listings.filter((listing) => {
    return (
      Math.abs(listing.lat - mapState.centerLat) <= latSpan &&
      Math.abs(listing.lng - mapState.centerLng) <= lngSpan
    );
  });
}

export function markerPosition(listing, mapState) {
  const latSpan = Math.max(1, 16 / Number(mapState.zoom));
  const lngSpan = Math.max(1.6, 24 / Number(mapState.zoom));
  const x = 50 + ((listing.lng - mapState.centerLng) / lngSpan) * 50;
  const y = 50 - ((listing.lat - mapState.centerLat) / latSpan) * 50;
  return {
    left: clamp(x, 4, 92),
    top: clamp(y, 8, 88)
  };
}

export function calculateCommute(listing, location, mode = "driving") {
  const distanceKm = haversineKm(listing.lat, listing.lng, location.lat, location.lng);
  const speedByMode = {
    driving: 42,
    transit: 26,
    cycling: 16,
    walking: 5
  };
  const speed = speedByMode[mode] || speedByMode.driving;
  return {
    distanceKm: Number(distanceKm.toFixed(1)),
    durationMinutes: Math.max(1, Math.round((distanceKm / speed) * 60))
  };
}

export function buildComparisonRows(listings, locations = []) {
  return listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    source: listing.source,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    amenities: listing.amenities.join(", ") || "Unavailable",
    availability: listing.availability || "Unavailable",
    commutes: locations.map((location) => ({
      locationName: location.name,
      ...calculateCommute(listing, location)
    }))
  }));
}

function requireUser(state) {
  if (!state.currentUser) {
    throw new Error("Log in to use this feature.");
  }
}

function parseAmenities(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}
