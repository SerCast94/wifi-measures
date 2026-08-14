import { ApiProperty } from "@nestjs/swagger";

import { MeasureImagesEntity } from "@features/measures/domain/entities/measure-images.entity";

export class MeasureImagesPresenter {
  @ApiProperty({
    description: "ID del formulario de la medida",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  idFormulario: string;

  @ApiProperty({
    description: "ID del área de la medida",
    example: "area-001",
  })
  areaId: string;

  @ApiProperty({
    description: "Nombre del área de la medida",
    example: "Área de Prueba",
  })
  areaName: string;

  @ApiProperty({
    description: "Punto de medida",
    example: "Punto 1",
  })
  ptoMedida: string;

  @ApiProperty({
    description: "Número de medida",
    example: 1,
  })
  nMedida: number;

  @ApiProperty({
    description: "Nombre del archivo zip que contiene las imágenes",
    example: "area-001_images",
  })
  zipName: string;

  @ApiProperty({
    description: "Lista de imágenes asociadas a la medida",
    type: [Object],
  })
  images: {
    name: string;
    fileName: string;
    base64: string | null;
  }[];

  constructor(measureImages: MeasureImagesEntity) {
    Object.assign(this, measureImages);
  }
}
