import assert from "node:assert/strict";
import { test } from "node:test";
import { formatScore, lirePartage, points } from "./partage.ts";

const WORDLE = "nytimes.com/games/wordle/index.html";

test("Wordle : séparateur de milliers, mode difficile, échec", () => {
  assert.deepEqual(lirePartage("Wordle 1 234 3/6\n\n⬛🟨⬛⬛⬛"), { urlCle: WORDLE, score: { reussi: true, essais: 3, essaisMax: 6 } });
  assert.deepEqual(lirePartage("Wordle 1,234 4/6*")?.score, { reussi: true, essais: 4, essaisMax: 6 });
  assert.deepEqual(lirePartage("Wordle 1 234 X/6")?.score, { reussi: false, essais: null, essaisMax: 6 });
});

test("Sutom, Le Mot, Worldle, Nerdle", () => {
  assert.deepEqual(lirePartage("#SUTOM #1234 4/6 12:03\n🟥🟦🟡"), { urlCle: "sutom.nocle.fr", score: { reussi: true, essais: 4, essaisMax: 6 } });
  assert.equal(lirePartage("#SUTOM #1234 -/6")?.score.reussi, false);
  assert.equal(lirePartage("Le Mot (@WordleFR) #987 2/6")?.urlCle, "wordle.louan.me");
  assert.equal(lirePartage("#Worldle #1001 (30.10.2026) 5/6 (100%)")?.score.essais, 5);
  assert.equal(lirePartage("nerdlegame 980 3/6")?.urlCle, "nerdlegame.com");
});

test("Framed : position du carré vert", () => {
  assert.deepEqual(lirePartage("Framed #900\n🎥 🟥 🟥 🟩 ⬛ ⬛ ⬛\n\nhttps://framed.wtf")?.score, { reussi: true, essais: 3, essaisMax: 6 });
  assert.equal(lirePartage("Framed #900\n🎥 🟥 🟥 🟥 🟥 🟥 🟥")?.score.reussi, false);
});

test("L'intrus du jour", () => {
  assert.deepEqual(lirePartage("Rituel · L'intrus du jour 30/10 ✅")?.score, { reussi: true, essais: 1, essaisMax: 1 });
  assert.equal(lirePartage("Rituel · L'intrus du jour 30/10 ❌")?.score.reussi, false);
});

test("texte inconnu ou score impossible : rien n'est lu", () => {
  assert.equal(lirePartage("Bonjour"), null);
  assert.equal(lirePartage("Wordle 1 234 7/6"), null);
});

test("points de 100 (premier essai) à 10 (dernier), 0 si raté", () => {
  assert.equal(points({ reussi: true, essais: 1, essaisMax: 6 }), 100);
  assert.equal(points({ reussi: true, essais: 3, essaisMax: 6 }), 64);
  assert.equal(points({ reussi: true, essais: 6, essaisMax: 6 }), 10);
  assert.equal(points({ reussi: false, essais: null, essaisMax: 6 }), 0);
  assert.equal(points({ reussi: true, essais: 1, essaisMax: 1 }), 100);
});

test("formatScore", () => {
  assert.equal(formatScore({ reussi: true, essais: 3, essaisMax: 6 }), "3/6");
  assert.equal(formatScore({ reussi: false, essais: null, essaisMax: 6 }), "X/6");
  assert.equal(formatScore({ reussi: null, essais: null, essaisMax: null }), "fait");
});
