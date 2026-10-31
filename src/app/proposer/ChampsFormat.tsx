"use client";

import { useState } from "react";
import { FORMATS, formatTemps, type FormatJeu } from "@/lib/partage";

type Props = { format?: FormatJeu; formatMax?: number | null; formatAutre?: string | null };

/** Choix du format de résultat ; seul le champ utile au format choisi s'affiche. */
export function ChampsFormat({ format: initial = "ESSAIS", formatMax = null, formatAutre = null }: Props) {
  const [format, setFormat] = useState<FormatJeu>(initial);

  return (
    <>
      <label htmlFor="format">Format du résultat</label>
      <select id="format" name="format" value={format} onChange={(e) => setFormat(e.target.value as FormatJeu)} className="champ">
        {Object.entries(FORMATS).map(([cle, libelle]) => (
          <option key={cle} value={cle}>{libelle}</option>
        ))}
      </select>

      {format === "ESSAIS" && (
        <>
          <label htmlFor="formatMax">Essais possibles (laisser vide si le nombre varie)</label>
          <input id="formatMax" name="formatMax" type="number" min={1} max={20} defaultValue={initial === "ESSAIS" ? (formatMax ?? "") : 6} className="champ champ-court" />
        </>
      )}
      {format === "SCORE" && (
        <>
          <label htmlFor="formatMax">Score maximal</label>
          <input id="formatMax" name="formatMax" type="number" required min={1} max={100000} defaultValue={initial === "SCORE" ? (formatMax ?? 100) : 100} className="champ champ-court" />
        </>
      )}
      {format === "TEMPS" && (
        <>
          <label htmlFor="formatTemps">Temps de référence (100 points à ce temps ou mieux)</label>
          <input
            id="formatTemps"
            name="formatTemps"
            required
            pattern="\d{1,4}(:\d{1,2}){0,2}"
            placeholder="2:00"
            defaultValue={initial === "TEMPS" && formatMax ? formatTemps(formatMax) : ""}
            className="champ champ-court"
          />
        </>
      )}
      {format === "AUTRE" && (
        <>
          <label htmlFor="formatAutre">Décrivez le résultat que donne le jeu</label>
          <input id="formatAutre" name="formatAutre" required minLength={3} maxLength={120} placeholder="Ex. : nombre d'étoiles sur 3" defaultValue={formatAutre ?? ""} className="champ" />
          <small>En attendant un format dédié, le jeu se coche comme « fait ».</small>
        </>
      )}
    </>
  );
}
