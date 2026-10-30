import assert from "node:assert/strict";
import { test } from "node:test";
import { cleUrl, estCategorie, slugifier } from "./jeux.ts";

test("slugifier retire accents et ponctuation", () => {
  assert.equal(slugifier("Le Mot (français)"), "le-mot-francais");
  assert.equal(slugifier("  Pédantix!! "), "pedantix");
  assert.equal(slugifier("???"), "jeu");
});

test("cleUrl repère les doublons et refuse les adresses non web", () => {
  assert.equal(cleUrl("https://www.Sutom.nocle.fr/"), "sutom.nocle.fr");
  assert.equal(cleUrl("http://sutom.nocle.fr?ref=x"), "sutom.nocle.fr");
  assert.equal(cleUrl("https://cemantix.certitudes.org/pedantix/"), "cemantix.certitudes.org/pedantix");
  assert.notEqual(cleUrl("https://cemantix.certitudes.org/"), cleUrl("https://cemantix.certitudes.org/pedantix"));
  assert.equal(cleUrl("javascript:alert(1)"), null);
  assert.equal(cleUrl("pas une adresse"), null);
});

test("estCategorie n'accepte que les clés connues", () => {
  assert.equal(estCategorie("MOTS"), true);
  assert.equal(estCategorie("toString"), false);
});
