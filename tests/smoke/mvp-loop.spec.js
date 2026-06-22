import { expect, test } from "@playwright/test";

test("user can complete the MVP rental shortlist loop", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "RentalDash" })).toBeVisible();
  await expect(page.getByText("4 visible listings")).toBeVisible();
  await expect(page.getByLabel("Style URL")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(window.maplibregl?.Map))).toBe(true);
  await expect.poll(() => page.evaluate(() => Boolean(document.querySelector(".maplibre-ready")))).toBe(true);
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);
  await page.locator(".maplibregl-ctrl-zoom-in").click();
  await page.getByRole("button", { name: "+" }).first().click();
  await expect(page.locator(".maplibregl-canvas")).toHaveCount(1);

  await page.getByLabel("Email").fill("smoke@example.com");
  await page.getByLabel("Name").fill("Smoke Tester");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page.getByText("smoke@example.com")).toBeVisible();
  await page.getByLabel("Select Bright Beltline One Bedroom").click();
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
