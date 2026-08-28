import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageDown, RefreshCw, Satellite, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "./common";
import {
  buscarImagenes,
  getEvidenciasDeZona,
  rediagnosticarEvidencia,
  registrarEvidenciaDesdeUrl,
  type Evidencia,
  type ResultadoBusqueda,
} from "@/lib/modus-api";

const zonas = [
  { id: "zona-mocoa", label: "Mocoa, Putumayo" },
  { id: "zona-cundinamarca", label: "Cerros Orientales, Cundinamarca" },
  { id: "zona-choco", label: "Río Atrato, Chocó" },
  { id: "zona-guajira", label: "La Guajira" },
  { id: "zona-santander", label: "Los Santos, Santander" },
];
const tipos: Evidencia["tipo"][] = [
  "satelital_antes",
  "satelital_despues",
  "aerea",
  "dron",
  "terreno",
];

const clasTone: Record<string, string> = {
  destruida: "bg-critical/15 text-critical border-critical/40",
  parcial: "bg-warning/15 text-warning border-warning/40",
  segura: "bg-csr/15 text-csr border-csr/40",
};

export function EvidenciaAnalisis() {
  const [zonaId, setZonaId] = useState("zona-mocoa");
  const [q, setQ] = useState("Mocoa Putumayo avalancha 2017");
  const [fuente, setFuente] = useState<"wikimedia" | "openverse">("wikimedia");
  const [tipo, setTipo] = useState<Evidencia["tipo"]>("aerea");
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [evidencias, setEvidencias] = useState<Evidencia[] | null>(null);
  const [rediag, setRediag] = useState<string | null>(null);

  const cargarEvidencias = (zona: string) => void getEvidenciasDeZona(zona).then(setEvidencias);

  useEffect(() => {
    cargarEvidencias(zonaId);
  }, [zonaId]);

  const buscar = async () => {
    if (!q.trim()) return;
    setBuscando(true);
    setResultados(null);
    try {
      setResultados(await buscarImagenes(q.trim(), fuente, 12));
    } catch {
      toast.error("La búsqueda falló", {
        description: `La fuente "${fuente}" no respondió. Prueba con Wikimedia.`,
      });
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const guardar = async (r: ResultadoBusqueda) => {
    setGuardando(r.url);
    try {
      const ev = await registrarEvidenciaDesdeUrl(zonaId, {
        url: r.url,
        tipo,
        fuente: r.fuente,
        licencia: r.licencia,
        descripcion: r.titulo,
        autor: r.autor || null,
        pagina: r.pagina,
        ejecutar_diagnostico: true,
      });
      setEvidencias((prev) => [ev, ...(prev ?? [])]);
      toast.success("Evidencia registrada", {
        description: ev.diagnostico
          ? `Diagnóstico IA: ${ev.diagnostico.clasificacion} (${Math.round(ev.diagnostico.confianza * 100)}%).`
          : "Guardada sin diagnóstico.",
      });
    } catch {
      toast.error("No se pudo registrar la evidencia");
    } finally {
      setGuardando(null);
    }
  };

  const reDiagnosticar = async (ev: Evidencia) => {
    setRediag(ev.id);
    try {
      const upd = await rediagnosticarEvidencia(ev.id);
      setEvidencias((prev) => prev?.map((x) => (x.id === ev.id ? upd : x)) ?? prev);
      toast.success("Re-diagnóstico completo", {
        description: upd.diagnostico
          ? `${upd.diagnostico.clasificacion} (${upd.diagnostico.modo}).`
          : "Sin resultado.",
      });
    } catch {
      toast.error("No se pudo re-diagnosticar");
    } finally {
      setRediag(null);
    }
  };

  return (
    <section>
      <SectionHeading
        eyebrow="Fase de análisis · datos abiertos"
        title="Buscar y clasificar imágenes reales de la zona"
        description="Busca imágenes con licencia abierta (Wikimedia Commons, Openverse), guárdalas vinculadas a una zona y deja que el Agente de Diagnóstico las clasifique. Cada evidencia conserva su fuente y licencia."
      />

      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-5 lg:grid-cols-[1fr_180px_150px]">
        <div className="space-y-2">
          <Label htmlFor="ev-zona">Zona</Label>
          <Select value={zonaId} onValueChange={setZonaId}>
            <SelectTrigger id="ev-zona">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zonas.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-fuente">Fuente</Label>
          <Select value={fuente} onValueChange={(v) => setFuente(v as typeof fuente)}>
            <SelectTrigger id="ev-fuente">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wikimedia">Wikimedia Commons</SelectItem>
              <SelectItem value="openverse">Openverse</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-tipo">Tipo al guardar</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as Evidencia["tipo"])}>
            <SelectTrigger id="ev-tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 lg:col-span-3">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej. 'Providencia huracán Iota 2020'"
            onKeyDown={(e) => e.key === "Enter" && void buscar()}
          />
          <Button onClick={() => void buscar()} disabled={buscando}>
            <Search className="mr-1.5 size-4" /> {buscando ? "Buscando…" : "Buscar"}
          </Button>
        </div>
      </div>

      {resultados ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin resultados.</p>
          ) : (
            resultados.map((r) => (
              <div
                key={r.url}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
              >
                <div className="aspect-video overflow-hidden bg-surface-strong">
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt={r.titulo}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-xs font-medium">{r.titulo || "(sin título)"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.fuente} ·{" "}
                    <span className="text-foreground">{r.licencia || "licencia n/d"}</span>
                  </p>
                  <Button
                    size="sm"
                    className="mt-auto"
                    disabled={guardando === r.url}
                    onClick={() => void guardar(r)}
                  >
                    <ImageDown className="mr-1.5 size-3.5" />
                    {guardando === r.url ? "Guardando…" : "Guardar + diagnosticar"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Satellite className="size-4 text-ai" /> Evidencias registradas para esta zona
        </h3>
        {evidencias === null ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : evidencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay evidencias para {zonaId}.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {evidencias.map((ev) => (
              <article
                key={ev.id}
                className="flex gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <a href={ev.url} target="_blank" rel="noreferrer" className="shrink-0">
                  <img
                    src={ev.url}
                    alt={ev.descripcion}
                    className="size-24 rounded-lg object-cover"
                  />
                </a>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-border bg-surface-strong px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {ev.tipo.replace("_", " ")}
                    </span>
                    {ev.diagnostico ? (
                      <span
                        className={
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase " +
                          (clasTone[ev.diagnostico.clasificacion] ?? "border-border")
                        }
                      >
                        {ev.diagnostico.clasificacion} ·{" "}
                        {Math.round(ev.diagnostico.confianza * 100)}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">sin diagnóstico</span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {ev.diagnostico?.resumen || ev.descripcion || "—"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {ev.fuente} · {ev.licencia || "licencia n/d"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 h-7 px-2 text-xs"
                    disabled={rediag === ev.id}
                    onClick={() => void reDiagnosticar(ev)}
                  >
                    <RefreshCw className="mr-1 size-3" />{" "}
                    {rediag === ev.id ? "…" : "Re-diagnosticar"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
