import {
  addFrequentLocation,
  buildComparisonRows,
  calculateCommute,
  createInitialState,
  filterListings,
  getCurrentUser,
  getFavouriteIds,
  getFavouriteNotes,
  getListingSourceOptions,
  getUserListings,
  getVisibleListings,
  importFacebookListing,
  importListingFeed,
  locationAreaBounds,
  loginUser,
  logoutUser,
  markerPosition,
  registerUser,
  removeFrequentLocation,
  sortComparisonRows,
  toggleFavourite,
  updateFavouriteNote,
  updateImportedListing
} from "./rentaldash.js";
import {
  fitMapToBounds,
  flyMapTo,
  getMaxMapZoom,
  getMapStyleUrl,
  initMapLibreMap,
  setMapStyleUrl,
  teardownMapLibreMap
} from "./maplibre-map.js";

const storageKey = "rentaldash.state.v1";
const canadaCatalogFeedUrl = "/data/canada-rental-catalog.json";
const app = document.querySelector("#app");
let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return stored ? migrateStoredState({ ...createInitialState(), ...stored }) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function migrateStoredState(stored) {
  if ((stored.publicSourceListings || []).length || !stored.sourceListingsByUser) {
    return stored;
  }
  return {
    ...stored,
    publicSourceListings: Object.values(stored.sourceListingsByUser).flat()
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function update(nextState) {
  state = { ...nextState, notice: nextState.notice ?? null };
  saveState();
  render();
}

function action(callback, successMessage) {
  try {
    callback();
    if (successMessage) {
      update({ ...state, notice: { type: "success", message: successMessage } });
    }
  } catch (error) {
    update({ ...state, notice: { type: "error", message: error.message } });
  }
}

function render() {
  teardownMapLibreMap();
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
          ${navButton("sources", "Sources")}
          ${navButton("import", "Import")}
        </nav>
        ${renderFilters(allListings)}
        ${renderMapProviderControls()}
      </aside>
      <section class="workspace">
        ${state.notice ? renderNotice(state.notice) : ""}
        ${renderView({ user, allListings, filtered, visible, selectedListing, favouriteIds })}
      </section>
    </section>
  `;

  bindEvents();
  initDashboardMap({ filtered, visible, favouriteIds });
  maybeCenterOnUserLocation();
}

async function loadCanadaCatalogFeed() {
  state = { ...state, catalogFeedStatus: "loading" };
  saveState();
  try {
    const response = await fetch(canadaCatalogFeedUrl);
    if (!response.ok) throw new Error("Catalog feed unavailable");
    const feed = await response.json();
    const result = importListingFeed(state, {
      sourceName: feed.sourceName || "RentalDash Canada Catalog",
      sourceUrl: feed.sourceUrl || canadaCatalogFeedUrl,
      complianceConfirmed: true,
      payload: JSON.stringify(feed.listings || feed)
    });
    state = {
      ...result.state,
      catalogFeedStatus: "synced",
      catalogFeedSyncedAt: new Date().toISOString()
    };
    saveState();
    render();
  } catch {
    state = { ...state, catalogFeedStatus: "error" };
    saveState();
  }
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

function renderFilters(allListings) {
  const sourceOptions = getListingSourceOptions(allListings);
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
          ${sourceOptions.map((source) => option(source, source, state.filters.source)).join("")}
        </select>
      </label>
      <label class="check-row">
        <input name="favouritesOnly" type="checkbox" ${state.filters.favouritesOnly ? "checked" : ""} />
        Favourites only
      </label>
    </form>
  `;
}

function renderMapProviderControls() {
  return `
    <form class="map-provider" data-form="map-provider">
      <h2>Map Provider</h2>
      <label>
        Style URL
        <input name="styleUrl" type="url" value="${escapeAttribute(getMapStyleUrl())}" placeholder="https://api.maptiler.com/maps/streets/style.json?key=..." />
      </label>
      <p>Blank uses OSM tiles for local development. Use a MapTiler style URL for production tiles.</p>
      <div class="button-row">
        <button type="submit">Apply map style</button>
        <button type="button" class="secondary" data-action="reset-map-style">Use OSM dev map</button>
      </div>
    </form>
  `;
}

function option(value, label, selected) {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function renderView(context) {
  if (state.view === "compare") return renderCompare(context);
  if (state.view === "locations") return renderLocations(context);
  if (state.view === "sources") return renderSources();
  if (state.view === "import") return renderImport(context.user);
  if (state.view === "edit-import") return renderEditImport(context);
  if (state.view === "favourites") return renderFavourites(context);
  return renderDashboard(context);
}

function renderDashboard({ filtered, visible, selectedListing, favouriteIds }) {
  const emptyBody =
    filtered.length === 0
      ? "No listings match the current filters."
      : "Adjust filters or move the map.";
  return `
    <div class="map-layout">
      <div class="mobile-view-toggle" aria-label="Mobile dashboard view">
        <button class="${state.mobilePanel === "map" ? "active" : ""}" data-mobile-panel="map">Map</button>
        <button class="${state.mobilePanel === "details" ? "active" : ""}" data-mobile-panel="details">Details</button>
      </div>
      <section class="map-panel ${state.mobilePanel === "details" ? "mobile-hidden" : ""}">
        <div class="map-toolbar">
          <div>
            <strong><span data-visible-count>${visible.length}</span> visible listings</strong>
            <span data-map-zoom-label>MapLibre · Zoom ${Number(state.map.zoom).toFixed(1)}</span>
          </div>
          <form class="map-search" data-form="map-search" role="search">
            <label class="visually-hidden" for="map-search-input">Search map location</label>
            <input id="map-search-input" name="query" value="${escapeAttribute(state.map.searchQuery || "")}" placeholder="Search city, neighbourhood, or address" autocomplete="off" />
            <button type="submit">Search</button>
          </form>
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
          <div class="real-map" data-maplibre-container></div>
          <div class="map-fallback-layer" aria-label="Fallback rental map">
            <div class="map-grid"></div>
            ${visible.map((listing) => renderMarker(listing, favouriteIds)).join("")}
            <div class="map-fallback-message">
              Fallback map shown while real map tiles load.
            </div>
          </div>
        </div>
      </section>
      <aside class="detail-panel ${state.mobilePanel === "map" ? "mobile-hidden" : ""}">
        ${
          selectedListing
            ? renderListingDetail(selectedListing, favouriteIds)
            : renderEmpty(
                filtered.length === 0 ? "No matching listings" : "No listings in view",
                emptyBody,
                `<button class="secondary" data-action="clear-filters">Reset filters</button>`
              )
        }
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
  const isSaved = favouriteIds.includes(listing.id);
  const favouriteNotes = getFavouriteNotes(state);
  return `
    <article class="listing-detail">
      <img src="${listing.image}" alt="${listing.title}" />
      <div class="listing-heading">
        <div>
          <span class="source">${listing.source}</span>
          <h2>${listing.title}</h2>
          <p>${listing.address}</p>
        </div>
        <div class="listing-actions">
          <button class="save-button ${isSaved ? "saved" : ""}" data-favourite="${listing.id}">
            ${isSaved ? "Saved" : "Save"}
          </button>
          ${
            listing.imported
              ? `<button class="secondary" data-edit-import="${listing.id}">Edit</button>`
              : ""
          }
        </div>
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
      ${
        isSaved
          ? `<form class="note-form" data-form="favourite-note" data-listing-id="${listing.id}">
              <label>Shortlist notes<textarea name="note" placeholder="Viewing impressions, tradeoffs, landlord details">${escapeHtml(favouriteNotes[listing.id] || listing.notes || "")}</textarea></label>
              <button type="submit" class="secondary">Save notes</button>
            </form>`
          : `<p class="muted">Save this listing to add shortlist notes.</p>`
      }
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
  const favouriteNotes = getFavouriteNotes(state);
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Favourites</h2>
        <p>${favourites.length} saved listings</p>
      </div>
      ${
        favourites.length
          ? `<div class="listing-grid">${favourites.map((listing) => renderListingCard(listing, favouriteIds, favouriteNotes)).join("")}</div>`
          : renderEmpty(
              "No favourites yet",
              "Save listings from the map to build your shortlist.",
              `<button data-view="dashboard">Browse map</button>`
            )
      }
    </section>
  `;
}

function renderListingCard(listing, favouriteIds, favouriteNotes = {}) {
  const note = favouriteNotes[listing.id] || listing.notes || "";
  return `
    <article class="listing-card">
      <img src="${listing.image}" alt="${listing.title}" />
      <div>
        <span class="source">${listing.source}</span>
        <h3>${listing.title}</h3>
        <p>${listing.address}</p>
        <strong>$${listing.price}</strong>
        ${note ? `<p class="note-preview">${escapeHtml(note)}</p>` : `<p class="muted">No shortlist notes yet.</p>`}
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
  const rows = sortComparisonRows(
    buildComparisonRows(favourites, locations, getFavouriteNotes(state)),
    state.compareSort
  );
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Compare</h2>
        <p>Side-by-side favourite listing review</p>
      </div>
      ${
        rows.length
          ? `<form class="compare-controls" data-form="compare-sort">
              <label>Sort listings
                <select name="compareSort">
                  ${option("default", "Saved order", state.compareSort)}
                  ${option("price", "Lowest price", state.compareSort)}
                  ${option("commute", locations[0] ? `Shortest commute to ${locations[0].name}` : "Shortest commute", state.compareSort)}
                </select>
              </label>
              <p class="muted">Best price and fastest first commute are highlighted.</p>
            </form>`
          : ""
      }
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
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map(renderCompareRow).join("")}
                </tbody>
              </table>
            </div>`
          : renderEmpty(
              "Nothing to compare",
              "Favourite a few listings first.",
              `<button data-view="dashboard">Browse map</button>`
            )
      }
    </section>
  `;
}

function renderCompareRow(row) {
  return `
    <tr>
      <td><strong>${row.title}</strong><br /><span>${row.source}</span></td>
      <td class="${row.isCheapest ? "table-highlight" : ""}">$${row.price}${row.isCheapest ? "<br /><span>Lowest</span>" : ""}</td>
      <td>${row.bedrooms === 0 ? "Studio" : row.bedrooms}</td>
      <td>${row.bathrooms}</td>
      <td>${row.amenities}</td>
      <td>${row.availability}</td>
      <td class="${row.isFastest ? "table-highlight" : ""}">
        ${
          row.commutes.length
            ? row.commutes.map((commute) => `${commute.locationName}: ${commute.durationMinutes} min`).join("<br />")
            : "Add locations"
        }
      </td>
      <td>${row.notes ? escapeHtml(row.notes) : "Unavailable"}</td>
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

function renderSources() {
  const sourceListings = state.publicSourceListings || [];
  const statusText =
    state.catalogFeedStatus === "synced"
      ? `Default catalog synced with ${sourceListings.length} listings.`
      : state.catalogFeedStatus === "error"
        ? "Default catalog could not be loaded."
        : "Default catalog loads when the app opens.";
  return `
    <section class="page-panel two-column">
      <div>
        <div class="page-heading">
          <h2>Public Listing Catalog</h2>
          <p>${statusText}</p>
        </div>
        <form class="stack-form source-form" data-form="source-feed">
          <label>Source name<input name="sourceName" placeholder="Example Property Manager" required /></label>
          <label>Feed or partner URL<input name="sourceUrl" type="url" placeholder="https://example.com/rentals-feed.json" /></label>
          <label>JSON listings<textarea name="payload" placeholder='[{"title":"Downtown one bedroom","price":1650,"address":"Calgary, AB","lat":51.044,"lng":-114.071,"url":"https://example.com/listing/1","bedrooms":1,"bathrooms":1,"amenities":["Parking","Laundry"]}]' required></textarea></label>
          <label class="check-row">
            <input name="complianceConfirmed" type="checkbox" required />
            I have permission to use this feed and its listing data.
          </label>
          <button type="submit">Import feed listings</button>
        </form>
      </div>
      <div class="source-summary">
        <div class="page-heading">
          <h2>Catalog Feed Listings</h2>
          <p>${sourceListings.length} public listings from approved feeds</p>
        </div>
        ${
          sourceListings.length
            ? `<div class="listing-grid compact-grid">${sourceListings.map(renderSourceListingCard).join("")}</div>`
            : renderEmpty("No feed listings yet", "Import an authorized JSON feed to add source listings for every visitor.")
        }
      </div>
    </section>
  `;
}

function renderSourceListingCard(listing) {
  return `
    <article class="listing-card">
      <div>
        <span class="source">${listing.source}</span>
        <h3>${listing.title}</h3>
        <p>${listing.address || "No address"}</p>
        <strong>$${listing.price}</strong>
        <button class="secondary" data-select="${listing.id}">View on map</button>
      </div>
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
        <label>Availability<input name="availability" placeholder="Flexible" /></label>
        <label>Amenities<input name="amenities" placeholder="Parking, laundry, pet friendly" /></label>
        <label>Notes<textarea name="notes" placeholder="Viewing notes, landlord details, concerns"></textarea></label>
        <button type="submit">Import and favourite</button>
      </form>
    </section>
  `;
}

function renderEditImport({ allListings, user }) {
  if (!user) return renderGate("Log in to edit imported listings.");
  const listing = allListings.find((item) => item.id === state.editingListingId && item.imported);
  if (!listing) {
    return `
      <section class="page-panel">
        ${renderEmpty(
          "Imported listing not found",
          "Choose an imported Facebook Marketplace listing before editing.",
          `<button data-view="dashboard">Back to map</button>`
        )}
      </section>
    `;
  }
  return `
    <section class="page-panel">
      <div class="page-heading">
        <h2>Edit Imported Listing</h2>
        <p>Update the fields you use for mapping, favourites, and comparison.</p>
      </div>
      <form class="stack-form import-form" data-form="edit-import" data-listing-id="${listing.id}">
        <label>Facebook Marketplace URL<input name="url" type="url" value="${escapeAttribute(listing.url)}" required /></label>
        <label>Title<input name="title" value="${escapeAttribute(listing.title)}" required /></label>
        <div class="split-row">
          <label>Price<input name="price" type="number" min="0" value="${listing.price}" required /></label>
          <label>Type<input name="propertyType" value="${escapeAttribute(listing.propertyType)}" /></label>
        </div>
        <div class="split-row">
          <label>Bedrooms<input name="bedrooms" type="number" min="0" value="${listing.bedrooms}" /></label>
          <label>Bathrooms<input name="bathrooms" type="number" min="0" step="0.5" value="${listing.bathrooms}" /></label>
        </div>
        <label>Address<input name="address" value="${escapeAttribute(listing.address)}" /></label>
        <div class="split-row">
          <label>Latitude<input name="lat" type="number" step="0.001" value="${listing.lat}" required /></label>
          <label>Longitude<input name="lng" type="number" step="0.001" value="${listing.lng}" required /></label>
        </div>
        <label>Availability<input name="availability" value="${escapeAttribute(listing.availability || "Flexible")}" /></label>
        <label>Amenities<input name="amenities" value="${escapeAttribute(listing.amenities.join(", "))}" /></label>
        <label>Notes<textarea name="notes">${escapeHtml(listing.notes || "")}</textarea></label>
        <div class="button-row">
          <button type="submit">Save changes</button>
          <button type="button" class="secondary" data-select="${listing.id}">Cancel</button>
        </div>
      </form>
    </section>
  `;
}

function renderEmpty(title, body, actionHtml = "") {
  return `<div class="empty-state"><strong>${title}</strong><p>${body}</p>${actionHtml}</div>`;
}

function renderGate(message) {
  return `<section class="page-panel">${renderEmpty("Login required", message)}</section>`;
}

function renderNotice(notice) {
  return `
    <div class="notice ${notice.type}" role="${notice.type === "error" ? "alert" : "status"}">
      <span>${escapeHtml(notice.message)}</span>
      <button class="secondary" data-action="dismiss-notice" aria-label="Dismiss notice">Dismiss</button>
    </div>
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => update({ ...state, view: button.dataset.view, editingListingId: null }));
  });
  document
    .querySelector("[data-action='dismiss-notice']")
    ?.addEventListener("click", () => update({ ...state, notice: null }));
  document
    .querySelector("[data-action='clear-filters']")
    ?.addEventListener("click", () =>
      update({ ...state, filters: createInitialState().filters, map: createInitialState().map })
    );
  document.querySelector("[data-action='logout']")?.addEventListener("click", () => update(logoutUser(state)));
  document.querySelector("[data-form='auth']")?.addEventListener("submit", handleAuth);
  document.querySelector("[data-form='filters']")?.addEventListener("input", handleFilters);
  document.querySelector("[data-form='map-provider']")?.addEventListener("submit", handleMapProvider);
  document.querySelector("[data-form='map-search']")?.addEventListener("submit", handleMapSearch);
  document.querySelector("[data-form='compare-sort']")?.addEventListener("input", handleCompareSort);
  document.querySelector("[data-form='facebook']")?.addEventListener("submit", handleFacebookImport);
  document.querySelector("[data-form='source-feed']")?.addEventListener("submit", handleSourceFeedImport);
  document.querySelector("[data-form='edit-import']")?.addEventListener("submit", handleImportedEdit);
  document.querySelector("[data-form='favourite-note']")?.addEventListener("submit", handleFavouriteNote);
  document.querySelector("[data-form='location']")?.addEventListener("submit", handleLocation);
  document.querySelectorAll("[data-favourite]").forEach((button) => {
    button.addEventListener("click", () => action(() => update(toggleFavourite(state, button.dataset.favourite))));
  });
  document.querySelectorAll("[data-edit-import]").forEach((button) => {
    button.addEventListener("click", () =>
      update({ ...state, view: "edit-import", editingListingId: button.dataset.editImport })
    );
  });
  document.querySelectorAll("[data-mobile-panel]").forEach((button) => {
    button.addEventListener("click", () => update({ ...state, mobilePanel: button.dataset.mobilePanel }));
  });
  document
    .querySelector("[data-action='reset-map-style']")
    ?.addEventListener("click", () => {
      setMapStyleUrl("");
      update({ ...state, notice: { type: "success", message: "Map style reset to the OSM development basemap." } });
    });
  document.querySelectorAll("[data-select]").forEach((button) => {
    button.addEventListener("click", () => selectListing(button.dataset.select));
  });
  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => handleMapControl(button.dataset.map));
  });
  document.querySelectorAll("[data-remove-location]").forEach((button) => {
    button.addEventListener("click", () => update(removeFrequentLocation(state, button.dataset.removeLocation)));
  });
}

