import { useState } from "react";
import { useParams } from "react-router";
import { CheckIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/atomic-components/dialog";
import { Input } from "@/core/atomic-components/input";
import { Label } from "@/core/atomic-components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import { SeverityBadge } from "@/features/audits/components/badges";
import {
  useCreateIssue,
  useDeleteIssue,
  useIssues,
  useUpdateIssue,
} from "@/features/audits/hooks/use-audit-records";

const STATE_LABELS: Record<string, string> = {
  SUGERIDA: "Sugerida",
  ACEPTADA: "Aceptada",
  MODIFICADA: "Modificada",
  DESCARTADA: "Descartada",
};

const issueSeverityValues = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const SEVERITY_LABELS: Record<string, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

/** Reduce y comprime la foto en el cliente para almacenarla como data URL. */
const fileToCompressedDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Imagen no válida"));
      image.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Canvas no disponible"));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const AuditIssuesPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: issues, isLoading } = useIssues(auditId);
  const updateIssue = useUpdateIssue(auditId);
  const deleteIssue = useDeleteIssue(auditId);
  const createIssue = useCreateIssue(auditId);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [locationLabel, setLocationLabel] = useState("");
  const [recommendationText, setRecommendationText] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  if (isLoading || !issues) return <CustomLoading />;

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPhoto(await fileToCompressedDataUrl(file));
    } catch {
      toast.error("No se pudo procesar la imagen.");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("El título de la incidencia es obligatorio.");
      return;
    }
    try {
      await createIssue.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        severity: severity as typeof issueSeverityValues[number],
        locationLabel: locationLabel.trim() || undefined,
        recommendationText: recommendationText.trim() || undefined,
        photo,
      });
      toast.success("Incidencia creada.");
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setLocationLabel("");
      setRecommendationText("");
      setPhoto(null);
      setOpen(false);
    } catch {
      // gestionado globalmente
    }
  };

  return (
    <div className="container max-w-4xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Incidencias</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusIcon className="w-4 h-4 mr-1" /> Incidencia manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva incidencia manual</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="issue-title">Título *</Label>
                <Input
                  id="issue-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Gravedad</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {issueSeverityValues.map((option) => (
                        <SelectItem key={option} value={option}>
                          {SEVERITY_LABELS[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issue-location">Ubicación</Label>
                  <Input
                    id="issue-location"
                    value={locationLabel}
                    onChange={(event) => setLocationLabel(event.target.value)}
                    placeholder="Planta 1 · Despacho A"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-desc">Descripción</Label>
                <Input
                  id="issue-desc"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Detalle del problema observado…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-rec">Recomendación</Label>
                <Input
                  id="issue-rec"
                  value={recommendationText}
                  onChange={(event) => setRecommendationText(event.target.value)}
                  placeholder="Acción propuesta para resolver la incidencia…"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="issue-photo">Foto (opcional)</Label>
                <Input
                  id="issue-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => handlePhoto(event.target.files?.[0])}
                />
                {photo ? (
                  <div className="flex items-center gap-2">
                    <img src={photo} alt="Foto adjunta" className="h-16 w-24 rounded border object-cover" />
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setPhoto(null)}>
                      Quitar
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createIssue.isPending}>
                Crear incidencia
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {issues.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No hay incidencias. Ejecuta la evaluación para detectar problemas
            automáticamente o crea una manual.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader className="pb-1">
                <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                  <SeverityBadge severity={issue.severity} />
                  <span>{issue.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {issue.origin === "AUTO" ? "detectada automáticamente" : "manual"} ·{" "}
                    {STATE_LABELS[issue.state]}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {issue.photo ? (
                  <img
                    src={issue.photo}
                    alt={`Foto de ${issue.title}`}
                    className="max-h-48 rounded border object-cover"
                  />
                ) : null}
                {issue.description ? (
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                ) : null}
                {issue.recommendationText ? (
                  <p className="text-sm">
                    <span className="font-medium">Recomendación: </span>
                    {issue.recommendationText}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {[issue.locationLabel, issue.metric]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <div className="flex flex-wrap gap-1">
                  {issue.state !== "ACEPTADA" && issue.state !== "MODIFICADA" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateIssue.isPending}
                      onClick={() =>
                        updateIssue.mutate({
                          issueId: issue.id,
                          input: { state: "ACEPTADA" },
                        })
                      }
                    >
                      <CheckIcon className="w-4 h-4 mr-1" /> Aceptar
                    </Button>
                  ) : null}
                  {issue.state !== "DESCARTADA" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateIssue.isPending}
                      onClick={() =>
                        updateIssue.mutate({
                          issueId: issue.id,
                          input: { state: "DESCARTADA" },
                        })
                      }
                    >
                      <XIcon className="w-4 h-4 mr-1" /> Descartar
                    </Button>
                  ) : null}
                  {issue.state === "DESCARTADA" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateIssue.isPending}
                      onClick={() =>
                        updateIssue.mutate({
                          issueId: issue.id,
                          input: { state: "SUGERIDA" },
                        })
                      }
                    >
                      Restaurar
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={deleteIssue.isPending}
                    onClick={() => deleteIssue.mutate(issue.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditIssuesPage;
