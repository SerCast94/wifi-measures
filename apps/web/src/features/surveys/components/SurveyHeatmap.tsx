import { useEffect, useMemo, useRef } from "react";

export interface SurveyHeatmapPoint {
  x: number;
  y: number;
  value: number | null;
}

interface SurveyHeatmapProps {
  image: string;
  points: SurveyHeatmapPoint[];
  unit: string;
  metricLabel: string;
}

const GRID_CELL = 6;
const MAX_CANVAS_WIDTH = 1600;
const MIN_ALPHA = 0.04;
const MAX_ALPHA = 0.62;
const EPSILON = 1;

const colorFor = (t: number, alpha: number): string => {
  const hue = Math.max(0, Math.min(1, t)) * 120;
  return `hsla(${hue}, 90%, 50%, ${alpha})`;
};

interface HeatPoint {
  x: number;
  y: number;
  value: number;
  pointIdx: number;
}

export const SurveyHeatmap = ({
  image,
  points,
  unit,
  metricLabel,
}: SurveyHeatmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const heatPoints = useMemo<HeatPoint[]>(
    () =>
      points
        .filter(
          (
            point
          ): point is SurveyHeatmapPoint & { value: number } =>
            point.value !== null && Number.isFinite(point.value)
        )
        .map((point) => ({
          x: point.x,
          y: point.y,
          value: point.value,
          pointIdx: 0,
        })),
    [points]
  );

  const range = useMemo(() => {
    const values = heatPoints.map((point) => point.value);
    if (values.length === 0) return { min: 0, max: 1 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max === min ? { min: min - 1, max: max + 1 } : { min, max };
  }, [heatPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_CANVAS_WIDTH / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (heatPoints.length > 0) {
        drawHeat(ctx, canvas.width, canvas.height);
      }

      drawMarkers(ctx, canvas.width, canvas.height);
      drawLegend(ctx, canvas.height);
    };
    img.src = image;

    return () => {
      img.onload = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, heatPoints, range.min, range.max, unit, metricLabel]);

const drawHeat = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const maxRadius = Math.max(width, height) * 0.16;
    const cell = Math.max(GRID_CELL, Math.floor(Math.max(width, height) / 200));
    const scaledPoints = heatPoints.map((point) => ({
      x: (point.x / 100) * width,
      y: (point.y / 100) * height,
      value: point.value,
    }));

    ctx.save();
    for (let gy = 0; gy < height; gy += cell) {
      for (let gx = 0; gx < width; gx += cell) {
        let weightSum = 0;
        let valueSum = 0;
        let minDistance = Infinity;

        for (const point of scaledPoints) {
          const dx = gx - point.x;
          const dy = gy - point.y;
          const distanceSq = dx * dx + dy * dy;
          const distance = Math.sqrt(distanceSq);
          if (distance < minDistance) minDistance = distance;

          const weight = 1 / (distanceSq + EPSILON);
          weightSum += weight;
          valueSum += weight * point.value;
        }

        const alpha =
          Math.max(0, Math.min(1, 1 - minDistance / maxRadius)) *
            (MAX_ALPHA - MIN_ALPHA) +
          MIN_ALPHA;
        if (alpha <= 0) continue;

        const value = valueSum / weightSum;
        const t = (value - range.min) / (range.max - range.min);
        ctx.fillStyle = colorFor(t, alpha);
        ctx.fillRect(gx, gy, cell, cell);
      }
    }
    ctx.restore();
  };

  const drawMarkers = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const fontPx = Math.max(14, Math.round(Math.max(width, height) / 90));
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    for (const point of heatPoints) {
      const x = (point.x / 100) * width;
      const y = (point.y / 100) * height;

      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#111827";
      ctx.stroke();

      const label = point.value.toFixed(0);

      ctx.font = `bold ${fontPx}px sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.strokeText(label, x + 10, y);
      ctx.fillStyle = "#111827";
      ctx.fillText(label, x + 10, y);
    }
  };

  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    height: number
  ) => {
    const barWidth = 180;
    const barHeight = 14;
    const x = 16;
    const y = height - barHeight - 20;
    const gradient = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    for (let i = 0; i <= 10; i++) {
      gradient.addColorStop(i / 10, colorFor(i / 10, 1));
    }

    ctx.save();
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.strokeStyle = "rgba(17,24,39,0.2)";
    ctx.beginPath();
    ctx.rect(x - 10, y - 16, barWidth + 20, barHeight + 30);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${metricLabel} (${unit})`, x + barWidth / 2, y - 8);

    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${range.min.toFixed(0)}`, x, y + barHeight + 8);
    ctx.textAlign = "right";
    ctx.fillText(`${range.max.toFixed(0)}`, x + barWidth, y + barHeight + 8);
    ctx.restore();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border">
      <canvas ref={canvasRef} className="block w-full h-auto" />
    </div>
  );
};