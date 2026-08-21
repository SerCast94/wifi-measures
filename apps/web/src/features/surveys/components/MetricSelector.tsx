import type { SurveyMetric } from "../types/survey.types";

interface MetricSelectorProps {
  metrics: SurveyMetric[];
  activeKey: string;
  onChange: (key: string) => void;
}

export const MetricSelector = ({
  metrics,
  activeKey,
  onChange,
}: MetricSelectorProps) => {
  if (metrics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {metrics.map((metric) => (
        <button
          key={metric.key}
          type="button"
          onClick={() => onChange(metric.key)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
            activeKey === metric.key
              ? "border-primary bg-primary/10 text-primary"
              : "border-input text-muted-foreground hover:bg-accent"
          }`}
        >
          <span>{metric.label}</span>
          <span className="text-xs text-muted-foreground">
            {metric.unit}
          </span>
          <span className="text-xs">({metric.points.length})</span>
        </button>
      ))}
    </div>
  );
};