import { useEffect, useMemo, useRef } from "react";

import { SurveyHeatmap } from "@/features/surveys/components/SurveyHeatmap";
import type { MeasureModel } from "@/features/measures/models/measure.model";
import type {
  AreaPlan,
  AreaPlanPosition,
} from "@/features/measures/types/area-plan.types";

interface PlanHeatmapProps {
  plan: AreaPlan;
  measures: MeasureModel[];
}

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
  label: string;
}

const COLOR_INTENSITY: Record<string, number> = {
  green: 1,
  yellow: 0.55,
  red: 0.25,
  black: 0.15,
};

const getIntensity = (measure?: MeasureModel): number => {
  const raw = (measure?.raw ?? {}) as Record<string, unknown>;
  const color = `${raw.overallColor ?? ""}`;
  return COLOR_INTENSITY[color] ?? 0.4;
};

export const PlanHeatmap = ({ plan, measures }: PlanHeatmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const heatmap = plan.heatmap;
  const hasImportedHeatmap = heatmap != null && heatmap.points.length > 0;

  const points = useMemo<HeatPoint[]>(() => {
    const measuresById: Record<string, MeasureModel> = {};
    for (const measure of measures) {
      measuresById[`${measure.id}`] = measure;
    }

    const result: HeatPoint[] = [];
    if (plan.positions) {
      for (const [id, position] of Object.entries(plan.positions)) {
        const pos = position as AreaPlanPosition;
        const measure = measuresById[id];
        result.push({
          x: pos.x,
          y: pos.y,
          intensity: getIntensity(measure),
          label: measure?.name ?? id,
        });
      }
    }
    return result;
  }, [plan.positions, measures]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      const radius = Math.max(canvas.width, canvas.height) * 0.1;

      for (const point of points) {
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / 100) * canvas.height;
        const hue = point.intensity * 120;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${hue}, 90%, 50%, 0.7)`);
        gradient.addColorStop(1, `hsla(${hue}, 90%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      points.forEach((point, index) => {
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / 100) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#111827";
        ctx.stroke();

        ctx.fillStyle = "#111827";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`${index + 1}`, x + 9, y - 7);
      });
    };
    image.src = plan.image;
  }, [plan.image, points]);

  return hasImportedHeatmap && heatmap ? (
    <SurveyHeatmap
      image={plan.image}
      points={heatmap.points}
      unit={heatmap.unit ?? ""}
      metricLabel={heatmap.metric ?? "Señal"}
    />
  ) : (
    <div className="relative w-full overflow-hidden rounded-2xl border">
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
};