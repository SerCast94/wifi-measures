import {
  decimalToString,
  formatScientific,
  getAnswerValue,
} from "../lib/utils";
import { DNI_RESPONSIBLE, RESPONSIBLE_NAME } from "../constants/report";
import type { ApiMeasure, MeasureChannels } from "../types/measure.types";

export class MeasureModel {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  latLng: [number, number];
  datetime: Date;
  idFormulario: string;
  metadata: Record<string, number | string>;
  channels: MeasureChannels;
  observations?: string;
  technician?: string;
  dniTechnician?: string;
  responsible?: string;
  dniResponsible?: string;
  raw?: unknown;

  constructor(
    id: number,
    name: string,
    latitude: number,
    longitude: number,
    datetime: Date,
    idFormulario: string,
    metadata: Record<string, number | string>,
    channels: MeasureChannels,
    observations?: string,
    technician?: string,
    dniTechnician?: string,
    raw?: unknown
  ) {
    this.id = id;
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
    this.latLng = [this.latitude, this.longitude];
    this.datetime = datetime;
    this.idFormulario = idFormulario;
    this.metadata = { ...metadata };
    this.channels = channels;
    this.observations = observations;
    this.technician = technician;
    this.dniTechnician = dniTechnician;
    this.responsible = RESPONSIBLE_NAME;
    this.dniResponsible = DNI_RESPONSIBLE;
    this.raw = raw;
  }

  static fromApiMeasure(data: ApiMeasure): MeasureModel {
    return new MeasureModel(
      data.id,
      data.name,
      data.lat,
      data.lon,
      new Date(data.fechaHora),
      data.idFormulario,
      {
        ID_AREA: data.idArea,
        AREA_GEOGR: data.areaGeogr,
        PROVINCIA: data.provincia,
        EMISIONES: data.emisiones,
        PTO_MEDIDA: data.ptoMedida,
        N_MEDIDA: data.nMedida,
        AZIMUT: data.azimut,
      },
      {
        CHANNEL1: {
          service: data.c1Servici,
          channel: data.c1,
          mhz: data.c1Mhz,
          nivel: decimalToString(data.nivelC1),
          cn: decimalToString(data.cNC1, 1),
          cber: formatScientific(data.cberC1),
          vber: formatScientific(data.vberC1),
          mer: decimalToString(data.merC1, 1),
          ok: getAnswerValue(data.okC1),
        },
        CHANNEL2: {
          service: data.c2Servici,
          channel: data.c2,
          mhz: data.c2Mhz,
          nivel: decimalToString(data.nivelC2),
          cn: decimalToString(data.cNC2, 1),
          cber: formatScientific(data.cberC2),
          vber: formatScientific(data.vberC2),
          mer: decimalToString(data.merC2, 1),
          ok: getAnswerValue(data.okC2),
        },
        CHANNEL3: {
          service: data.c3Servici,
          channel: data.c3,
          mhz: data.c3Mhz,
          nivel: decimalToString(data.nivelC3),
          cn: decimalToString(data.cNC3, 1),
          cber: formatScientific(data.cberC3),
          vber: formatScientific(data.vberC3),
          mer: decimalToString(data.merC3, 1),
          ok: getAnswerValue(data.okC3),
        },
        CHANNEL4: {
          service: data.c4Servici,
          channel: data.c4,
          mhz: data.c4Mhz,
          nivel: decimalToString(data.nivelC4),
          cn: decimalToString(data.cNC4, 1),
          cber: formatScientific(data.cberC4),
          vber: formatScientific(data.vberC4),
          mer: decimalToString(data.merC4, 1),
          ok: getAnswerValue(data.okC4),
        },
        CHANNEL5: {
          service: data.c5Servici,
          channel: data.c5,
          mhz: data.c5Mhz,
          nivel: decimalToString(data.nivelC5),
          cn: decimalToString(data.cNC5, 1),
          cber: formatScientific(data.cberC5),
          vber: formatScientific(data.vberC5),
          mer: decimalToString(data.merC5, 1),
          ok: getAnswerValue(data.okC5),
        },
        CHANNEL6: {
          service: data.c6Servici,
          channel: data.c6,
          mhz: data.c6Mhz,
          nivel: decimalToString(data.nivelC6),
          cn: decimalToString(data.cNC6, 1),
          cber: formatScientific(data.cberC6),
          vber: formatScientific(data.vberC6),
          mer: decimalToString(data.merC6, 1),
          ok: getAnswerValue(data.okC6),
        },
        CHANNEL7: {
          service: data.c7Servici,
          channel: data.c7,
          mhz: data.c7Mhz,
          nivel: decimalToString(data.nivelC7),
          cn: decimalToString(data.cNC7, 1),
          cber: formatScientific(data.cberC7),
          vber: formatScientific(data.vberC7),
          mer: decimalToString(data.merC7, 1),
          ok: getAnswerValue(data.okC7),
        },
        CHANNEL8: {
          service: data.c8Servici,
          channel: data.c8,
          mhz: data.c8Mhz,
          nivel: decimalToString(data.nivelC8),
          cn: decimalToString(data.cNC8, 1),
          cber: formatScientific(data.cberC8),
          vber: formatScientific(data.vberC8),
          mer: decimalToString(data.merC8, 1),
          ok: getAnswerValue(data.okC8),
        },
      },
      data.obsGenerales,
      data.firNombre,
      data.firDni,
      data.raw
    );
  }

  getPopupData() {
    const filteredMetadata = Object.keys(this.metadata).reduce(
      (obj, key) => {
        obj[key] = this.metadata[key];
        return obj;
      },
      {} as Record<string, number | string>
    );

    return {
      id: this.id,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      metadata: filteredMetadata,
    };
  }
}
