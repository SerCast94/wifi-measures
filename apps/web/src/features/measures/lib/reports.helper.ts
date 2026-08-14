import JSZip from "jszip";
import PizZip from "pizzip";
import imageSize from "image-size";
import Docxtemplater from "docxtemplater";
import type { QueryClient } from "@tanstack/react-query";
import ImageModule from "docxtemplater-image-module-free";

import type {
  Area,
  AreaAnthemImage,
  AreaReportData,
} from "../types/areas.types";
import { QUERY_KEYS } from "@/config/constants";
import { base64ToArrayBuffer } from "@/core/lib/imageUtils";
import { getAreaFotoAntena } from "../api/get-area-foto-antena";

const imageDefaultSizes: { [key: string]: [number, number] } = {
  firma_tecnico: [200, 120],
  firma_ail: [200, 120],
};

const imageOpts = {
  centered: false,
  getImage: (tagValue: string) => base64ToArrayBuffer(tagValue),
  getSize: (img: ArrayBuffer, _tagValue: string, tagName: string) => {
    if (imageDefaultSizes[tagName]) {
      return imageDefaultSizes[tagName];
    }

    const dimensions = imageSize(new Uint8Array(img));

    if (dimensions) {
      return [dimensions.width, dimensions.height];
    }

    return [300, 200];
  },
};

export const createAreaMedidasReport = async (
  area: Area,
  images: AreaAnthemImage[]
) => {
  // Cargar la plantilla Word desde public/
  const response = await fetch(`/assets/templates/medidas.docx`);
  const arrayBuffer = await response.arrayBuffer();

  // Cargar el archivo en PizZip con el módulo de imágenes
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    modules: [new ImageModule(imageOpts)],
  });

  const docData = getAreaReportData(area, images);

  doc.render(docData);

  return doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const createAreaMonitorReport = async (
  area: Area,
  images: AreaAnthemImage[]
) => {
  // Cargar la plantilla Word desde public/
  const response = await fetch(`/assets/templates/monitorizacion.docx`);
  const arrayBuffer = await response.arrayBuffer();

  // Cargar el archivo en PizZip con el módulo de imágenes
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    modules: [new ImageModule(imageOpts)],
  });

  const docData = getAreaReportData(area, images);

  doc.render(docData);

  return doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

