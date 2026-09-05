import { useCallback, useLayoutEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import html2canvas from "html2canvas";
import { Camera, Loader2, MapPin, Ruler, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";
import { Input } from "@/core/atomic-components/input";
import { Label } from "@/core/atomic-components/label";

import "leaflet/dist/leaflet.css";

import { useCreateFloorPlan } from "../hooks/use-create-floorplan";
import {
  computeScaleFromGeoCalibration,
  geoDistanceMeters,
} from "../lib/geo-projection";
import type {
  FloorPlan,
  GeoCalibration,
  ScaleCalibration,
} from "../types/floorplan.types";
import { uploadFloorPlan } from "@/features/netally/api/netally.api";

interface CreateFloorPlanFromMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (plan: FloorPlan) => void;
  initialPoints?: Array<{ lat: number; lon: number }> | null;
}

const MapBridge = ({ onReady }: { onReady: (map: L.Map) => void }) => {
  const map = useMap();
  onReady(map);
  return null;
};

const FitInitialPoints = ({
  points,
}: {
  points: Array<{ lat: number; lon: number }>;
}) => {
  const map = useMap();
  useLayoutEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 17);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lon] as [number, number])
    );
    map.fitBounds(bounds.pad(0.12), { maxZoom: 16 });
  }, [map, points]);
  return null;
};

