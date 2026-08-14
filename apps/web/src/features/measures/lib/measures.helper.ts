import type { MeasureModel } from "../models/measure.model";
import type { ApiMeasureImages } from "../types/measure.types";

export const sortMeasures = (a: MeasureModel, b: MeasureModel) => {
  const idA = Number(a.metadata["ID_AREA"]);
  const idB = Number(b.metadata["ID_AREA"]);

  if (isNaN(idA) && isNaN(idB)) return 0;
  if (isNaN(idA)) return 1;
  if (isNaN(idB)) return -1;

  if (idA !== idB) return idA - idB;

  const cmpPtoMedida = `${a.metadata["PTO_MEDIDA"]}`.localeCompare(
    `${b.metadata["PTO_MEDIDA"]}`
  );
  if (cmpPtoMedida !== 0) return cmpPtoMedida;

  return `${a.metadata["N_MEDIDA"]}`.localeCompare(`${b.metadata["N_MEDIDA"]}`);
};

export const sortMeasureImages = (a: ApiMeasureImages, b: ApiMeasureImages) => {
  const idA = Number(a.areaId);
  const idB = Number(b.areaId);

  if (isNaN(idA) && isNaN(idB)) return 0;
  if (isNaN(idA)) return 1;
  if (isNaN(idB)) return -1;

  if (idA !== idB) return idA - idB;

  const cmpPtoMedida = `${a.ptoMedida}`.localeCompare(`${b.ptoMedida}`);
  if (cmpPtoMedida !== 0) return cmpPtoMedida;

  return `${a.nMedida}`.localeCompare(`${b.nMedida}`);
};
