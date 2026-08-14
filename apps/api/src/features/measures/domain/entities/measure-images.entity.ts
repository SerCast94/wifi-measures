export class MeasureImagesEntity {
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

  constructor(partial: Partial<MeasureImagesEntity>) {
    Object.assign(this, partial);
  }

  static create(partial: Partial<MeasureImagesEntity>): MeasureImagesEntity {
    return new MeasureImagesEntity(partial);
  }
}
