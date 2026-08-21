import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon } from "lucide-react";

import { Card, CardContent } from "@/core/atomic-components/card";
import { useMeasuresStore } from "@/features/measures/store/measures.store";
import {
  getResultsByMonth,
  getSignalHistogram,
  getSnrHistogram,
  getTopFailureReasons,
} from "../lib/measures-stats";

const COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  yellow: "#facc15",
  green: "#22c55e",
  black: "#6b7280",
};

const ChartCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    <CardContent className="p-4 space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      {children}
    </CardContent>
  </Card>
);

export const MeasuresAnalytics = () => {
  const measures = useMeasuresStore((state) => state.measures);
  const measuresList = useMemo(() => Object.values(measures ?? {}), [measures]);

  const byMonth = useMemo(
    () => getResultsByMonth(measuresList, 6),
    [measuresList]
  );
  const signalHistogram = useMemo(
    () => getSignalHistogram(measuresList),
    [measuresList]
  );
  const snrHistogram = useMemo(() => getSnrHistogram(measuresList), [measuresList]);
  const topFailures = useMemo(
    () => getTopFailureReasons(measuresList),
    [measuresList]
  );

  const hasSignalData = signalHistogram.some((bucket) => bucket.count > 0);
  const hasSnrData = snrHistogram.some((bucket) => bucket.count > 0);
  const hasMonthData = byMonth.some(
    (bucket) => bucket.red + bucket.yellow + bucket.green + bucket.black > 0
  );

  if (measuresList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <LineChartIcon className="w-4 h-4" />
        Evolución de medidas
      </h2>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          title="Resultados por mes"
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        >
          {hasMonthData ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth} margin={{ top: 4, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  {["green", "yellow", "red", "black"].map((color) => (
                    <Bar
                      key={color}
                      dataKey={color}
                      stackId="a"
                      fill={COLOR_HEX[color]}
                      radius={color === "black" ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-sm text-center text-muted-foreground">
              Sin datos suficientes.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Motivos de fallo más frecuentes"
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        >
          {topFailures.length > 0 ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topFailures}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="reason"
                    width={180}
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value: string) =>
                      value.length > 34 ? `${value.slice(0, 34)}…` : value
                    }
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-sm text-center text-muted-foreground">
              No se han registrado fallos.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Distribución de señal (dBm)"
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        >
          {hasSignalData ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={signalHistogram} margin={{ top: 4, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-sm text-center text-muted-foreground">
              Las medidas no incluyen datos de señal.
            </p>
          )}
        </ChartCard>

        <ChartCard
          title="Distribución de SNR (dB)"
          icon={<BarChart3 className="w-4 h-4 text-muted-foreground" />}
        >
          {hasSnrData ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={snrHistogram} margin={{ top: 4, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-10 text-sm text-center text-muted-foreground">
              Las medidas no incluyen datos de SNR.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
};
