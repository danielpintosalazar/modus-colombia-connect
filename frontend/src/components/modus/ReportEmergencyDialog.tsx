import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Brain, ImageUp, MapPinned, Mic, Send, Square, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { regions } from "@/lib/modus-data";

const aiTags = ["Deslizamiento", "Vía obstruida", "Vivienda colapsada", "Presencia de agua", "Riesgo alto"];

export function ReportEmergencyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const submit = (channel: string) => {
    onOpenChange(false);
    toast.success("Reporte enviado a la red Modus", {
      description: `Canal: ${channel}. Clasificación automática por IA en curso · GPS adjunto.`,
    });
    setRecording(false);
    setSeconds(0);
    setHasAudio(false);
    setImageName(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Reportar emergencia</DialogTitle>
          <DialogDescription>
            Reporta por voz, imagen o texto. La IA clasifica el evento y notifica a las entidades de respuesta
            más cercanas.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-csr/40 bg-csr/10 px-3 py-1 text-xs font-medium text-csr">
          <MapPinned className="size-3.5" /> Ubicación GPS capturada automáticamente del dispositivo
        </div>

        <Tabs defaultValue="voz">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voz">
              <Mic className="mr-1.5 size-3.5" /> Voz
            </TabsTrigger>
            <TabsTrigger value="imagen">
              <ImageUp className="mr-1.5 size-3.5" /> Imagen
            </TabsTrigger>
            <TabsTrigger value="texto">
              <Type className="mr-1.5 size-3.5" /> Texto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voz" className="space-y-4 pt-4">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-strong/50 p-6">
              <button
                type="button"
                onClick={() => {
                  if (recording) {
                    setRecording(false);
                    setHasAudio(true);
                  } else {
                    setRecording(true);
                    setSeconds(0);
                    setHasAudio(false);
                  }
                }}
                className={`flex size-16 items-center justify-center rounded-full border transition-colors ${
                  recording
                    ? "animate-pulse-ring border-critical bg-critical text-critical-foreground"
                    : "border-border bg-surface text-foreground hover:bg-muted"
                }`}
                aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
              >
                {recording ? <Square className="size-5" /> : <Mic className="size-6" />}
              </button>
              <p className="font-display text-lg tabular-nums">
                {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {recording
                  ? "Grabando nota de voz… describe qué ocurre y cuántas personas están afectadas."
                  : hasAudio
                    ? "Nota de voz lista. La IA transcribirá y extraerá necesidades primarias."
                    : "Toca el micrófono para grabar tu reporte."}
              </p>
            </div>
            <Button className="w-full" disabled={!hasAudio} onClick={() => submit("Nota de voz")}>
              <Send className="mr-2 size-4" /> Enviar nota de voz
            </Button>
          </TabsContent>

          <TabsContent value="imagen" className="space-y-4 pt-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-surface-strong/40 p-8 text-sm text-muted-foreground transition-colors hover:bg-surface-strong"
            >
              <ImageUp className="size-6 text-primary" />
              {imageName ?? "Sube o toma una foto del evento"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
            />
            {imageName ? (
              <div className="rounded-xl border border-ai/30 bg-ai-panel p-3">
                <p className="metric-label mb-2 flex items-center gap-1.5 text-ai">
                  <Brain className="size-3" /> Auto-etiquetado por IA (previsualización)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {aiTags.map((t) => (
                    <span key={t} className="rounded-full border border-ai/40 px-2 py-0.5 text-xs text-ai">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <Button className="w-full" disabled={!imageName} onClick={() => submit("Imagen con auto-etiquetado")}>
              <Send className="mr-2 size-4" /> Enviar evidencia fotográfica
            </Button>
          </TabsContent>

          <TabsContent value="texto" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="region-report">Municipio / región</Label>
              <Select defaultValue="Mocoa">
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
              <Textarea id="desc" rows={4} placeholder="Describe qué ocurrió, dónde y qué se necesita con urgencia." />
            </div>
            <Button className="w-full" onClick={() => submit("Descripción de texto")}>
              <Send className="mr-2 size-4" /> Enviar reporte
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
