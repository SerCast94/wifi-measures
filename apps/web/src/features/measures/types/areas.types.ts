import type { MeasureModel } from "../models/measure.model";

export interface Area {
  id: number;
  name: string;
  provincia: string;
  measures: MeasureModel[];
}

export interface AreaReportData {
  id_area: string;
  area_geogr: string;
  nombre_tecnico: string;
  dni_tecnico: string;
  nombre_responsable: string;
  dni_responsable: string;
  medidas: MedidasReportData[];
}

export interface AreaAnthemImage {
  idFormulario: string;
  ptoMedida: string;
  nMedida: number;
  fotoAntena: string;
  fotoAntenaBase64: string;
}

export interface MedidasReportData {
  pto_medida: string;
  fecha_hora: string;
  lat_lon: string;
  obs_generales: string;
  n_medida: string;
  azimut: string;
  // Canal 1
  c1_servici: string;
  c1: string;
  c1_mhz: string;
  nivel_c1: string;
  c_n_c1: string;
  cber_c1: string;
  vber_c1: string;
  mer_c1: string;
  ok_c1: string;

  // Canal 2
  c2_servici: string;
  c2: string;
  c2_mhz: string;
  nivel_c2: string;
  c_n_c2: string;
  cber_c2: string;
  vber_c2: string;
  mer_c2: string;
  ok_c2: string;

  // Canal 3
  c3_servici: string;
  c3: string;
  c3_mhz: string;
  nivel_c3: string;
  c_n_c3: string;
  cber_c3: string;
  vber_c3: string;
  mer_c3: string;
  ok_c3: string;

  // Canal 4
  c4_servici: string;
  c4: string;
  c4_mhz: string;
  nivel_c4: string;
  c_n_c4: string;
  cber_c4: string;
  vber_c4: string;
  mer_c4: string;
  ok_c4: string;

  // Canal 5
  c5_servici: string;
  c5: string;
  c5_mhz: string;
  nivel_c5: string;
  c_n_c5: string;
  cber_c5: string;
  vber_c5: string;
  mer_c5: string;
  ok_c5: string;

  // Canal 6
  c6_servici: string;
  c6: string;
  c6_mhz: string;
  nivel_c6: string;
  c_n_c6: string;
  cber_c6: string;
  vber_c6: string;
  mer_c6: string;
  ok_c6: string;

  // Canal 7
  c7_servici: string;
  c7: string;
  c7_mhz: string;
  nivel_c7: string;
  c_n_c7: string;
  cber_c7: string;
  vber_c7: string;
  mer_c7: string;
  ok_c7: string;

  // Canal 8
  c8_servici: string;
  c8: string;
  c8_mhz: string;
  nivel_c8: string;
  c_n_c8: string;
  cber_c8: string;
  vber_c8: string;
  mer_c8: string;
  ok_c8: string;
}
