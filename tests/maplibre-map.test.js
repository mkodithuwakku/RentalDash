import test from "node:test";
import assert from "node:assert/strict";
import { isFatalMapLibreError } from "../src/maplibre-map.js";

test("does not treat routine tile and source errors as fatal map failures", () => {
  assert.equal(
    isFatalMapLibreError({
      sourceId: "osm",
      error: { status: 404, message: "Failed to load tile" }
    }),
    false
  );
  assert.equal(isFatalMapLibreError({ tile: {}, error: { message: "Tile request failed" } }), false);
});

test("treats WebGL and style errors as fatal map failures", () => {
  assert.equal(isFatalMapLibreError({ error: { message: "WebGL context lost" } }), true);
  assert.equal(isFatalMapLibreError({ error: { message: "Style could not be loaded" } }), true);
});
