import assert from "node:assert/strict";
import { test } from "node:test";
import { cleUrl, estCategorie, lireFormat, slugifier } from "./jeux.ts";

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

test("lireFormat : chaque format et ses champs obligatoires", () => {
  const formulaire = (champs: Record<string, string>) => (nom: string) => champs[nom] ?? "";
  assert.deepEqual(lireFormat(formulaire({ format: "ESSAIS" })), { format: "ESSAIS", formatMax: null, formatAutre: null });
  assert.deepEqual(lireFormat(formulaire({ format: "ESSAIS", formatMax: "6" }))?.formatMax, 6);
  assert.equal(lireFormat(formulaire({ format: "ESSAIS", formatMax: "50" })), null);
  assert.deepEqual(lireFormat(formulaire({ format: "SCORE", formatMax: "100" }))?.formatMax, 100);
  assert.equal(lireFormat(formulaire({ format: "SCORE" })), null);
  assert.deepEqual(lireFormat(formulaire({ format: "TEMPS", formatTemps: "2:00" }))?.formatMax, 120);
  assert.equal(lireFormat(formulaire({ format: "TEMPS", formatTemps: "vite" })), null);
  assert.deepEqual(lireFormat(formulaire({ format: "AUTRE", formatAutre: "Nombre d'étoiles sur 3" }))?.formatAutre, "Nombre d'étoiles sur 3");
  assert.equal(lireFormat(formulaire({ format: "AUTRE" })), null);
  assert.equal(lireFormat(formulaire({ format: "INCONNU" })), null);
});
