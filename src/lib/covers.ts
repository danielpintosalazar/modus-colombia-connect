import choco from "@/assets/cover-choco.jpg";
import cundinamarca from "@/assets/cover-cundinamarca.jpg";
import guajira from "@/assets/cover-guajira.jpg";
import santander from "@/assets/cover-santander.jpg";
import mocoa from "@/assets/mocoa-t1.jpg";

export const regionCovers: Record<string, string> = {
  Mocoa: mocoa,
  Cundinamarca: cundinamarca,
  "Chocó": choco,
  "La Guajira": guajira,
  Santander: santander,
};

export function coverFor(region: string) {
  return regionCovers[region] ?? mocoa;
}