function initDashboardMap({ filtered, visible, favouriteIds }) {
  if (state.view !== "dashboard") return;
  const container = document.querySelector(".map-canvas");
  if (!container || container.closest(".map-panel")?.classList.contains("mobile-hidden")) return;

  initMapLibreMap({
    container,
    listings: filtered,
    favouriteIds,
    selectedListingId: state.selectedListingId,
    mapState: state.map,
    onSelect: selectListing,
    onViewportChange: (mapState) => {
      state = {
        ...state,
        map: { ...state.map, ...mapState },
        selectedListingId:
          getVisibleListings(filtered, mapState).some((listing) => listing.id === state.selectedListingId)
            ? state.selectedListingId
            : null
      };
      saveState();
      updateMapStats(mapState);
    }
  });
}

function maybeCenterOnUserLocation() {
  if (state.view !== "dashboard" || state.map.userLocationStatus !== "pending") return;
  if (!navigator.geolocation) {
    state = {
      ...state,
      map: { ...state.map, userLocationStatus: "unavailable" }
    };
    saveState();
    return;
  }

  state = {
    ...state,
    map: { ...state.map, userLocationStatus: "requesting" }
  };
  saveState();

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      moveMapToBounds(locationAreaBounds(lat, lng), {
        centerLat: lat,
        centerLng: lng,
        userLocationStatus: "granted"
      });
    },
    () => {
      state = {
        ...state,
        map: { ...state.map, userLocationStatus: "denied" }
      };
      saveState();
    },
    {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 8000
    }
  );
}

