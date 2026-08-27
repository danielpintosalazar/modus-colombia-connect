import { donors, type Donor, type Emergency } from "@/lib/modus-data";

export function initialsOf(name: string) {
  return name
    .replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Deterministic supporting donors (private + public) for an emergency. */
export function donorsFor(e: Emergency): Donor[] {
  const seed = e.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const priv = donors.filter((d) => d.sector === "privado");
  const pub = donors.filter((d) => d.sector === "publico");
  const pick = (list: Donor[], count: number) =>
    Array.from({ length: count }, (_, i) => list[(seed + i * 3) % list.length]!);
  return [...pick(priv, 3), ...pick(pub, 2)];
}
