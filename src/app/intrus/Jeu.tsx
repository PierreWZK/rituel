"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { repondre } from "./actions";
import type { Revelation } from "./tirage";

type Props = { cartes: { slug: string; nom: string }[]; jour: string; connecte: boolean; deja: Revelation | null };

export function Jeu({ cartes, jour, connecte, deja }: Props) {
  const [revelation, setRevelation] = useState<Revelation | null>(deja);
  const [choix, setChoix] = useState<string | null>(null);
  const [expire, setExpire] = useState(false);
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();
  const cle = `rituel-intrus-${jour}`;

  // Sans compte, la tentative du jour est gardée dans le navigateur.
  useEffect(() => {
    if (deja) return;
    try {
      const sauve = localStorage.getItem(cle);
      if (sauve) {
        const { revelation, choix } = JSON.parse(sauve);
        setRevelation(revelation);
        setChoix(choix);
      }
    } catch {}
  }, [cle, deja]);

  function jouer(slug: string) {
    setChoix(slug);
    demarrer(async () => {
      const r = await repondre(slug, jour);
      if (r === "expire") return setExpire(true);
      setRevelation(r);
      try {
        localStorage.setItem(cle, JSON.stringify({ revelation: r, choix: slug }));
      } catch {}
    });
  }

  const [, mois, jourDuMois] = jour.split("-");
  const partage = revelation
    ? `Rituel · L'intrus du jour ${jourDuMois}/${mois} ${revelation.reussi ? "✅" : "❌"}\nhttps://rituel.projectp.fr/intrus`
    : "";

  async function copier() {
    try {
      await navigator.clipboard.writeText(partage);
      setCopie(true);
    } catch {}
  }

  return (
    <>
      <ul className="intrus-cartes">
        {cartes.map((c) => {
          const estIntrus = revelation?.intrus === c.slug;
          const classe = ["intrus-carte", estIntrus && "intrus-bon", revelation && choix === c.slug && !estIntrus && "intrus-faux"]
            .filter(Boolean)
            .join(" ");
          return (
            <li key={c.slug}>
              <button
                type="button"
                className={classe}
                disabled={Boolean(revelation) || enCours}
                aria-pressed={choix === c.slug}
                onClick={() => jouer(c.slug)}
              >
                <span className="tuile" aria-hidden="true">{c.nom.charAt(0).toUpperCase()}</span>
                <span className="carte-nom">{c.nom}</span>
                {revelation && <span className="tag">{revelation.categories[c.slug]}</span>}
                {estIntrus && <span className="intrus-marque">L'intrus</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {expire && (
        <p className="message message-erreur" role="alert">
          Minuit est passé : un nouveau tirage vous attend. Rechargez la page.
        </p>
      )}

      {revelation && (
        <div className="intrus-resultat" role="status">
          <p className="intrus-verdict">{revelation.reussi ? "Bien vu ! ✅" : "Raté ❌"}</p>
          <pre className="intrus-partage">{partage}</pre>
          <div className="actions">
            <button type="button" className="bouton bouton-principal" onClick={copier}>
              {copie ? "Copié !" : "Copier le résultat"}
            </button>
            {connecte ? (
              <Link href="/routine" className="bouton">Voir ma routine</Link>
            ) : (
              <Link href="/connexion" className="bouton">Se connecter pour compter les points</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
