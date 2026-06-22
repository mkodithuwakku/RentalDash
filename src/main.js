import {
  addFrequentLocation,
  buildComparisonRows,
  calculateCommute,
  createInitialState,
  filterListings,
  getCurrentUser,
  getFavouriteIds,
  getUserListings,
  getVisibleListings,
  importFacebookListing,
  loginUser,
  logoutUser,
  markerPosition,
  registerUser,
  removeFrequentLocation,
  toggleFavourite
} from "./rentaldash.js";

const storageKey = "rentaldash.state.v1";
const app = document.querySelector("#app");
let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return stored ? { ...createInitialState(), ...stored } : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function update(nextState) {
  state = nextState;
  saveState();
  render();
}

function action(callback) {
  try {
    callback();
  } catch (error) {
    renderToast(error.message);
  }
}

function render() {
  const user = getCurrentUser(state);
  const allListings = getUserListings(state);
  const favouriteIds = getFavouriteIds(state);
  const filtered = filterListings(allListings, state.filters, favouriteIds);
  const visible = getVisibleListings(filtered, state.map);
  const selectedListing =
    allListings.find((listing) => listing.id === state.selectedListingId) || visible[0] || null;

  app.innerHTML = `
    <section class="chrome">
      <aside class="sidebar">
        <div class="brand-row">
          <div class="brand-mark">R</div>
          <div>
            <h1>RentalDash</h1>
            <p>${user ? user.email : "Local MVP"}</p>
          </div>
        </div>
        ${renderAuth(user)}
        <nav class="nav-tabs" aria-label="Primary">
          ${navButton("dashboard", "Map")}
          ${navButton("favourites", "Favourites")}
          ${navButton("compare", "Compare")}
          ${navButton("locations", "Locations")}
          ${navButton("import", "Import")}
        </nav>
        ${renderFilters()}
      </aside>
      <section class="workspace">
        ${renderView({ user, allListings, filtered, visible, selectedListing, favouriteIds })}
      </section>
    </section>
  `;

  bindEvents();
}

function navButton(view, label) {
  return `<button class="${state.view === view ? "active" : ""}" data-view="${view}">${label}</button>`;
}

function renderAuth(user) {
  if (user) {
    return `
      <div class="auth-card">
        <strong>${user.name}</strong>
        <button class="secondary" data-action="logout">Log out</button>
      </div>
    `;
  }
  return `
    <form class="auth-card" data-form="auth">
      <label>
        Email
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label>
        Name
        <input name="name" placeholder="Optional" />
      </label>
      <div class="button-row">
        <button type="submit" name="intent" value="login">Log in</button>
        <button type="submit" name="intent" value="register" class="secondary">Register</button>
      </div>
    </form>
  `;
}

function renderFilters() {
  return `
    <form class="filters" data-form="filters">
      <h2>Filters</h2>
      <label>
        Max price
        <input name="maxPrice" type="range" min="1000" max="4000" step="50" value="${state.filters.maxPrice}" />
        <span>$${state.filters.maxPrice}</span>
      </label>
      <label>
        Bedrooms
        <select name="bedrooms">
          ${option("any", "Any", state.filters.bedrooms)}
          ${option("0", "Studio+", state.filters.bedrooms)}
          ${option("1", "1+", state.filters.bedrooms)}
          ${option("2", "2+", state.filters.bedrooms)}
        </select>
      </label>
      <label>
        Source
        <select name="source">
          ${option("any", "Any", state.filters.source)}
          ${option("Rentals.ca", "Rentals.ca", state.filters.source)}
          ${option("REW", "REW", state.filters.source)}
          ${option("Facebook Marketplace", "Facebook", state.filters.source)}
        </select>
      </label>
      <label class="check-row">
        <input name="favouritesOnly" type="checkbox" ${state.filters.favouritesOnly ? "checked" : ""} />
        Favourites only
      </label>
    </form>
  `;
}

