const styleStorageKey = "rentaldash.mapStyleUrl";
const maxMapZoom = 18;
const defaultRasterStyle = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster",
      source: "osm"
    }
  ]
};

let activeMap = null;
let activeMarkers = [];
let activeContainer = null;
let suppressViewportEvent = false;
let mapErrorCount = 0;

export function getMapStyleUrl() {
  const configuredStyleUrl = window.RENTALDASH_MAP_STYLE_URL || localStorage.getItem(styleStorageKey) || "";
  if (configuredStyleUrl.includes("demotiles.maplibre.org/globe.json")) {
    localStorage.removeItem(styleStorageKey);
    return "";
  }
  return configuredStyleUrl;
}

export function setMapStyleUrl(styleUrl) {
  const nextStyleUrl = styleUrl.trim();
  if (nextStyleUrl) {
    localStorage.setItem(styleStorageKey, nextStyleUrl);
  } else {
    localStorage.removeItem(styleStorageKey);
  }
}

export function teardownMapLibreMap() {
  activeMarkers.forEach((marker) => marker.remove());
  activeMarkers = [];
  activeContainer?.classList.remove("maplibre-ready", "maplibre-unavailable");
  activeContainer = null;
  mapErrorCount = 0;

  if (activeMap) {
    activeMap.remove();
    activeMap = null;
  }
}

export function initMapLibreMap({
  container,
  listings,
  favouriteIds,
  selectedListingId,
  mapState,
  onSelect,
  onViewportChange
}) {
  if (!container) return false;
  const maplibregl = window.maplibregl;
  if (!maplibregl?.Map) {
    container.classList.add("maplibre-unavailable");
    return false;
  }

  const mapTarget = container.querySelector("[data-maplibre-container]");
  if (!mapTarget) return false;

  teardownMapLibreMap();
  activeContainer = container;

  try {
    activeMap = new maplibregl.Map({
      container: mapTarget,
      style: getMapStyleUrl() || defaultRasterStyle,
      center: [mapState.centerLng, mapState.centerLat],
      zoom: clampZoom(mapState.zoom),
      maxZoom: maxMapZoom,
      attributionControl: true,
      cooperativeGestures: true
    });
  } catch {
    container.classList.add("maplibre-unavailable");
    activeMap = null;
    return false;
  }

  activeMap.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");

  const markReady = () => {
    container.classList.add("maplibre-ready");
    container.classList.remove("maplibre-unavailable");
    syncMarkers({ listings, favouriteIds, selectedListingId, onSelect });
  };

  activeMap.once("styledata", markReady);
  activeMap.once("load", markReady);

  activeMap.on("error", (event) => {
    if (isFatalMapLibreError(event)) {
      markMapUnavailable(container);
    }
  });
  activeMap.on("webglcontextlost", () => markMapUnavailable(container));

  activeMap.on("moveend", () => {
    if (suppressViewportEvent) return;
    const center = activeMap.getCenter();
    onViewportChange({
      centerLat: Number(center.lat.toFixed(4)),
      centerLng: Number(center.lng.toFixed(4)),
      zoom: Number(Math.min(activeMap.getZoom(), maxMapZoom).toFixed(2))
    });
  });

  return true;
}

export function flyMapTo(mapState) {
  if (!activeMap) return false;
  suppressViewportEvent = true;
  activeMap.jumpTo({
    center: [mapState.centerLng, mapState.centerLat],
    zoom: clampZoom(mapState.zoom)
  });
  window.setTimeout(() => {
    suppressViewportEvent = false;
  }, 0);
  return true;
}

export function fitMapToBounds(bounds) {
  if (!activeMap) return false;
  suppressViewportEvent = true;
  activeMap.fitBounds(
    [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north]
    ],
    {
      padding: 0,
      duration: 0,
      maxZoom: 14
    }
  );
  window.setTimeout(() => {
    suppressViewportEvent = false;
  }, 0);
  const center = activeMap.getCenter();
  return {
    centerLat: Number(center.lat.toFixed(4)),
    centerLng: Number(center.lng.toFixed(4)),
    zoom: Number(activeMap.getZoom().toFixed(2))
  };
}

export function getMaxMapZoom() {
  return maxMapZoom;
}

function syncMarkers({ listings, favouriteIds, selectedListingId, onSelect }) {
  if (!activeMap || !window.maplibregl) return;

  activeMarkers.forEach((marker) => marker.remove());
  activeMarkers = listings.map((listing) => {
    const element = document.createElement("button");
    element.type = "button";
    element.className = [
      "maplibre-price-pin",
      favouriteIds.includes(listing.id) ? "saved" : "",
      listing.id === selectedListingId ? "selected" : ""
    ]
      .filter(Boolean)
      .join(" ");
    element.textContent = `$${listing.price}`;
    element.setAttribute("aria-label", `Select ${listing.title}`);
    element.addEventListener("click", () => onSelect(listing.id));

    return new window.maplibregl.Marker({ element, anchor: "center" })
      .setLngLat([listing.lng, listing.lat])
      .addTo(activeMap);
  });
}

function markMapUnavailable(container) {
  mapErrorCount += 1;
  if (mapErrorCount >= 3) {
    container.classList.add("maplibre-unavailable");
  }
}

export function isFatalMapLibreError(event) {
  const error = event?.error || event;
  const message = String(error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  if (event?.tile || event?.sourceId || status || message.includes("tile")) {
    return false;
  }

  return message.includes("webgl") || message.includes("style");
}

function clampZoom(zoom) {
  return Math.min(maxMapZoom, Math.max(2, Number(zoom) || 4));
}
