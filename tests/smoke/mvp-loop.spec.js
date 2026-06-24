import { expect, test } from "@playwright/test";

test("user can complete the MVP rental shortlist loop", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 53.543, longitude: -113.519 });
  await page.route("https://nominatim.openstreetmap.org/search**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify([
        {
          lat: "51.0447",
          lon: "-114.0719",
          boundingbox: ["51.0000", "51.0900", "-114.1400", "-114.0000"]
        }
      ])
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RentalDash" })).toBeVisible();
  await expect(page.getByLabel("Style URL")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.maplibregl?.Map))).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector(".maplibre-ready")))).toBe(true);
  await expect
    .poll(async () => Number(await page.locator("[data-visible-count]").innerText()))
    .toBeGreaterThanOrEqual(1);
  await expect(page.locator("[data-form='filters']").getByLabel("Source")).toContainText(
    "RentalDash Canada Catalog"
  );
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.getByRole("button", { name: "+" }).first().click();
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  for (let index = 0; index < 20; index += 1) {
    await page.getByRole("button", { name: "+" }).first().click();
  }
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rentaldash.state.v1")).map.zoom))
    .toBeLessThanOrEqual(18);
  await page.locator(".map-canvas").evaluate((node) => {
    node.classList.add("maplibre-ready", "maplibre-unavailable");
  });
  await expect(page.locator(".map-fallback-layer")).toBeVisible();
  await page.locator(".map-canvas").evaluate((node) => {
    node.classList.remove("maplibre-unavailable");
  });
  await page.getByLabel("Search map location").fill("Beltline Calgary");
  await page.getByRole("button", { name: "Search" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rentaldash.state.v1")).map.searchQuery)).toBe("Beltline Calgary");
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);

  await page.getByRole("button", { name: "Sources" }).click();
  const sourceForm = page.locator("[data-form='source-feed']");
  await sourceForm.getByLabel("Source name").fill("Smoke Partner Feed");
  await sourceForm.getByLabel("Feed or partner URL").fill("https://partner.example/feed.json");
  await sourceForm.getByLabel("JSON listings").fill(
    JSON.stringify([
      {
        externalId: "smoke-feed-1",
        title: "Smoke partner rental",
        price: 1750,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: "Apartment",
        address: "Downtown Calgary",
        lat: 51.046,
        lng: -114.07,
        amenities: ["Parking", "Laundry"],
        availability: "2026-08-01",
        url: "https://partner.example/listings/smoke-feed-1"
      }
    ])
  );
  await sourceForm.getByLabel("I have permission to use this feed and its listing data.").check();
  await sourceForm.getByRole("button", { name: "Import feed listings" }).click();
  await expect(page.getByRole("status")).toContainText("Feed import complete: 1 added.");
  await expect(page.getByText("Smoke partner rental")).toBeVisible();
  await page.locator("[data-form='filters']").getByLabel("Source").selectOption("Smoke Partner Feed");
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rentaldash.state.v1")).filters.source)).toBe("Smoke Partner Feed");
  await page.locator("[data-form='filters']").getByLabel("Source").selectOption("any");
  await page.locator(".nav-tabs").getByRole("button", { name: "Map" }).click();

  await page.getByLabel("Email").fill("smoke@example.com");
  await page.getByLabel("Name").fill("Smoke Tester");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByText("smoke@example.com")).toBeVisible();
  await page.locator("[data-form='filters']").getByLabel("Source").selectOption("Rentals.ca");
  await page.locator(".maplibregl-canvas").evaluate((node) => {
    node.dataset.stabilityCheck = "before-select";
  });
  await page.getByLabel("Select Bright Beltline One Bedroom").click();
  await expect(page.locator(".map-canvas")).toHaveClass(/maplibre-ready/);
  await expect(page.locator(".maplibregl-canvas")).toHaveAttribute("data-stability-check", "before-select");
  await page.getByRole("button", { name: "Save" }).first().click();

  await page.getByRole("button", { name: "Favourites" }).click();
  await expect(page.getByRole("heading", { name: "Favourites" })).toBeVisible();
  await expect(page.getByText("1 saved listings")).toBeVisible();
  await expect(page.getByText("Bright Beltline One Bedroom")).toBeVisible();

  await page.getByRole("button", { name: "Import" }).click();
  const importForm = page.locator("[data-form='facebook']");
  await importForm
    .getByLabel("Facebook Marketplace URL")
    .fill("https://www.facebook.com/marketplace/item/123456789");
  await importForm.getByLabel("Title").fill("Smoke test basement suite");
  await importForm.getByLabel("Price").fill("1550");
  await importForm.getByLabel("Type").fill("Suite");
  await importForm.getByLabel("Bedrooms").fill("1");
  await importForm.getByLabel("Bathrooms").fill("1");
  await importForm.getByLabel("Address").fill("Beltline, Calgary, AB");
  await importForm.getByLabel("Latitude").fill("51.044");
  await importForm.getByLabel("Longitude").fill("-114.071");
  await importForm.getByLabel("Amenities").fill("Parking, Laundry");
  await importForm.getByLabel("Notes").fill("Imported during smoke test.");
  await importForm.getByRole("button", { name: "Import and favourite" }).click();

  await expect(page.getByRole("heading", { name: "Smoke test basement suite" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.getByLabel("Shortlist notes").fill("Strong option if parking is included.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect(page.getByRole("status")).toContainText("Shortlist notes saved.");

  await page.getByRole("button", { name: "Edit" }).click();
  const editForm = page.locator("[data-form='edit-import']");
  await editForm.getByLabel("Title").fill("Smoke test renovated suite");
  await editForm.getByLabel("Price").fill("1500");
  await editForm.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Smoke test renovated suite" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Imported listing updated.");

  await page.getByRole("button", { name: "Locations" }).click();
  const locationForm = page.locator("[data-form='location']");
  await locationForm.getByLabel("Name").fill("Work");
  await locationForm.getByLabel("Category").fill("Office");
  await locationForm.getByLabel("Address").fill("Downtown Calgary");
  await locationForm.getByLabel("Latitude").fill("51.044");
  await locationForm.getByLabel("Longitude").fill("-114.071");
  await locationForm.getByRole("button", { name: "Add location" }).click();

  await expect(page.getByText("Office · Downtown Calgary")).toBeVisible();

  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.getByRole("heading", { name: "Compare" })).toBeVisible();
  await expect(page.getByText("Bright Beltline One Bedroom")).toBeVisible();
  await expect(page.getByText("Smoke test renovated suite")).toBeVisible();
  await expect(page.getByText("Strong option if parking is included.")).toBeVisible();
  await page.getByLabel("Sort listings").selectOption("price");
  await expect(page.locator("tbody tr").first()).toContainText("Smoke test renovated suite");
  await expect(page.locator("tbody tr").first()).toContainText("Lowest");
  await expect(page.getByText(/Work: \d+ min/)).toHaveCount(2);
});

test("map remains available when tile requests fail during interaction", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 53.543, longitude: -113.519 });
  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    await route.abort();
  });

  await page.goto("/");

  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector(".maplibre-ready")))).toBe(true);
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.getByRole("button", { name: "+" }).first().click();
  await page.getByRole("button", { name: "→" }).click();
  const zoomBeforeWheel = await page.evaluate(() => JSON.parse(localStorage.getItem("rentaldash.state.v1")).map.zoom);
  await page.locator(".map-canvas").hover();
  await page.mouse.wheel(0, -700);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("rentaldash.state.v1")).map.zoom))
    .toBeGreaterThan(zoomBeforeWheel);

  await expect(page.locator(".map-canvas")).not.toHaveClass(/maplibre-unavailable/);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
});

test("map recovers from a bad saved provider style", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("rentaldash.mapStyleUrl", "https://bad-style.example/style.json");
  });
  await page.route("https://bad-style.example/**", async (route) => {
    await route.abort();
  });

  await page.goto("/");

  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector(".maplibre-ready")))).toBe(true);
  await expect(page.locator(".map-canvas")).not.toHaveClass(/maplibre-unavailable/);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("rentaldash.mapStyleUrl"))).toBe(null);
});
