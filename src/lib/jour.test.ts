import assert from "node:assert/strict";
import { test } from "node:test";
import { jourParis, serie, veille } from "./jour.ts";

test("la journée bascule à minuit, heure de Paris", () => {
  // Heure d'hiver (UTC+1) depuis le 25 octobre 2026.
  assert.equal(jourParis(new Date("2026-10-30T22:59:00Z")), "2026-10-30");
  assert.equal(jourParis(new Date("2026-10-30T23:00:00Z")), "2026-10-31");
  // Heure d'été (UTC+2).
  assert.equal(jourParis(new Date("2026-07-14T21:59:00Z")), "2026-07-14");
  assert.equal(jourParis(new Date("2026-07-14T22:00:00Z")), "2026-07-15");
});

test("veille traverse les mois et les années", () => {
  assert.equal(veille("2026-03-01"), "2026-02-28");
  assert.equal(veille("2027-01-01"), "2026-12-31");
});

test("série : jours consécutifs, tolère qu'aujourd'hui ne soit pas encore joué", () => {
  assert.equal(serie([], "2026-10-30"), 0);
  assert.equal(serie(["2026-10-30", "2026-10-29", "2026-10-28"], "2026-10-30"), 3);
  assert.equal(serie(["2026-10-29", "2026-10-28"], "2026-10-30"), 2, "pas encore joué aujourd'hui");
  assert.equal(serie(["2026-10-30", "2026-10-28"], "2026-10-30"), 1, "un trou casse la série");
  assert.equal(serie(["2026-10-27"], "2026-10-30"), 0);
});
