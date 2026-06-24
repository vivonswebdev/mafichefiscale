/**
 * Vérifie via l'API HaveIBeenPwned (k-anonymity) si un mot de passe
 * apparaît dans une fuite connue. Le mot de passe ne quitte jamais
 * le navigateur en clair : seuls les 5 premiers caractères du SHA-1
 * sont envoyés.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const prefix = hex.slice(0, 5);
    const suffix = hex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false; // en cas de panne API, on n'empêche pas la soumission
    const text = await res.text();
    return text.split("\n").some((line) => line.trim().toUpperCase().startsWith(suffix));
  } catch {
    return false;
  }
}
