import { ApiSubmissionEntity } from "@features/measures/domain/entities/submission.entity";
import { MeasureImagesEntity } from "@features/measures/domain/entities/measure-images.entity";

export class MeasureImagesMapper {
  static fromOdkSubmission(data: ApiSubmissionEntity): MeasureImagesEntity {
    const xml = data.definition.xml as Record<string, any>;
    const fotoAntena = xml["DG"]["foto_antena"] as string;
    const ptoMedida = xml["DG"]["pto_medida"] as string;
    const nMedida = Number(xml["DG"]["n_medida"] as number);
    const imagesCanal1 = xml["ic1"] || [];
    const imgCanal1 = Array.isArray(imagesCanal1)
      ? imagesCanal1
      : Array.isArray(imagesCanal1["foto_c1"]) &&
          imagesCanal1["foto_c1"].length === 0
        ? []
        : [imagesCanal1];
    const imagesCanal2 = xml["ic2"] || [];
    const imgCanal2 = Array.isArray(imagesCanal2)
      ? imagesCanal2
      : Array.isArray(imagesCanal2["foto_c2"]) &&
          imagesCanal2["foto_c2"].length === 0
        ? []
        : [imagesCanal2];
    const imagesCanal3 = xml["ic3"] || [];
    const imgCanal3 = Array.isArray(imagesCanal3)
      ? imagesCanal3
      : Array.isArray(imagesCanal3["foto_c3"]) &&
          imagesCanal3["foto_c3"].length === 0
        ? []
        : [imagesCanal3];
    const imagesCanal4 = xml["ic4"] || [];
    const imgCanal4 = Array.isArray(imagesCanal4)
      ? imagesCanal4
      : Array.isArray(imagesCanal4["foto_c4"]) &&
          imagesCanal4["foto_c4"].length === 0
        ? []
        : [imagesCanal4];
    const imagesCanal5 = xml["ic5"] || [];
    const imgCanal5 = Array.isArray(imagesCanal5)
      ? imagesCanal5
      : Array.isArray(imagesCanal5["foto_c5"]) &&
          imagesCanal5["foto_c5"].length === 0
        ? []
        : [imagesCanal5];
    const imagesCanal6 = xml["ic6"] || [];
    const imgCanal6 = Array.isArray(imagesCanal6)
      ? imagesCanal6
      : Array.isArray(imagesCanal6["foto_c6"]) &&
          imagesCanal6["foto_c6"].length === 0
        ? []
        : [imagesCanal6];
    const imagesCanal7 = xml["ic7"] || [];
    const imgCanal7 = Array.isArray(imagesCanal7)
      ? imagesCanal7
      : Array.isArray(imagesCanal7["foto_c7"]) &&
          imagesCanal7["foto_c7"].length === 0
        ? []
        : [imagesCanal7];
    const imagesCanal8 = xml["ic8"] || [];
    const imgCanal8 = Array.isArray(imagesCanal8)
      ? imagesCanal8
      : Array.isArray(imagesCanal8["foto_c8"]) &&
          imagesCanal8["foto_c8"].length === 0
        ? []
        : [imagesCanal8];
    const firma = xml["FIR"]["Firma"] as string;
    const firmaArr =
      (Array.isArray(firma) && firma.length === 0) || !firma
        ? []
        : [
            {
              name: "firma",
              fileName: firma,
              base64: null,
            },
          ];

    return new MeasureImagesEntity({
      idFormulario: data.instanceId,
      areaId: xml["DG"]["id"] as string,
      areaName: xml["area"] as string,
      ptoMedida,
      nMedida,
      zipName: `${xml["DG"]["id"]}_${xml["area"]}_P${ptoMedida}M${nMedida}`,
      images: [
        { name: "fotoAntena", fileName: fotoAntena, base64: null },
        ...firmaArr,
        ...imgCanal1.map((img, index) => ({
          name: "foto_c1_" + (index + 1),
          fileName: img["foto_c1"] || null,
          base64: null,
        })),
        ...imgCanal2.map((img, index) => ({
          name: "foto_c2_" + (index + 1),
          fileName: img["foto_c2"] || null,
          base64: null,
        })),
        ...imgCanal3.map((img, index) => ({
          name: "foto_c3_" + (index + 1),
          fileName: img["foto_c3"] || null,
          base64: null,
        })),
        ...imgCanal4.map((img, index) => ({
          name: "foto_c4_" + (index + 1),
          fileName: img["foto_c4"] || null,
          base64: null,
        })),
        ...imgCanal5.map((img, index) => ({
          name: "foto_c5_" + (index + 1),
          fileName: img["foto_c5"] || null,
          base64: null,
        })),
        ...imgCanal6.map((img, index) => ({
          name: "foto_c6_" + (index + 1),
          fileName: img["foto_c6"] || null,
          base64: null,
        })),
        ...imgCanal7.map((img, index) => ({
          name: "foto_c7_" + (index + 1),
          fileName: img["foto_c7"] || null,
          base64: null,
        })),
        ...imgCanal8.map((img, index) => ({
          name: "foto_c8_" + (index + 1),
          fileName: img["foto_c8"] || null,
          base64: null,
        })),
      ],
    });
  }
}
