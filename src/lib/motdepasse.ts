import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const deriver = promisify(scrypt) as (mdp: string, sel: Buffer, longueur: number) => Promise<Buffer>;

/** Au moins 8 caractères, 128 au plus (scrypt reste rapide). */
export function motDePasseValide(mdp: string): boolean {
  return mdp.length >= 8 && mdp.length <= 128;
}

/** Empreinte stockée : « sel:hash » en hexadécimal. */
export async function hacher(mdp: string): Promise<string> {
  const sel = randomBytes(16);
  return `${sel.toString("hex")}:${(await deriver(mdp, sel, 64)).toString("hex")}`;
}

export async function verifier(mdp: string, empreinte: string): Promise<boolean> {
  const [sel, hash] = empreinte.split(":");
  if (!sel || !hash) return false;
  const attendu = Buffer.from(hash, "hex");
  const calcule = await deriver(mdp, Buffer.from(sel, "hex"), attendu.length);
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}
