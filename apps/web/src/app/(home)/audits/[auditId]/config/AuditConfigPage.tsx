import { useState } from "react";
import { useParams } from "react-router";
import { Link2OffIcon, PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Badge } from "@/core/atomic-components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import { useAudit, useUpdateAudit } from "@/features/audits/hooks/use-audits";
import {
  useSetAnexos,
  type AnexoItem,
} from "@/features/audits/hooks/use-files";
import { useUnits } from "@/features/netally/hooks/use-units";
import {
  useAddAuditMembers,
  useAuditCandidates,
  useAuditMembers,
  useRemoveAuditMember,
  useSetAuditFloors,
  useUpdateAuditMember,
} from "@/features/audits/hooks/use-audit-workflow";

type MemberType = "measure" | "survey" | "analysis";

const TYPE_LABELS: Record<MemberType, string> = {
  measure: "Medidas (señal / iPerf)",
  survey: "Encuestas de cobertura",
  analysis: "Análisis de espectro",
};

const MeasureTypeBadge = ({ type }: { type?: string | null }) =>
  type === "iperf" ? (
    <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-700">
      iPerf
    </Badge>
  ) : (
    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
      Señal / redes
    </Badge>
  );

const FloorSelect = ({
  floors,
  value,
  onChange,
}: {
  floors: Array<{ id: number; name: string }>;
  value: number | null;
  onChange: (floorId: number | null) => void;
}) => {
  const options = [{ id: -1, name: "Sin planta" }, ...floors];
  return (
    <Select
      value={String(value ?? -1)}
      onValueChange={(next) => onChange(next === "-1" ? null : Number(next))}
    >
      <SelectTrigger className="h-8 w-40 text-xs">
        <SelectValue placeholder="Planta…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((floor) => (
          <SelectItem key={floor.id} value={String(floor.id)}>
            {floor.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const MembersSection = ({ type }: { type: MemberType }) => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const [pageSize, setPageSize] = useState(50);
  const members = useAuditMembers(auditId);
  const candidates = useAuditCandidates(auditId, type, 1, pageSize);
  const addMembers = useAddAuditMembers(auditId);
  const removeMember = useRemoveAuditMember(auditId);
  const updateMember = useUpdateAuditMember(auditId);
  const { data: audit } = useAudit(auditId);
  const [selected, setSelected] = useState<string[]>([]);

  const memberIds = new Set<string>(
    type === "measure"
      ? (members.data?.measures ?? []).map((link) => link.measure.id)
      : type === "survey"
        ? (members.data?.surveys ?? []).map((link) => String(link.survey.id))
        : (members.data?.analyses ?? []).map((link) => String(link.analysis.id))
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleAdd = async () => {
    if (selected.length === 0) return;
    try {
      await addMembers.mutateAsync({ type, ids: selected });
      toast.success(`${selected.length} captura(s) añadida(s).`);
      setSelected([]);
    } catch {
      // gestionado globalmente
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({ type, memberId });
      toast.success("Captura desvinculada.");
    } catch {
      // gestionado globalmente
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{TYPE_LABELS[type]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Captura vinculada</TableHead>
              <TableHead>Planta / detalle</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {type === "measure" &&
              (members.data?.measures ?? []).map((link) => (
                <TableRow key={link.measure.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{link.measure.name ?? link.measure.idLinkLive}</span>
                      <MeasureTypeBadge type={link.measureType} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FloorSelect
                        floors={audit?.floors ?? []}
                        value={link.floorId}
                        onChange={(floorId) =>
                          updateMember.mutate({
                            type,
                            memberId: link.measure.id,
                            input: { floorId },
                          })
                        }
                      />
                      {link.label ? (
                        <span className="text-xs text-muted-foreground">{link.label}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(link.measure.id)}
                    >
                      <Link2OffIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {type === "survey" &&
              (members.data?.surveys ?? []).map((link) => (
                <TableRow key={link.survey.id}>
                  <TableCell>
                    {link.survey.surveyName ?? link.survey.name ?? `Survey ${link.survey.id}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FloorSelect
                        floors={audit?.floors ?? []}
                        value={link.floorId}
                        onChange={(floorId) =>
                          updateMember.mutate({
                            type,
                            memberId: String(link.survey.id),
                            input: { floorId },
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {link.survey.surveyPointCount} puntos
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(String(link.survey.id))}
                    >
                      <Link2OffIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {type === "analysis" &&
              (members.data?.analyses ?? []).map((link) => (
                <TableRow key={link.analysis.id}>
                  <TableCell>
                    {link.analysis.name ?? link.analysis.idLinkLive}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FloorSelect
                        floors={audit?.floors ?? []}
                        value={link.floorId}
                        onChange={(floorId) =>
                          updateMember.mutate({
                            type,
                            memberId: String(link.analysis.id),
                            input: { floorId },
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        {link.analysis.apsCount ?? 0} APs ·{" "}
                        {link.analysis.clientsCount ?? 0} clientes
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(String(link.analysis.id))}
                    >
                      <Link2OffIcon className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {(type === "measure" && (members.data?.measures.length ?? 0) === 0) ||
            (type === "survey" && (members.data?.surveys.length ?? 0) === 0) ||
            (type === "analysis" && (members.data?.analyses.length ?? 0) === 0) ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  Sin capturas vinculadas.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="rounded-md border p-3 space-y-2">
          <p className="text-sm font-medium">Añadir desde capturas disponibles</p>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {(() => {
              const candidateList = ((candidates.data ?? []) as Array<Record<string, unknown>>)
                .filter((candidate) => !memberIds.has(String(candidate.id)));
              const groups: Array<{ key: string; label?: string; list: Array<Record<string, unknown>> }> =
                type === "measure"
                  ? [
                      {
                        key: "wireless",
                        label: "Señal / conexión",
                        list: candidateList.filter((candidate) => candidate.measureType !== "iperf"),
                      },
                      {
                        key: "iperf",
                        label: "Rendimiento (iPerf)",
                        list: candidateList.filter((candidate) => candidate.measureType === "iperf"),
                      },
                    ]
                  : [{ key: "all", list: candidateList }];
              return groups.map((group) =>
                group.list.length === 0 ? null : (
                  <div key={group.key} className="space-y-1">
                    {group.label ? (
                      <p className="px-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                    ) : null}
                    <div className="space-y-1">
                      {group.list.map((candidate) => {
                        const id = String(candidate.id);
                        const label =
                          (candidate.name as string | null) ??
                          (candidate.surveyName as string | null) ??
                          (candidate.idLinkLive as string);
                        return (
                          <label
                            key={id}
                            className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected.includes(id)}
                              onChange={() => toggle(id)}
                            />
                            <span>{String(label)}</span>
                            {type === "measure" ? <MeasureTypeBadge type={candidate.measureType as string | null} /> : null}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )
              );
            })()}
            {(candidates.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay capturas disponibles: o ya están todas vinculadas a esta
                auditoría, o el rango de fechas configurado (Editar datos) no
                cubre la fecha de captura.
              </p>
            ) : null}
          </div>
          {(candidates.data ?? []).length >= pageSize ? (
            <Button size="sm" variant="ghost" onClick={() => setPageSize((prev) => prev + 50)}>
              Mostrar más (cargadas {pageSize})
            </Button>
          ) : null}
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={selected.length === 0 || addMembers.isPending}
          >
            <PlusIcon className="w-4 h-4 mr-1" /> Añadir seleccionadas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AuditConfigPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: audit } = useAudit(auditId);
  const updateAudit = useUpdateAudit(auditId);
  const setFloors = useSetAuditFloors(auditId);
  const [floorsText, setFloorsText] = useState<string | null>(null);

  if (!audit) return <CustomLoading />;

  const hasFilters =
    audit.areaKeys.length > 0 || Boolean(audit.ssidFilter);

  const floorsValue =
    floorsText ?? audit.floors.map((floor) => floor.name).join("\n");

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />

      {hasFilters ? (
        <Card className="mb-4 border-amber-300 bg-amber-50/50">
          <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">
              <span className="font-medium">Filtros de capturas activos:</span>{" "}
              {audit.areaKeys.length > 0 ? `áreas [${audit.areaKeys.join(", ")}]` : null}
              {audit.areaKeys.length > 0 && audit.ssidFilter ? " · " : null}
              {audit.ssidFilter ? `SSID «${audit.ssidFilter}»` : null}
              . Solo se ofrecen capturas que coincidan (además del rango de fechas).
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={updateAudit.isPending}
              onClick={() =>
                updateAudit.mutate({ areaKeys: [], ssidFilter: null })
              }
            >
              Quitar filtros
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Plantas / zonas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <textarea
            value={floorsValue}
            onChange={(event) => setFloorsText(event.target.value)}
            rows={3}
            placeholder={"Planta 1\nPlanta 2"}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={floorsText === null || setFloors.isPending}
            onClick={async () => {
              if (floorsText === null) return;
              try {
                await setFloors.mutateAsync(
                  floorsText
                    .split(/[\n,]/)
                    .map((name) => name.trim())
                    .filter(Boolean)
                );
                setFloorsText(null);
                toast.success("Plantas actualizadas.");
              } catch {
                // gestionado globalmente
              }
            }}
          >
            <SaveIcon className="w-4 h-4 mr-1" /> Guardar plantas
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <MembersSection type="measure" />
        <MembersSection type="survey" />
        <MembersSection type="analysis" />
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Anexos de la auditoría (Link-Live)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AuditAnexosManager auditId={auditId} />
        </CardContent>
      </Card>
    </div>
  );
};

const AuditAnexosManager = ({ auditId }: { auditId: string }) => {
  const { data: audit } = useAudit(auditId);
  const { data: units } = useUnits();
  const setAnexos = useSetAnexos(auditId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anexos: AnexoItem[] = Array.isArray((audit as any)?.anexos)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? ((audit as any).anexos as AnexoItem[])
    : [];
  const available = (units ?? [])
    .flatMap((unit) => unit.files ?? [])
    .map((file) => ({
        name: file.name,
        href: file.href ?? file.mediumImage ?? "",
        thumb: file.mediumImage ?? undefined,
      }))
    .filter((file) => file.href && !anexos.some((anexo) => anexo.href === file.href));

  return (
    <>
      {anexos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin anexos vinculados. Se mostrarán al final del informe y en el PDF.
        </p>
      ) : (
        <ul className="space-y-2">
          {anexos.map((anexo, index) => (
            <li key={index} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <a
                  href={anexo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-primary hover:underline"
                >
                  {anexo.name}
                </a>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  disabled={setAnexos.isPending}
                  onClick={() => setAnexos.mutate(anexos.filter((_, i) => i !== index))}
                >
                  Quitar
                </Button>
              </div>
              {/\.(png|jpe?g|gif|webp)$/i.test(anexo.href) || anexo.href.startsWith("data:") ? (
                <img src={anexo.href} alt={anexo.name} className="max-h-40 rounded border" />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 ? (
        <select
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value=""
          onChange={(event) => {
            const row = available.find((item) => item.href === event.target.value);
            if (row) setAnexos.mutate([...anexos, row]);
          }}
        >
          <option value="">+ Añadir adjunto de Link-Live…</option>
          {available.map((row) => (
            <option key={row.href} value={row.href}>
              {row.name}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );
};

export default AuditConfigPage;
