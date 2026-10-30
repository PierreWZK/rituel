"use client";

import { useState } from "react";

export function Inviter({ code }: { code: string }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clans/rejoindre/${code}`);
      setCopie(true);
    } catch {}
  }

  return (
    <div className="inviter">
      <span className="code-clan" aria-label={`Code d'invitation : ${code.split("").join(" ")}`}>{code}</span>
      <button type="button" className="bouton" onClick={copier}>
        {copie ? "Lien copié !" : "Copier le lien"}
      </button>
    </div>
  );
}
