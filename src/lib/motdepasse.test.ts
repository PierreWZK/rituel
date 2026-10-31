import assert from "node:assert/strict";
import { test } from "node:test";
import { hacher, motDePasseValide, verifier } from "./motdepasse.ts";

test("mot de passe : bon accepté, mauvais refusé, sel différent à chaque fois", async () => {
  const empreinte = await hacher("cafe-croissant");
  assert.ok(await verifier("cafe-croissant", empreinte));
  assert.ok(!(await verifier("cafe-croissanT", empreinte)));
  assert.notEqual(empreinte, await hacher("cafe-croissant"));
});

test("mot de passe : empreinte abîmée refusée sans planter", async () => {
  assert.ok(!(await verifier("x", "")));
  assert.ok(!(await verifier("x", "abc:12")));
});

test("mot de passe : 8 à 128 caractères", () => {
  assert.ok(!motDePasseValide("1234567"));
  assert.ok(motDePasseValide("12345678"));
  assert.ok(!motDePasseValide("a".repeat(129)));
});
