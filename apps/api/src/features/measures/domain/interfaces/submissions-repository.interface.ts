import { MeasureEntity } from "../entities/measure.entity";
import { MeasureImagesEntity } from "../entities/measure-images.entity";

export interface ISubmissionsRepository {
  getAll(): Promise<MeasureEntity[]>;
  getFotoAntenaByIdentifier(
    identifier: string,
    value: string
  ): Promise<{ idFormulario: string; fotoAntena: string | null }[]>;
  getImagesBySubmissionId(id: string): Promise<MeasureImagesEntity>;
  getImage(
    submissionId: string,
    imageId: string,
    height?: number
  ): Promise<string>;
}