function option(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function renderView(context) {
  if (state.view === "compare") return renderCompare(context);
  if (state.view === "locations") return renderLocations(context);
  if (state.view === "import") return renderImport(context.user);
  if (state.view === "favourites") return renderFavourites(context);
  return renderDashboard(context);
}

function renderDashboard({ visible, selectedListing, favouriteIds }) {
  return `
    <div class="map-layout">
      <section class="map-panel">
        <div class="map-toolbar">
          <div>
            <strong>${visible.length} visible listings</strong>
            <span>Zoom ${state.map.zoom}</span>
          </div>
          <div class="map-controls">
            <button data-map="west" title="Pan west">←</button>
            <button data-map="north" title="Pan north">↑</button>
            <button data-map="south" title="Pan south">↓</button>
            <button data-map="east" title="Pan east">→</button>
            <button data-map="zoomOut" title="Zoom out">−</button>
            <button data-map="zoomIn" title="Zoom in">+</button>
          </div>
        </div>
        <div class="map-canvas" role="application" aria-label="Interactive rental map">
          <div class="map-grid"></div>
          ${visible.map((listing) => renderMarker(listing, favouriteIds)).join("")}
        </div>
      </section>
      <aside class="detail-panel">
        ${selectedListing ? renderListingDetail(selectedListing, favouriteIds) : renderEmpty("No listings in view", "Adjust filters or move the map.")}
      </aside>
    </div>
  `;
}

function renderMarker(listing, favouriteIds) {
  const position = markerPosition(listing, state.map);
  return `
    <button class="price-pin ${favouriteIds.includes(listing.id) ? "saved" : ""}" style="left:${position.left}%;top:${position.top}%;" data-select="${listing.id}">
      $${listing.price}
    </button>
  `;
}

function renderListingDetail(listing, favouriteIds) {
  const locations = state.currentUser ? state.locationsByUser[state.currentUser] || [] : [];
  return `
    <article class="listing-detail">
      <img src="${listing.image}" alt="${listing.title}" />
      <div class="listing-heading">
        <div>
          <span class="source">${listing.source}</span>
          <h2>${listing.title}</h2>
          <p>${listing.address}</p>
        </div>
        <button class="save-button ${favouriteIds.includes(listing.id) ? "saved" : ""}" data-favourite="${listing.id}">
          ${favouriteIds.includes(listing.id) ? "Saved" : "Save"}
        </button>
      </div>
      <dl class="facts">
        <div><dt>Price</dt><dd>$${listing.price}</dd></div>
        <div><dt>Beds</dt><dd>${listing.bedrooms === 0 ? "Studio" : listing.bedrooms}</dd></div>
        <div><dt>Baths</dt><dd>${listing.bathrooms}</dd></div>
        <div><dt>Type</dt><dd>${listing.propertyType}</dd></div>
      </dl>
      <section>
        <h3>Amenities</h3>
        <div class="chips">${listing.amenities.map((amenity) => `<span>${amenity}</span>`).join("")}</div>
      </section>
      <section>
        <h3>Commutes</h3>
        ${
          locations.length
            ? locations.map((location) => renderCommute(listing, location)).join("")
            : `<p class="muted">Add frequent locations to see commute estimates.</p>`
        }
      </section>
      <a class="external-link" href="${listing.url}" target="_blank" rel="noreferrer">Open source listing</a>
    </article>
  `;
}

function renderCommute(listing, location) {
  const commute = calculateCommute(listing, location);
  return `
    <div class="commute-row">
      <span>${location.name}</span>
      <strong>${commute.durationMinutes} min</strong>
      <span>${commute.distanceKm} km</span>
    </div>
  `;
}

function renderFavourites({ allListings, favouriteIds }) {
  const favourites = allListings.filter((listing) => favouriteIds.includes(listing.id));
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Favourites</h2>
        <p>${favourites.length} saved listings</p>
      </div>
      ${
        favourites.length
          ? `<div class="listing-grid">${favourites.map((listing) => renderListingCard(listing, favouriteIds)).join("")}</div>`
          : renderEmpty("No favourites yet", "Save listings from the map to build your shortlist.")
      }
    </section>
  `;
}

function renderListingCard(listing, favouriteIds) {
  return `
    <article class="listing-card">
      <img src="${listing.image}" alt="${listing.title}" />
      <div>
        <span class="source">${listing.source}</span>
        <h3>${listing.title}</h3>
        <p>${listing.address}</p>
        <strong>$${listing.price}</strong>
        <button class="secondary" data-select="${listing.id}">View on map</button>
        <button class="save-button ${favouriteIds.includes(listing.id) ? "saved" : ""}" data-favourite="${listing.id}">
          ${favouriteIds.includes(listing.id) ? "Saved" : "Save"}
        </button>
      </div>
    </article>
  `;
}

function renderCompare({ allListings, favouriteIds }) {
  const favourites = allListings.filter((listing) => favouriteIds.includes(listing.id));
  const locations = state.currentUser ? state.locationsByUser[state.currentUser] || [] : [];
  const rows = buildComparisonRows(favourites, locations);
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Compare</h2>
        <p>Side-by-side favourite listing review</p>
      </div>
      ${
        rows.length
          ? `<div class="compare-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Price</th>
                    <th>Beds</th>
                    <th>Baths</th>
                    <th>Amenities</th>
                    <th>Availability</th>
                    <th>Commutes</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(renderCompareRow).join("")}
                </tbody>
              </table>
            </div>`
          : renderEmpty("Nothing to compare", "Favourite a few listings first.")
      }
    </section>
  `;
}

