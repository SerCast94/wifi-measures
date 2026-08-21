import type { User } from "@/features/auth/types/user.type";

export interface ApiMeasure {
  id: number;
  idArea: number;
  lat: number;
  lon: number;
  areaGeogr: string;
  provincia: string;
  emisiones: string;
  ptoMedida: string;
  nMedida: number;
  fechaHora: Date;
  azimut: number;
  c1Servici: string;
  c1: number;
  c1Mhz: number;
  nivelC1: number;
  cNC1: number;
  cberC1: number;
  vberC1: number;
  merC1: number;
  okC1: string;
  c2Servici: string;
  c2: number;
  c2Mhz: number;
  nivelC2: number;
  cNC2: number;
  cberC2: number;
  vberC2: number;
  merC2: number;
  okC2: string;
  c3Servici: string;
  c3: number;
  c3Mhz: number;
  nivelC3: number;
  cNC3: number;
  cberC3: number;
  vberC3: number;
  merC3: number;
  okC3: string;
  c4Servici: string;
  c4: number;
  c4Mhz: number;
  nivelC4: number;
  cNC4: number;
  cberC4: number;
  vberC4: number;
  merC4: number;
  okC4: string;
  c5Servici: string;
  c5: number;
  c5Mhz: number;
  nivelC5: number;
  cNC5: number;
  cberC5: number;
  vberC5: number;
  merC5: number;
  okC5: string;
  c6Servici: string;
  c6: number;
  c6Mhz: number;
  nivelC6: number;
  cNC6: number;
  cberC6: number;
  vberC6: number;
  merC6: number;
  okC6: string;
  c7Servici: string;
  c7: number;
  c7Mhz: number;
  nivelC7: number;
  cNC7: number;
  cberC7: number;
  vberC7: number;
  merC7: number;
  okC7: string;
  c8Servici: string;
  c8: number;
  c8Mhz: number;
  nivelC8: number;
  cNC8: number;
  cberC8: number;
  vberC8: number;
  merC8: number;
  okC8: string;
  monitorizacion: string;
  obsGenerales: string;
  idFormulario: string;
  name: string;
  firNombre: string;
  firDni: string;
  raw?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface LastUpdateInfo {
  user: User | null;
  date: Date;
  email: string;
}

export interface Channel {
  service: string;
  channel: number;
  mhz: number;
  nivel: string;
  cn: string;
  cber: string;
  vber: string;
  mer: string;
  ok: string;
}

export interface MeasureChannels {
  CHANNEL1: Channel;
  CHANNEL2: Channel;
  CHANNEL3: Channel;
  CHANNEL4: Channel;
  CHANNEL5: Channel;
  CHANNEL6: Channel;
  CHANNEL7: Channel;
  CHANNEL8: Channel;
}

export interface ApiMeasureImages {
  idFormulario: string;
  areaId: string;
  areaName: string;
  ptoMedida: string;
  nMedida: number;
  zipName: string;
  images: {
    name: string;
    fileName: string;
    base64: string | null;
  }[];
}
