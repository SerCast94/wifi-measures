/** Valor normalizado a 0..1. */
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Ángulo de hue del gradiente de calor: 0 = rojo (pobre), 120 = verde (excelente). */
export const heatHue = (value: number): number =>
  Math.round(clamp01(value) * 120);

/** Color HSLA del gradiente con la opacidad indicada (alpha 0..1). */
export const heatColor = (value: number, alpha: number): string =>
  `hsla(${heatHue(value)}, 90%, 50%, ${alpha})`;

/** Stops CSS del gradiente (sin alpha) para barras y leyendas. */
export const heatGradientStops = (steps = 20): string =>
  Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return `hsl(${heatHue(t)},90%,50%) ${(t * 100).toFixed(1)}%`;
  }).join(",");