import assert from "node:assert/strict";
import { test } from "node:test";
import { classer, genererCode, moyenne, scoreGeneral } from "./clans.ts";

test("code d'invitation : 6 caractères lisibles", () => {
  for (let i = 0; i < 50; i++) assert.match(genererCode(), /^[A-HJ-NP-Z2-9]{6}$/);
});

test("score général : la régularité passe devant un bon départ", () => {
  assert.equal(scoreGeneral(5 * 90, 5), 63.3);
  assert.equal(scoreGeneral(10 * 89, 10), 69.5);
  assert.ok(scoreGeneral(10 * 89, 10) > scoreGeneral(5 * 90, 5));
  assert.equal(scoreGeneral(0, 0), 50, "sans partie, on part de 50");
  assert.ok(Math.abs(scoreGeneral(1000 * 80, 1000) - 80) < 0.5, "à la longue, la vraie moyenne");
});

test("moyenne", () => {
  assert.equal(moyenne([]), 0);
  assert.equal(moyenne([63.3, 69.5]), 66.4);
});

test("classement : points décroissants, ex aequo au même rang", () => {
  const rangs = classer([
    { nom: "Léo", points: 88 },
    { nom: "Camille", points: 96 },
    { nom: "Inès", points: 88 },
    { nom: "Sara", points: 0 },
  ]).map((l) => `${l.rang}:${l.nom}`);
  assert.deepEqual(rangs, ["1:Camille", "2:Léo", "2:Inès", "4:Sara"]);
});
