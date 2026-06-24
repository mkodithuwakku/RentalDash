import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("serves MapLibre from committed vendor assets instead of node_modules", () => {
  const html = readFileSync("index.html", "utf8");

  assert.equal(html.includes("node_modules/maplibre-gl"), false);
  assert.equal(html.includes("vendor/maplibre-gl/maplibre-gl.css"), true);
  assert.equal(html.includes("vendor/maplibre-gl/maplibre-gl.js"), true);
  assert.equal(existsSync("vendor/maplibre-gl/maplibre-gl.css"), true);
  assert.equal(existsSync("vendor/maplibre-gl/maplibre-gl.js"), true);
});
