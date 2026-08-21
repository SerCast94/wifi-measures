import { LinkLiveResult } from "@core/linklive/linklive.service";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";

export class LinkLiveResultMapper {
  static fromResultToEntity(result: LinkLiveResult): MeasureEntity {
    const name =
      result.profileName ??
      result.meta?.resultIdentifier ??
      result.unit_name ??
      "";

    return MeasureEntity.create({
      id: result._id,
      idArea: 0,
      lat: null,
      lon: null,
      areaGeogr: result.unit_name ?? "",
      provincia: "",
      emisiones: result.resultType ?? "",
      ptoMedida: "",
      nMedida: 0,
      fechaHora: result.created_at ?? "",
      azimut: 0,
      monitorizacion: result.overallColor ?? null,
      obsGenerales: JSON.stringify(result.labels ?? []),
      idFormulario: result._id,
      name,
      raw: result,
      createdAt: result.created_at ? new Date(result.created_at) : new Date(),
      updatedAt: result.updated_at ? new Date(result.updated_at) : new Date(),
    });
  }
}
