import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";

export class MeasurePresenter {
  @ApiProperty({ type: "number", example: 1 })
  id?: string | number;
  @ApiProperty({ type: "number", example: 1 })
  idArea: number;
  @ApiProperty({ type: "number", example: 37.123 })
  lat: number | null;
  @ApiProperty({ type: "number", example: -5.987 })
  lon: number | null;
  @ApiProperty({ type: "string", example: "Area Geográfica" })
  areaGeogr: string;
  @ApiProperty({ type: "string", example: "Sevilla" })
  provincia: string;
  @ApiProperty({ type: "string", example: "Emisión X" })
  emisiones: string;
  @ApiProperty({ type: "string", example: "Punto 1" })
  ptoMedida: string;
  @ApiProperty({ type: "number", example: 1 })
  nMedida: number;
  @ApiProperty({ type: "string", example: "2025-09-04T12:00:00Z" })
  fechaHora: string;
  @ApiProperty({ type: "number", example: 180 })
  azimut: number;
  @ApiProperty({ type: "string", example: "Servicio 1" })
  c1Servici: string | null;
  @ApiProperty({ type: "number", example: 1 })
  c1: number | null;
  @ApiProperty({ type: "number", example: 500 })
  c1Mhz: number | null;
  @ApiProperty({ type: "number", example: -65 })
  nivelC1: number | null;
  @ApiProperty({ type: "number", example: 10 })
  cNC1: number | null;
  @ApiProperty({ type: "number", example: 0.0001 })
  cberC1: number | null;
  @ApiProperty({ type: "number", example: 0.00001 })
  vberC1: number | null;
  @ApiProperty({ type: "number", example: 32 })
  merC1: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC1: string | null;
  @ApiProperty({ type: "string", example: "Servicio 2" })
  c2Servici: string | null;
  @ApiProperty({ type: "number", example: 2 })
  c2: number | null;
  @ApiProperty({ type: "number", example: 501 })
  c2Mhz: number | null;
  @ApiProperty({ type: "number", example: -66 })
  nivelC2: number | null;
  @ApiProperty({ type: "number", example: 11 })
  cNC2: number | null;
  @ApiProperty({ type: "number", example: 0.0002 })
  cberC2: number | null;
  @ApiProperty({ type: "number", example: 0.00002 })
  vberC2: number | null;
  @ApiProperty({ type: "number", example: 33 })
  merC2: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC2: string | null;
  @ApiProperty({ type: "string", example: "Servicio 3" })
  c3Servici: string | null;
  @ApiProperty({ type: "number", example: 3 })
  c3: number | null;
  @ApiProperty({ type: "number", example: 502 })
  c3Mhz: number | null;
  @ApiProperty({ type: "number", example: -67 })
  nivelC3: number | null;
  @ApiProperty({ type: "number", example: 12 })
  cNC3: number | null;
  @ApiProperty({ type: "number", example: 0.0003 })
  cberC3: number | null;
  @ApiProperty({ type: "number", example: 0.00003 })
  vberC3: number | null;
  @ApiProperty({ type: "number", example: 34 })
  merC3: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC3: string | null;
  @ApiProperty({ type: "string", example: "Servicio 4" })
  c4Servici: string | null;
  @ApiProperty({ type: "number", example: 4 })
  c4: number | null;
  @ApiProperty({ type: "number", example: 503 })
  c4Mhz: number | null;
  @ApiProperty({ type: "number", example: -68 })
  nivelC4: number | null;
  @ApiProperty({ type: "number", example: 13 })
  cNC4: number | null;
  @ApiProperty({ type: "number", example: 0.0004 })
  cberC4: number | null;
  @ApiProperty({ type: "number", example: 0.00004 })
  vberC4: number | null;
  @ApiProperty({ type: "number", example: 35 })
  merC4: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC4: string | null;
  @ApiProperty({ type: "string", example: "Servicio 5" })
  c5Servici: string | null;
  @ApiProperty({ type: "number", example: 5 })
  c5: number | null;
  @ApiProperty({ type: "number", example: 504 })
  c5Mhz: number | null;
  @ApiProperty({ type: "number", example: -69 })
  nivelC5: number | null;
  @ApiProperty({ type: "number", example: 14 })
  cNC5: number | null;
  @ApiProperty({ type: "number", example: 0.0005 })
  cberC5: number | null;
  @ApiProperty({ type: "number", example: 0.00005 })
  vberC5: number | null;
  @ApiProperty({ type: "number", example: 36 })
  merC5: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC5: string | null;
  @ApiProperty({ type: "string", example: "Servicio 6" })
  c6Servici: string | null;
  @ApiProperty({ type: "number", example: 6 })
  c6: number | null;
  @ApiProperty({ type: "number", example: 505 })
  c6Mhz: number | null;
  @ApiProperty({ type: "number", example: -70 })
  nivelC6: number | null;
  @ApiProperty({ type: "number", example: 15 })
  cNC6: number | null;
  @ApiProperty({ type: "number", example: 0.0006 })
  cberC6: number | null;
  @ApiProperty({ type: "number", example: 0.00006 })
  vberC6: number | null;
  @ApiProperty({ type: "number", example: 37 })
  merC6: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC6: string | null;
  @ApiProperty({ type: "string", example: "Servicio 7" })
  c7Servici: string | null;
  @ApiProperty({ type: "number", example: 7 })
  c7: number | null;
  @ApiProperty({ type: "number", example: 506 })
  c7Mhz: number | null;
  @ApiProperty({ type: "number", example: -71 })
  nivelC7: number | null;
  @ApiProperty({ type: "number", example: 16 })
  cNC7: number | null;
  @ApiProperty({ type: "number", example: 0.0007 })
  cberC7: number | null;
  @ApiProperty({ type: "number", example: 0.00007 })
  vberC7: number | null;
  @ApiProperty({ type: "number", example: 38 })
  merC7: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC7: string | null;
  @ApiProperty({ type: "string", example: "Servicio 8" })
  c8Servici: string | null;
  @ApiProperty({ type: "number", example: 8 })
  c8: number | null;
  @ApiProperty({ type: "number", example: 507 })
  c8Mhz: number | null;
  @ApiProperty({ type: "number", example: -72 })
  nivelC8: number | null;
  @ApiProperty({ type: "number", example: 17 })
  cNC8: number | null;
  @ApiProperty({ type: "number", example: 0.0008 })
  cberC8: number | null;
  @ApiProperty({ type: "number", example: 0.00008 })
  vberC8: number | null;
  @ApiProperty({ type: "number", example: 39 })
  merC8: number | null;
  @ApiProperty({ type: "string", example: "OK" })
  okC8: string | null;
  @ApiProperty({ type: "string", example: "Monitorización" })
  monitorizacion: string | null;
  @ApiProperty({ type: "string", example: "Observaciones generales" })
  obsGenerales: string | null;
  @ApiProperty({ type: "string", example: "F123" })
  idFormulario: string | null;
  @ApiProperty({ type: "string", example: "Nombre" })
  name: string | null;
  @ApiProperty({ type: "string", example: "Firmante" })
  firNombre: string | null;
  @ApiProperty({ type: "string", example: "12345678A" })
  firDni: string | null;
  @ApiProperty({ type: "string", example: "2025-09-04T12:00:00Z" })
  createdAt: Date;
  @ApiProperty({ type: "string", example: "2025-09-04T12:00:00Z" })
  updatedAt: Date;
  @ApiPropertyOptional()
  raw?: any;