function selectListing(listingId) {
  const listing = getUserListings(state).find((item) => item.id === listingId);
  update({
    ...state,
    view: "dashboard",
    selectedListingId: listingId,
    editingListingId: null,
    mobilePanel: "details",
    map: listing ? { ...state.map, centerLat: listing.lat, centerLng: listing.lng } : state.map
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

function handleCompareSort(event) {
  const form = new FormData(event.currentTarget);
  update({ ...state, compareSort: form.get("compareSort") });
}

function handleMapProvider(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setMapStyleUrl(form.get("styleUrl"));
  update({ ...state, notice: { type: "success", message: "Map style saved." } });
}

async function handleMapSearch(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const query = String(form.get("query") || "").trim();
  if (!query) return;

  state = { ...state, map: { ...state.map, searchQuery: query } };
  saveState();

  try {
    const result = await geocodeSearch(query);
    if (!result) {
      update({ ...state, notice: { type: "error", message: "No map result found for that search." } });
      return;
    }
    moveMapToBounds(result.bounds || locationAreaBounds(result.lat, result.lng), {
      centerLat: result.lat,
      centerLng: result.lng,
      searchQuery: query
    });
  } catch {
    update({ ...state, notice: { type: "error", message: "Map search is unavailable right now." } });
  }
}

function handleMapControl(intent) {
  const nextMap = nextMapState(intent);
  state = { ...state, map: nextMap };
  saveState();
  updateMapStats(nextMap);
  if (!flyMapTo(nextMap)) {
    update(state);
  }
}

function moveMapToBounds(bounds, extraMapState = {}) {
  const fitResult = fitMapToBounds(bounds);
  const { centerLat, centerLng, zoom, ...metadata } = extraMapState;
  const fittedMapState = fitResult || {
    centerLat: centerLat ?? state.map.centerLat,
    centerLng: centerLng ?? state.map.centerLng,
    zoom: zoom ?? 12
  };
  const nextMap = {
    ...state.map,
    ...fittedMapState,
    ...metadata
  };
  state = { ...state, map: nextMap };
  saveState();
  updateMapStats(nextMap);
  if (!fitResult) {
    update(state);
  }
}

function updateMapStats(mapState) {
  const label = document.querySelector("[data-map-zoom-label]");
  if (label) {
    label.textContent = `MapLibre · Zoom ${Number(mapState.zoom).toFixed(1)}`;
  }
  const count = document.querySelector("[data-visible-count]");
  if (count) {
    const allListings = getUserListings(state);
    const visibleListings = getVisibleListings(filterListings(allListings, state.filters, getFavouriteIds(state)), mapState);
    count.textContent = visibleListings.length;
  }
}

async function geocodeSearch(query) {
  const endpoint = new URL("https://nominatim.openstreetmap.org/search");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("limit", "1");
  endpoint.searchParams.set("q", query);
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error("Search failed");
  const [result] = await response.json();
  if (!result) return null;
  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    bounds: parseGeocodeBounds(result.boundingbox)
  };
}

function parseGeocodeBounds(boundingbox) {
  if (!Array.isArray(boundingbox) || boundingbox.length !== 4) return null;
  const [south, north, west, east] = boundingbox.map(Number);
  if (![south, north, west, east].every(Number.isFinite)) return null;
  return { south, north, west, east };
}

function handleFacebookImport(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  action(
    () => update({ ...importFacebookListing(state, values), view: "dashboard", mobilePanel: "details" }),
    "Imported listing added to favourites."
  );
}

function handleSourceFeedImport(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const result = importListingFeed(state, values);
    const parts = [];
    if (result.summary.addedCount) parts.push(`${result.summary.addedCount} added`);
    if (result.summary.updatedCount) parts.push(`${result.summary.updatedCount} updated`);
    update({
      ...result.state,
      view: "sources",
      notice: {
        type: "success",
        message: `Feed import complete: ${parts.join(", ") || "0 changed"}.`
      }
    });
  } catch (error) {
    update({ ...state, notice: { type: "error", message: error.message } });
  }
}

function handleImportedEdit(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const listingId = event.currentTarget.dataset.listingId;
  action(
    () =>
      update({
        ...updateImportedListing(state, listingId, values),
        view: "dashboard",
        editingListingId: null,
        mobilePanel: "details"
      }),
    "Imported listing updated."
  );
}

function handleFavouriteNote(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  action(
    () => update(updateFavouriteNote(state, event.currentTarget.dataset.listingId, values.note)),
    "Shortlist notes saved."
  );
}

function handleLocation(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  action(() => update(addFrequentLocation(state, values)), "Frequent location added.");
}

function nextMapState(intent) {
  const step = 2 / state.map.zoom;
  const next = { ...state.map };
  if (intent === "north") next.centerLat += step;
  if (intent === "south") next.centerLat -= step;
  if (intent === "east") next.centerLng += step;
  if (intent === "west") next.centerLng -= step;
  if (intent === "zoomIn") next.zoom = Math.min(getMaxMapZoom(), next.zoom + 1);
  if (intent === "zoomOut") next.zoom = Math.max(2, next.zoom - 1);
  return next;
}

render();
loadCanadaCatalogFeed();
