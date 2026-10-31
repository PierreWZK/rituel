import { createTransport } from "nodemailer";

/**
 * Envoi en arrière-plan : la page s'affiche sans attendre le serveur SMTP.
 * En local sans EMAIL_SERVER, le message s'affiche dans le terminal.
 */
export function envoyerMail(destinataire: string, sujet: string, texte: string): void {
  if (!process.env.EMAIL_SERVER && process.env.NODE_ENV !== "production") {
    console.log(`\n✉️  À ${destinataire} · ${sujet}\n${texte}\n`);
    return;
  }
  // shortcut: un échec d'envoi n'apparaît que dans les journaux, passer par une file d'envoi s'il faut le signaler.
  createTransport(process.env.EMAIL_SERVER)
    .sendMail({ to: destinataire, from: process.env.EMAIL_FROM, subject: sujet, text: texte })
    .catch((e) => console.error(`[mail] « ${sujet} » non envoyé :`, e.message));
}
