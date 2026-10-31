import assert from "node:assert/strict";
import { test } from "node:test";
import { pseudoValide } from "./profil.ts";

test("pseudo : lettres accentuées, chiffres et _ - . acceptés", () => {
  for (const p of ["Léa", "hugo_42", "j.-b", "Zoé2026abcdefghijklm"]) assert.ok(pseudoValide(p), p);
});

test("pseudo : trop court, trop long, espaces ou symboles refusés", () => {
  for (const p of ["ab", "a".repeat(21), "jean dupont", "<script>", "moi@mail"]) assert.ok(!pseudoValide(p), p);
});
