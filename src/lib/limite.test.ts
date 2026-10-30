import assert from "node:assert/strict";
import { test } from "node:test";
import { autoriser } from "./limite.ts";

test("bloque au-delà du maximum, puis relâche après la fenêtre", () => {
  const minute = 60_000;
  for (let i = 0; i < 3; i++) assert.equal(autoriser("a@test.fr", 3, minute, 1000 + i), true);
  assert.equal(autoriser("a@test.fr", 3, minute, 2000), false);
  assert.equal(autoriser("b@test.fr", 3, minute, 2000), true, "une autre clé garde son propre compteur");
  assert.equal(autoriser("a@test.fr", 3, minute, 1000 + minute + 5), true);
});