function renderCompareRow(row) {
  return `
    <tr>
      <td><strong>${row.title}</strong><br /><span>${row.source}</span></td>
      <td>$${row.price}</td>
      <td>${row.bedrooms === 0 ? "Studio" : row.bedrooms}</td>
      <td>${row.bathrooms}</td>
      <td>${row.amenities}</td>
      <td>${row.availability}</td>
      <td>
        ${
          row.commutes.length
            ? row.commutes.map((commute) => `${commute.locationName}: ${commute.durationMinutes} min`).join("<br />")
            : "Add locations"
        }
      </td>
    </tr>
  `;
}

function renderLocations({ user }) {
  if (!user) return renderGate("Log in to manage frequent locations.");
  const locations = state.locationsByUser[state.currentUser] || [];
  return `
    <section class="page-panel two-column">
      <div>
        <div class="page-heading">
          <h2>Frequent Locations</h2>
          <p>Use coordinates for now; geocoding provider arrives in a later phase.</p>
        </div>
        <form class="stack-form" data-form="location">
          <label>Name<input name="name" placeholder="Work" required /></label>
          <label>Category<input name="category" placeholder="Work, gym, church" /></label>
          <label>Address<input name="address" placeholder="123 Main St" /></label>
          <div class="split-row">
            <label>Latitude<input name="lat" type="number" step="0.001" placeholder="51.044" required /></label>
            <label>Longitude<input name="lng" type="number" step="0.001" placeholder="-114.071" required /></label>
          </div>
          <button type="submit">Add location</button>
        </form>
      </div>
      <div class="location-list">
        ${
          locations.length
            ? locations.map(renderLocation).join("")
            : renderEmpty("No locations yet", "Add work, gym, church, school, or any place you visit often.")
        }
      </div>
    </section>
  `;
}

function renderLocation(location) {
  return `
    <article class="location-card">
      <div>
        <strong>${location.name}</strong>
        <p>${location.category} · ${location.address || "No address"}</p>
      </div>
      <button class="secondary" data-remove-location="${location.id}">Remove</button>
    </article>
  `;
}

