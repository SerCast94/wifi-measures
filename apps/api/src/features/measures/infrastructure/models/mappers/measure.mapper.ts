import {
  cleanResponseToChar,
  cleanResponseToNumber,
  toNumberOrNull,
} from "@core/utils/string.utils";
import { ApiSubmissionModel } from "../submission.model";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";

export class MeasureMapper {
  static fromApiSubmissionModelToEntity(
    submission: ApiSubmissionModel
  ): MeasureEntity {
    const xml = submission.definition.xml as Record<string, any>;
    const location = xml["DG"]["location"] as string; // "location": "37.14618687570918 -2.149708718061447 0.0 0.0",
    const [lat, lon] = location.split(" ").map(Number);
    const canal1 = xml["Canal1"] as Record<string, any>;
    const canal2 = xml["Canal2"] as Record<string, any>;
    const canal3 = xml["Canal3"] as Record<string, any>;
    const canal4 = xml["Canal4"] as Record<string, any>;
    const canal5 = xml["Canal5"] as Record<string, any>;
    const canal6 = xml["Canal6"] as Record<string, any>;
    const canal7 = xml["Canal7"] as Record<string, any>;
    const canal8 = xml["Canal8"] as Record<string, any>;
    const firma = xml["FIR"] as Record<string, any>;

    return MeasureEntity.create({
      idArea: +xml["DG"]["id"] as number,
      lat,
      lon,

      areaGeogr: xml["area"] as string,
      provincia: xml["DG"]["provincia"] as string,
      emisiones: xml["DG"]["emisiones"] as string,
      ptoMedida: xml["DG"]["pto_medida"] as string,
      nMedida: +xml["DG"]["n_medida"] as number,
      fechaHora: xml["DG"]["fecha"] as string,
      azimut: +xml["DG"]["azimut"] as number,

      // Canal 1
      c1Servici: canal1["c1_servici"] as string,
      c1: +canal1["c1"] as number,
      c1Mhz: +canal1["c1_mhz"] as number,
      okC1: cleanResponseToChar(canal1["ok_c1"]) as string,

      // Canal 2
      c2Servici: canal2["c2_servici"] as string,
      c2: +canal2["c2"] as number,
      c2Mhz: +canal2["c2_mhz"] as number,
      okC2: cleanResponseToChar(canal2["ok_c2"]) as string,

      // Canal 3
      c3Servici: canal3["c3_servici"] as string,
      c3: +canal3["c3"] as number,
      c3Mhz: +canal3["c3_mhz"] as number,
      okC3: cleanResponseToChar(canal3["ok_c3"]) as string,

      // Canal 4
      c4Servici: canal4["c4_servici"] as string,
      c4: +canal4["c4"] as number,
      c4Mhz: +canal4["c4_mhz"] as number,
      okC4: cleanResponseToChar(canal4["ok_c4"]) as string,

      // Canal 5
      c5Servici: canal5["c5_servici"] as string,
      c5: +canal5["c5"] as number,
      c5Mhz: +canal5["c5_mhz"] as number,
      okC5: cleanResponseToChar(canal5["ok_c5"]) as string,

      // Canal 6
      c6Servici: canal6["c6_servici"] as string,
      c6: +canal6["c6"] as number,
      c6Mhz: +canal6["c6_mhz"] as number,
      okC6: cleanResponseToChar(canal6["ok_c6"]) as string,

      // Canal 7
      c7Servici: canal7["c7_servici"] as string,
      c7: +canal7["c7"] as number,
      c7Mhz: +canal7["c7_mhz"] as number,
      okC7: cleanResponseToChar(canal7["ok_c7"]) as string,

      // Canal 8
      c8Servici: canal8["c8_servici"] as string,
      c8: +canal8["c8"] as number,
      c8Mhz: +canal8["c8_mhz"] as number,
      okC8: cleanResponseToChar(canal8["ok_c8"]) as string,

      obsGenerales: cleanResponseToChar(firma["obs_generales"]) as string,
      firNombre: cleanResponseToChar(firma["Nombre"]) as string,
      firDni: cleanResponseToChar(firma["DNI"]) as string,

      idFormulario: submission.instanceId,
      name: submission.definition.instanceName,
    });
  }

  // Note: database mapping for legacy TDT-backed models was removed.
  // Persisted measures are handled by the repository implementation.
}
