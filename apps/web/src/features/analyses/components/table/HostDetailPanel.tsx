import { Badge } from "@/core/atomic-components/badge";
import { Separator } from "@/core/atomic-components/separator";
import type { AnalysisHost } from "../../types/analysis.types";
import {
  countLabels,
  formatDate,
  formatMac,
  formatSignal,
  formatSnr,
} from "./hosts-format";

interface HostDetailPanelProps {
  host: AnalysisHost;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-xs font-medium text-muted-foreground uppercase">
      {label}
    </dt>
    <dd className="text-sm break-all">{value ?? "—"}</dd>
  </div>
);

export const HostDetailPanel = ({ host }: HostDetailPanelProps) => {
  return (
    <div className="grid gap-4 py-2 mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{host.hostType}</Badge>
        <Badge variant={host.inactive ? "secondary" : "default"}>
          {host.inactive ? "Inactivo" : "Activo"}
        </Badge>
        {host.mac && (
          <span className="font-mono text-xs text-muted-foreground">
            {formatMac(host.mac)}
          </span>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DetailItem label="Nombre" value={host.name} />
        <DetailItem label="MAC" value={host.mac ? formatMac(host.mac) : null} />
        <DetailItem label="Canal" value={host.channel} />
        <DetailItem label="Banda" value={host.band} />
        <DetailItem label="SSID" value={host.ssid} />
        <DetailItem label="Seguridad" value={host.securityType} />
        <DetailItem label="Protocolo" value={host.protocol} />
        <DetailItem label="Señal" value={formatSignal(host.signal)} />
        <DetailItem label="SNR" value={formatSnr(host.snr)} />
        <DetailItem label="Última vez" value={formatDate(host.lastSeen)} />
      </dl>

      {host.counts && Object.keys(host.counts).length > 0 && (
        <>
          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              Conteos asociados
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(host.counts)
                .filter(([, value]) => value !== null)
                .map(([key, value]) => (
                  <Badge key={key} variant="secondary">
                    {countLabels[key] ?? key}: {value}
                  </Badge>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};