function renderImport(user) {
  if (!user) return renderGate("Log in to import Facebook Marketplace listings.");
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Import Facebook Listing</h2>
        <p>Paste the link and fill in the practical details you want to compare.</p>
      </div>
      <form class="stack-form import-form" data-form="facebook">
        <label>Facebook Marketplace URL<input name="url" type="url" placeholder="https://www.facebook.com/marketplace/item/..." required /></label>
        <label>Title<input name="title" placeholder="Basement suite near downtown" required /></label>
        <div class="split-row">
          <label>Price<input name="price" type="number" min="0" required /></label>
          <label>Type<input name="propertyType" placeholder="Apartment" /></label>
        </div>
        <div class="split-row">
          <label>Bedrooms<input name="bedrooms" type="number" min="0" value="1" /></label>
          <label>Bathrooms<input name="bathrooms" type="number" min="0" step="0.5" value="1" /></label>
        </div>
        <label>Address<input name="address" placeholder="Neighbourhood or full address" /></label>
        <div class="split-row">
          <label>Latitude<input name="lat" type="number" step="0.001" required /></label>
          <label>Longitude<input name="lng" type="number" step="0.001" required /></label>
        </div>
        <label>Amenities<input name="amenities" placeholder="Parking, laundry, pet friendly" /></label>
        <label>Notes<textarea name="notes" placeholder="Viewing notes, landlord details, concerns"></textarea></label>
        <button type="submit">Import and favourite</button>
      </form>
    </section>
  `;
}

function renderEmpty(title, body) {
  return `<div class="empty-state"><strong>${title}</strong><p>${body}</p></div>`;
}

function renderGate(message) {
  return `<section class="page-panel">${renderEmpty("Login required", message)}</section>`;
}

function renderToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => update({ ...state, view: button.dataset.view }));
  });
  document.querySelector("[data-action='logout']")?.addEventListener("click", () => update(logoutUser(state)));
  document.querySelector("[data-form='auth']")?.addEventListener("submit", handleAuth);
  document.querySelector("[data-form='filters']")?.addEventListener("input", handleFilters);
  document.querySelector("[data-form='facebook']")?.addEventListener("submit", handleFacebookImport);
  document.querySelector("[data-form='location']")?.addEventListener("submit", handleLocation);
  document.querySelectorAll("[data-favourite]").forEach((button) => {
    button.addEventListener("click", () => action(() => update(toggleFavourite(state, button.dataset.favourite))));
  });
  document.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const listing = getUserListings(state).find((item) => item.id === button.dataset.select);
      update({
        ...state,
        view: "dashboard",
        selectedListingId: button.dataset.select,
        map: listing ? { ...state.map, centerLat: listing.lat, centerLng: listing.lng } : state.map
      });
    });
  });
  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => update({ ...state, map: nextMapState(button.dataset.map) }));
  });
  document.querySelectorAll("[data-remove-location]").forEach((button) => {
    button.addEventListener("click", () => update(removeFrequentLocation(state, button.dataset.removeLocation)));
  });
}

function handleAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const intent = event.submitter?.value;
  action(() => {
    update(
      intent === "register"
        ? registerUser(state, form.get("email"), form.get("name"))
        : loginUser(state, form.get("email"))
    );
  });
}

function handleFilters(event) {
  const form = new FormData(event.currentTarget);
  update({
    ...state,
    filters: {
      maxPrice: Number(form.get("maxPrice")),
      bedrooms: form.get("bedrooms"),
      source: form.get("source"),
      favouritesOnly: form.get("favouritesOnly") === "on"
    }
  });
}

function handleFacebookImport(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  action(() => update({ ...importFacebookListing(state, values), view: "dashboard" }));
}

function handleLocation(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  action(() => update(addFrequentLocation(state, values)));
}

function nextMapState(intent) {
  const step = 2 / state.map.zoom;
  const next = { ...state.map };
  if (intent === "north") next.centerLat += step;
  if (intent === "south") next.centerLat -= step;
  if (intent === "east") next.centerLng += step;
  if (intent === "west") next.centerLng -= step;
  if (intent === "zoomIn") next.zoom = Math.min(10, next.zoom + 1);
  if (intent === "zoomOut") next.zoom = Math.max(2, next.zoom - 1);
  return next;
}

render();
