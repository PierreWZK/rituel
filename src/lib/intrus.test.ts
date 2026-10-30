import assert from "node:assert/strict";
import { test } from "node:test";
import { tirage, type Carte } from "./intrus.ts";

const JEUX: Carte[] = [
  ...["wordle", "sutom", "le-mot", "cemantix"].map((slug) => ({ slug, nom: slug, categorie: "MOTS" })),
  ...["worldle", "globle", "travle"].map((slug) => ({ slug, nom: slug, categorie: "GEO" })),
  ...["nerdle", "mathler"].map((slug) => ({ slug, nom: slug, categorie: "CHIFFRES" })),
];

test("trois jeux d'une catégorie, un intrus d'une autre", () => {
  for (const jour of ["2026-10-30", "2026-10-31", "2026-11-01", "2027-02-14"]) {
    const t = tirage(JEUX, jour)!;
    assert.equal(t.cartes.length, 4);
    assert.equal(new Set(t.cartes.map((c) => c.slug)).size, 4);
    const intrus = t.cartes.find((c) => c.slug === t.intrus)!;
    const autres = t.cartes.filter((c) => c.slug !== t.intrus);
    assert.equal(new Set(autres.map((c) => c.categorie)).size, 1);
    assert.notEqual(intrus.categorie, autres[0].categorie);
  }
});

test("même tirage pour tous le même jour, quel que soit l'ordre de l'annuaire", () => {
  assert.deepEqual(tirage(JEUX, "2026-10-30"), tirage([...JEUX].reverse(), "2026-10-30"));
});

test("le tirage change d'un jour à l'autre", () => {
  const semaine = ["01", "02", "03", "04", "05", "06", "07"].map((j) => JSON.stringify(tirage(JEUX, `2026-11-${j}`)));
  assert.ok(new Set(semaine).size > 1);
});

test("pas de tirage sans catégorie de trois jeux ni intrus possible", () => {
  assert.equal(tirage(JEUX.slice(4, 6), "2026-10-30"), null);
  assert.equal(tirage(JEUX.slice(0, 4), "2026-10-30"), null);
});
