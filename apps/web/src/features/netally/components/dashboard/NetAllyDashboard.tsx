import { useMemo } from "react";

import {
  AlertTriangle,
  FileImage,
  Gauge,
  RadioTower,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "@/core/atomic-components/card";
import CustomLoading from "@/core/components/CustomLoading";
import { useNetAllyDashboard } from "@/features/netally/hooks/use-netally-dashboard";

const COLOR_LABELS: Record<string, { label: string; className: string }> = {
  red: { label: "Rojos", className: "bg-red-500" },
  yellow: { label: "Amarillos", className: "bg-yellow-400" },
  green: { label: "Verdes", className: "bg-green-500" },
  black: { label: "Negros", className: "bg-gray-500" },
};

const formatDate = (date: string | null): string => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const StatCard = ({
  icon,
  label,
  value,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  to?: string;
}) => {
  const content = (
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground truncate">{label}</p>
      </div>
    </CardContent>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-lg border bg-card shadow-sm transition-colors hover:bg-accent/50"
      >
        {content}
      </Link>
    );
  }

  return <Card>{content}</Card>;
};

const COLOR_LINKS: Record<string, string> = {
  red: "/measures?color=red",
  yellow: "/measures?color=yellow",
  green: "/measures?color=green",
  black: "/measures?color=black",
};

const ColorLegend = ({
  resultsByColor,
}: {
  resultsByColor: Record<string, number>;
}) => {
  const entries = Object.entries(resultsByColor ?? {});
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin resultados.</p>;
  }

  const total = entries.reduce((acc, [, count]) => acc + count, 0);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {entries.map(([color, count]) => {
        const meta = COLOR_LABELS[color] ?? {
          label: color,
          className: "bg-gray-400",
        };
        const link = COLOR_LINKS[color];
        const body = (
          <>
            <span
              className={`inline-block w-3 h-3 rounded-full ${meta.className}`}
            />
            <span className="capitalize">{meta.label}</span>
            <span className="font-semibold">
              {count} ({Math.round((count / total) * 100)}%)
            </span>
          </>
        );
        return link ? (
          <Link
            key={color}
            to={link}
            className="flex items-center gap-2 text-sm hover:underline"
            title={`Ver medidas en ${meta.label.toLowerCase()}`}
          >
            {body}
          </Link>
        ) : (
          <div key={color} className="flex items-center gap-2 text-sm">
            {body}
          </div>
        );
      })}
    </div>
  );
};

export const NetAllyDashboard = () => {
  const { data, isLoading, isError } = useNetAllyDashboard();

  const colorsCount = useMemo(
    () => Object.values(data?.resultsByColor ?? {}).reduce((a, b) => a + b, 0),
    [data]
  );
  const unitsCount = useMemo(
    () => Object.values(data?.unitsByType ?? {}).reduce((a, b) => a + b, 0),
    [data]
  );

  if (isLoading) {
    return <CustomLoading />;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<RadioTower className="w-5 h-5" />}
          label="Resultados NetAlly"
          value={data.totalResults}
          to="/measures"
        />
        <StatCard
          icon={<Gauge className="w-5 h-5" />}
          label="Unidades"
          value={data.totalUnits || unitsCount}
          to="/units"
        />
        <StatCard
          icon={<FileImage className="w-5 h-5" />}
          label="Archivos subidos"
          value={data.totalFiles}
          to="/units"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Resultados con fallos"
          value={data.resultsWithFailures}
          to="/measures?failed=true"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold">
              Resultados por color ({colorsCount})
            </p>
            <ColorLegend resultsByColor={data.resultsByColor} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Unidades por tipo</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizado: {formatDate(data.lastUpdated)}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {Object.entries(data.unitsByType ?? {}).map(([type, count]) => (
                <Link
                  key={type}
                  to={`/units?q=${encodeURIComponent(type)}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                  title={`Ver unidades de tipo ${type}`}
                >
                  <span className="font-medium">{type}</span>
                  <span className="font-semibold">{count}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};