  constructor(measure: MeasureEntity) {
    this.id = measure.id;
    this.idArea = measure.idArea;
    this.lat = measure.lat;
    this.lon = measure.lon;
    this.areaGeogr = measure.areaGeogr;
    this.provincia = measure.provincia;
    this.emisiones = measure.emisiones;
    this.ptoMedida = measure.ptoMedida;
    this.nMedida = measure.nMedida;
    this.fechaHora = measure.fechaHora;
    this.azimut = measure.azimut;
    this.c1Servici = measure.c1Servici;
    this.c1 = measure.c1;
    this.c1Mhz = measure.c1Mhz;
    this.nivelC1 = measure.nivelC1;
    this.cNC1 = measure.cNC1;
    this.cberC1 = measure.cberC1;
    this.vberC1 = measure.vberC1;
    this.merC1 = measure.merC1;
    this.okC1 = measure.okC1;
    this.c2Servici = measure.c2Servici;
    this.c2 = measure.c2;
    this.c2Mhz = measure.c2Mhz;
    this.nivelC2 = measure.nivelC2;
    this.cNC2 = measure.cNC2;
    this.cberC2 = measure.cberC2;
    this.vberC2 = measure.vberC2;
    this.merC2 = measure.merC2;
    this.okC2 = measure.okC2;
    this.c3Servici = measure.c3Servici;
    this.c3 = measure.c3;
    this.c3Mhz = measure.c3Mhz;
    this.nivelC3 = measure.nivelC3;
    this.cNC3 = measure.cNC3;
    this.cberC3 = measure.cberC3;
    this.vberC3 = measure.vberC3;
    this.merC3 = measure.merC3;
    this.okC3 = measure.okC3;
    this.c4Servici = measure.c4Servici;
    this.c4 = measure.c4;
    this.c4Mhz = measure.c4Mhz;
    this.nivelC4 = measure.nivelC4;
    this.cNC4 = measure.cNC4;
    this.cberC4 = measure.cberC4;
    this.vberC4 = measure.vberC4;
    this.merC4 = measure.merC4;
    this.okC4 = measure.okC4;
    this.c5Servici = measure.c5Servici;
    this.c5 = measure.c5;
    this.c5Mhz = measure.c5Mhz;
    this.nivelC5 = measure.nivelC5;
    this.cNC5 = measure.cNC5;
    this.cberC5 = measure.cberC5;
    this.vberC5 = measure.vberC5;
    this.merC5 = measure.merC5;
    this.okC5 = measure.okC5;
    this.c6Servici = measure.c6Servici;
    this.c6 = measure.c6;
    this.c6Mhz = measure.c6Mhz;
    this.nivelC6 = measure.nivelC6;
    this.cNC6 = measure.cNC6;
    this.cberC6 = measure.cberC6;
    this.vberC6 = measure.vberC6;
    this.merC6 = measure.merC6;
    this.okC6 = measure.okC6;
    this.c7Servici = measure.c7Servici;
    this.c7 = measure.c7;
    this.c7Mhz = measure.c7Mhz;
    this.nivelC7 = measure.nivelC7;
    this.cNC7 = measure.cNC7;
    this.cberC7 = measure.cberC7;
    this.vberC7 = measure.vberC7;
    this.merC7 = measure.merC7;
    this.okC7 = measure.okC7;
    this.c8Servici = measure.c8Servici;
    this.c8 = measure.c8;
    this.c8Mhz = measure.c8Mhz;
    this.nivelC8 = measure.nivelC8;
    this.cNC8 = measure.cNC8;
    this.cberC8 = measure.cberC8;
    this.vberC8 = measure.vberC8;
    this.merC8 = measure.merC8;
    this.okC8 = measure.okC8;
    this.monitorizacion = measure.monitorizacion;
    this.obsGenerales = measure.obsGenerales;
    this.idFormulario = measure.idFormulario;
    this.name = measure.name;
    this.firNombre = measure.firNombre;
    this.firDni = measure.firDni;
    this.createdAt = measure.createdAt;
    this.updatedAt = measure.updatedAt;
    this.raw = measure.raw ?? null;
  }
}