export const CreateFloorPlanFromMapDialog = ({
  open,
  onOpenChange,
  onCreated,
  initialPoints = null,
}: CreateFloorPlanFromMapDialogProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [geoCalibration, setGeoCalibration] = useState<GeoCalibration | null>(
    null
  );
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [widthMeters, setWidthMeters] = useState(0);
  const [heightMeters, setHeightMeters] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const createPlan = useCreateFloorPlan();
  const [netallyUploading, setNetallyUploading] = useState(false);

  const reset = useCallback(() => {
    setName("");
    setPreview(null);
    setGeoCalibration(null);
    setDimensions({ width: 0, height: 0 });
    setWidthMeters(0);
    setHeightMeters(0);
  }, []);

  const handleClose = (next: boolean) => {
    if (createPlan.isPending) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const captureArea = async () => {
    const map = mapRef.current;
    if (!map) return;
    setCapturing(true);
    try {
      const container = map.getContainer();
      const bounds = map.getBounds();
      const nw = bounds.getNorthWest();
      const ne = bounds.getNorthEast();
      const se = bounds.getSouthEast();
      const sw = bounds.getSouthWest();
      const geo: GeoCalibration = {
        topLeftLat: nw.lat,
        topLeftLon: nw.lng,
        topRightLat: ne.lat,
        topRightLon: ne.lng,
        bottomRightLat: se.lat,
        bottomRightLon: se.lng,
        bottomLeftLat: sw.lat,
        bottomLeftLon: sw.lng,
      };
      const canvas = await html2canvas(container, {
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const image = canvas.toDataURL("image/png");
      setPreview(image);
      setGeoCalibration(geo);
      setDimensions({ width: canvas.width, height: canvas.height });
      const computed = computeScaleFromGeoCalibration(
        geo,
        canvas.width,
        canvas.height
      );
      if (computed) {
        setWidthMeters(computed.scale.realDistance);
        setHeightMeters(
          geoDistanceMeters(
            geo.topLeftLat,
            geo.topLeftLon,
            geo.bottomLeftLat,
            geo.bottomLeftLon
          )
        );
      }
      if (!name) {
        setName("Mapa exterior");
      }
    } catch (err) {
      toast.error(`No se pudo capturar el mapa: ${(err as Error).message}`);
    } finally {
      setCapturing(false);
    }
  };

  const handleResetCapture = () => {
    setPreview(null);
    setGeoCalibration(null);
    setWidthMeters(0);
    setHeightMeters(0);
  };

  const handleSubmit = async () => {
    if (
      !preview ||
      !geoCalibration ||
      dimensions.width <= 0 ||
      dimensions.height <= 0
    ) {
      toast.error("La zona capturada no tiene escala calculada.");
      return;
    }
    const finalName = name.trim() || "Mapa exterior";

    const widthM = Number(widthMeters);
    const heightM = Number(heightMeters);
    if (!Number.isFinite(widthM) || widthM <= 0) {
      toast.error("Introduce un ancho válido en metros.");
      return;
    }
    if (!Number.isFinite(heightM) || heightM <= 0) {
      toast.error("Introduce un alto válido en metros.");
      return;
    }

    const pixelsPerMeter = dimensions.width / widthM;
    const scale: ScaleCalibration = {
      pixelsPerMeter,
      pixelDistance: dimensions.width,
      realDistance: widthM,
      unit: "m",
      pointA: { x: 0, y: 0.5 },
      pointB: { x: 1, y: 0.5 },
    };

    setNetallyUploading(true);
    try {
      const FT = 3.28084;
      const ppf = scale.pixelsPerMeter / FT;
      const widthFt = dimensions.width / ppf;
      const heightFt = dimensions.height / ppf;
      const upload = await uploadFloorPlan({
        imageBase64: preview.split(",")[1] ?? preview,
        labels: ["mapa-exterior"],
        fileName: "mapa-exterior.png",
        floorPlanName: finalName,
        floorPlanWidthPx: dimensions.width,
        floorPlanHeightPx: dimensions.height,
        floorPlanScalePpf: ppf,
        unit: "ft",
        width: Math.round(widthFt * 10) / 10,
        height: Math.round(heightFt * 10) / 10,
      });

      const plan = await createPlan.mutateAsync({
        name: finalName,
        fileName: "mapa-exterior.png",
        mimeType: "image/png",
        fileType: "image",
        size: Math.round(preview.length * 0.75),
        image: preview,
        width: dimensions.width || 100,
        height: dimensions.height || 100,
        scale,
        geoCalibration,
        floorZone: "mapa exterior",
        linkLiveId: upload?.id,
      });

      reset();
      onOpenChange(false);
      onCreated(plan);
      toast.success("Plano subido a NetAlly y guardado correctamente");
    } catch (err) {
      toast.error(
        `Error al subir/guardar el plano: ${(err as Error).message}`
      );
    } finally {
      setNetallyUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl !flex !flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crear plano desde el mapa</DialogTitle>
          <DialogDescription>
            Ajusta el mapa a la zona que quieres usar como plano y pulsa «Capturar
            zona». El encuadre se guardará como plano y quedará georreferenciado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {!preview ? (
            <div className="relative h-[400px] w-full overflow-hidden rounded-lg border">
              <MapContainer
                center={[40.4168, -3.7038]}
                zoom={15}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapBridge onReady={(map) => (mapRef.current = map)} />
                <FitInitialPoints points={initialPoints ?? []} />
              </MapContainer>
              <div className="pointer-events-none absolute inset-4 z-[1000] rounded-md border-2 border-dashed border-primary/70" />
            </div>
          ) : (
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg border">
              <img
                src={preview}
                alt="Zona capturada"
                className="h-full w-full object-contain"
              />
              <div className="absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                <MapPin className="h-3.5 w-3.5" />
                Georreferenciado
              </div>
            </div>
          )}

          {preview && (
            <div className="mt-3 space-y-3 rounded-xl border p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Ruler className="h-4 w-4 text-primary" />
                Calibrar dimensiones
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-end gap-1">
                  <Label>Ancho (metros)</Label>
                  <div className="flex w-full items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(Number(widthMeters)) ? widthMeters : ""}
                      onChange={(e) => setWidthMeters(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Label>Alto (metros)</Label>
                  <div className="flex w-full items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={Number.isFinite(Number(heightMeters)) ? heightMeters : ""}
                      onChange={(e) => setHeightMeters(Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                La escala se calcula automáticamente a partir del ancho en metros.
                Ajusta los valores si el mapa está rotado o la referencia es
                imprecisa. Las{" "}
                <span className="font-medium text-foreground">4 esquinas</span>{" "}
                quedan georreferenciadas desde el encuadre capturado.
              </p>
            </div>
          )}

          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="map-plan-name">Nombre del plano</Label>
              <Input
                id="map-plan-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Mapa exterior zona norte"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-3 flex shrink-0 items-center gap-2">
          {!preview ? (
            <Button onClick={captureArea} disabled={capturing}>
              {capturing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Capturar zona
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleResetCapture}
                disabled={createPlan.isPending || netallyUploading}
              >
                <X className="mr-2 h-4 w-4" />
                Rehacer
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || netallyUploading}
              >
                {netallyUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Subir a NetAlly
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            onClick={() => handleClose(false)}
            disabled={createPlan.isPending}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
