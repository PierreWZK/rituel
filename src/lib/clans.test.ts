import assert from "node:assert/strict";
import { test } from "node:test";
import { classer, debutPeriode, genererCode } from "./clans.ts";

test("code d'invitation : 6 caractères lisibles", () => {
  for (let i = 0; i < 50; i++) assert.match(genererCode(), /^[A-HJ-NP-Z2-9]{6}$/);
});

test("début de période", () => {
  assert.equal(debutPeriode("jour", "2026-10-30"), "2026-10-30");
  assert.equal(debutPeriode("semaine", "2026-10-30"), "2026-10-26", "un vendredi → le lundi");
  assert.equal(debutPeriode("semaine", "2026-10-26"), "2026-10-26", "un lundi → lui-même");
  assert.equal(debutPeriode("semaine", "2026-11-01"), "2026-10-26", "un dimanche → le lundi d'avant");
  assert.equal(debutPeriode("mois", "2026-10-30"), "2026-10-01");
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