export const getQueryAreaFotoAntena = async (
  areaId: string,
  queryClient: QueryClient,
  original: boolean = false
) => {
  const baseQueryKey = [QUERY_KEYS.areas, areaId, "fotoAntena"];

  const queryKey = original ? [...baseQueryKey, "original"] : baseQueryKey;
  const images = await queryClient.fetchQuery({
    queryKey,
    queryFn: () => getAreaFotoAntena(areaId),
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  return images;
};

export const generateReportsZip = async (
  reports: {
    id: string;
    name: string;
    blob: Blob;
  }[]
) => {
  const zip = new JSZip();
  // Agregar cada blob al ZIP como un archivo .docx
  reports.forEach(({ blob, name }) => {
    // Comprobar que el blob existe y no está vacío
    if (!blob) return;

    // Comprobar que el nombre del archivo no ha sido utilizado antes
    if (zip.files[`${name}.docx`]) {
      let i = 1;
      while (zip.files[`${name}_${i}.docx`]) {
        i++;
      }
      name = `${name}_${i}`;
    }

    // Agregar el archivo al ZIP
    zip.file(`${name}.docx`, blob);
  });

  // Generar el archivo ZIP
  return zip.generateAsync({ type: "blob" });
};

export const getAreaReportData = (
  area: Area,
  images: AreaAnthemImage[]
): AreaReportData => {
  return {
    id_area: `${area.id}`,
    area_geogr: area.name,
    nombre_tecnico: area.measures[0].technician || "",
    dni_tecnico: area.measures[0].dniTechnician || "",
    nombre_responsable: area.measures[0].responsible || "",
    dni_responsable: area.measures[0].dniResponsible || "",
    medidas: [
      ...area.measures
        .map((measure) => ({
          pto_medida: `P${measure.metadata.PTO_MEDIDA || ""}`,
          fecha_hora: new Date(measure.datetime).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          lat_lon: `${measure.latitude}, ${measure.longitude}`,
          obs_generales: measure.observations || "",
          n_medida: `M${measure.metadata.N_MEDIDA || ""}`,
          azimut: `${measure.metadata.AZIMUT || ""}`,
          foto_antena: images.find(
            (img) => img.idFormulario === measure.idFormulario
          )?.fotoAntenaBase64,

          // Canal 1
          c1_servici: `${measure.channels?.CHANNEL1?.service || ""}`,
          c1: `${measure.channels?.CHANNEL1?.channel || ""}`,
          c1_mhz: `${measure.channels?.CHANNEL1?.mhz || ""}`,
          nivel_c1: measure.channels?.CHANNEL1?.nivel,
          c_n_c1: measure.channels?.CHANNEL1?.cn,
          cber_c1: measure.channels?.CHANNEL1?.cber,
          vber_c1: measure.channels?.CHANNEL1?.vber,
          mer_c1: measure.channels?.CHANNEL1?.mer,
          ok_c1: measure.channels?.CHANNEL1?.ok,

          // Canal 2
          c2_servici: `${measure.channels?.CHANNEL2?.service || ""}`,
          c2: `${measure.channels?.CHANNEL2?.channel || ""}`,
          c2_mhz: `${measure.channels?.CHANNEL2?.mhz || ""}`,
          nivel_c2: measure.channels?.CHANNEL2?.nivel,
          c_n_c2: measure.channels?.CHANNEL2?.cn,
          cber_c2: measure.channels?.CHANNEL2?.cber,
          vber_c2: measure.channels?.CHANNEL2?.vber,
          mer_c2: measure.channels?.CHANNEL2?.mer,
          ok_c2: measure.channels?.CHANNEL2?.ok,

          // Canal 3
          c3_servici: `${measure.channels?.CHANNEL3?.service || ""}`,
          c3: `${measure.channels?.CHANNEL3?.channel || ""}`,
          c3_mhz: `${measure.channels?.CHANNEL3?.mhz || ""}`,
          nivel_c3: measure.channels?.CHANNEL3?.nivel,
          c_n_c3: measure.channels?.CHANNEL3?.cn,
          cber_c3: measure.channels?.CHANNEL3?.cber,
          vber_c3: measure.channels?.CHANNEL3?.vber,
          mer_c3: measure.channels?.CHANNEL3?.mer,
          ok_c3: measure.channels?.CHANNEL3?.ok,

          // Canal 4
          c4_servici: `${measure.channels?.CHANNEL4?.service || ""}`,
          c4: `${measure.channels?.CHANNEL4?.channel || ""}`,
          c4_mhz: `${measure.channels?.CHANNEL4?.mhz || ""}`,
          nivel_c4: measure.channels?.CHANNEL4?.nivel,
          c_n_c4: measure.channels?.CHANNEL4?.cn,
          cber_c4: measure.channels?.CHANNEL4?.cber,
          vber_c4: measure.channels?.CHANNEL4?.vber,
          mer_c4: measure.channels?.CHANNEL4?.mer,
          ok_c4: measure.channels?.CHANNEL4?.ok,

          // Canal 5
          c5_servici: `${measure.channels?.CHANNEL5?.service || ""}`,
          c5: `${measure.channels?.CHANNEL5?.channel || ""}`,
          c5_mhz: `${measure.channels?.CHANNEL5?.mhz || ""}`,
          nivel_c5: measure.channels?.CHANNEL5?.nivel,
          c_n_c5: measure.channels?.CHANNEL5?.cn,
          cber_c5: measure.channels?.CHANNEL5?.cber,
          vber_c5: measure.channels?.CHANNEL5?.vber,
          mer_c5: measure.channels?.CHANNEL5?.mer,
          ok_c5: measure.channels?.CHANNEL5?.ok,

          // Canal 6
          c6_servici: `${measure.channels?.CHANNEL6?.service || ""}`,
          c6: `${measure.channels?.CHANNEL6?.channel || ""}`,
          c6_mhz: `${measure.channels?.CHANNEL6?.mhz || ""}`,
          nivel_c6: measure.channels?.CHANNEL6?.nivel,
          c_n_c6: measure.channels?.CHANNEL6?.cn,
          cber_c6: measure.channels?.CHANNEL6?.cber,
          vber_c6: measure.channels?.CHANNEL6?.vber,
          mer_c6: measure.channels?.CHANNEL6?.mer,
          ok_c6: measure.channels?.CHANNEL6?.ok,

          // Canal 7
          c7_servici: `${measure.channels?.CHANNEL7?.service || ""}`,
          c7: `${measure.channels?.CHANNEL7?.channel || ""}`,
          c7_mhz: `${measure.channels?.CHANNEL7?.mhz || ""}`,
          nivel_c7: measure.channels?.CHANNEL7?.nivel,
          c_n_c7: measure.channels?.CHANNEL7?.cn,
          cber_c7: measure.channels?.CHANNEL7?.cber,
          vber_c7: measure.channels?.CHANNEL7?.vber,
          mer_c7: measure.channels?.CHANNEL7?.mer,
          ok_c7: measure.channels?.CHANNEL7?.ok,

          // Canal 8
          c8_servici: `${measure.channels?.CHANNEL8?.service || ""}`,
          c8: `${measure.channels?.CHANNEL8?.channel || ""}`,
          c8_mhz: `${measure.channels?.CHANNEL8?.mhz || ""}`,
          nivel_c8: measure.channels?.CHANNEL8?.nivel,
          c_n_c8: measure.channels?.CHANNEL8?.cn,
          cber_c8: measure.channels?.CHANNEL8?.cber,
          vber_c8: measure.channels?.CHANNEL8?.vber,
          mer_c8: measure.channels?.CHANNEL8?.mer,
          ok_c8: measure.channels?.CHANNEL8?.ok,
        }))
        .sort((a, b) => {
          const cmpPtoMedida = a.pto_medida.localeCompare(b.pto_medida);
          if (cmpPtoMedida !== 0) return cmpPtoMedida;

          return a.n_medida.localeCompare(b.n_medida);
        }),
    ],
  };
};
