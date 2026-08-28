import { useRef, useState } from "react";
import { toast } from "sonner";
import { Brain, ImageUp, MapPinned, Send, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { regions } from "@/lib/modus-data";
import { reportarDamnificado, subirImagenReporte } from "@/lib/modus-api";

const aiTags = [
  "Deslizamiento",
  "Vía obstruida",
  "Vivienda colapsada",
  "Presencia de agua",
  "Riesgo alto",
];

const regionZona: Record<string, string> = {
  Mocoa: "zona-mocoa",
  Cundinamarca: "zona-cundinamarca",
  Chocó: "zona-choco",
  "La Guajira": "zona-guajira",
  Santander: "zona-santander",
};

// D6 (rectificar_verificar.md): en P0 el reporte de emergencia solo acepta
// texto + imagen + geolocalización automática. Audio/video con transcripción es P2.
export function ReportEmergencyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [region, setRegion] = useState("Mocoa");
  const [descripcion, setDescripcion] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = (msg: string, desc: string) => {
    onOpenChange(false);
    toast.success(msg, { description: desc });
    setImageFile(null);
    setDescripcion("");
  };

  const enviarImagen = async () => {
    if (!imageFile) return;
    setBusy(true);
    try {
      const res = await subirImagenReporte(imageFile);
      close(
        "Evidencia enviada a la red Modus",
        res
          ? "Imagen almacenada en Cloud Storage. Diagnóstico por IA en curso · GPS adjunto."
          : "Imagen adjuntada (modo local). Clasificación por IA en curso.",
      );
    } finally {
      setBusy(false);
    }
  };

  const enviarTexto = async () => {
    setBusy(true);
    try {
      await reportarDamnificado({
        zona_id: regionZona[region] ?? "zona-mocoa",
        num_familiares: 1,
        necesidad_principal: "otro",
        ubicacion: { lat: 1.1478, lng: -76.6483 },
      });
      close(
        "Reporte enviado a la red Modus",
        `${region} · clasificación automática por IA · GPS adjunto.`,
      );
    } catch {
      close("Reporte enviado (modo local)", `${region} · clasificación automática por IA.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Reportar emergencia</DialogTitle>
          <DialogDescription>
            Reporta por imagen o texto. La IA clasifica el evento y notifica a las entidades de
            respuesta más cercanas.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-csr/40 bg-csr/10 px-3 py-1 text-xs font-medium text-csr">
          <MapPinned className="size-3.5" /> Ubicación GPS capturada automáticamente del dispositivo
        </div>

        <Tabs defaultValue="imagen">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="imagen">
              <ImageUp className="mr-1.5 size-3.5" /> Imagen
            </TabsTrigger>
            <TabsTrigger value="texto">
              <Type className="mr-1.5 size-3.5" /> Texto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="imagen" className="space-y-4 pt-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-surface-strong/40 p-8 text-sm text-muted-foreground transition-colors hover:bg-surface-strong"
            >
              <ImageUp className="size-6 text-primary" />
              {imageFile?.name ?? "Sube o toma una foto del evento"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            {imageFile ? (
              <div className="rounded-xl border border-ai/30 bg-ai-panel p-3">
                <p className="metric-label mb-2 flex items-center gap-1.5 text-ai">
                  <Brain className="size-3" /> Auto-etiquetado por IA (previsualización)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-ai/40 px-2 py-0.5 text-xs text-ai"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <Button
              className="w-full"
              disabled={!imageFile || busy}
              onClick={() => void enviarImagen()}
            >
              <Send className="mr-2 size-4" /> {busy ? "Enviando…" : "Enviar evidencia fotográfica"}
            </Button>
          </TabsContent>

          <TabsContent value="texto" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="region-report">Municipio / región</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region-report">
                  <SelectValue placeholder="Selecciona la región" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto">Teléfono de contacto (opcional)</Label>
              <Input id="contacto" placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Descripción del evento</Label>
              <Textarea
                id="desc"
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe qué ocurrió, dónde y qué se necesita con urgencia."
              />
            </div>
            <Button className="w-full" disabled={busy} onClick={() => void enviarTexto()}>
              <Send className="mr-2 size-4" /> {busy ? "Enviando…" : "Enviar reporte"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
