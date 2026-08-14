import { AreaImages } from "@features/measures/domain/entities/area-images.entity";
import { ApiProperty } from "@nestjs/swagger";

export class AreaImagesPresenter {
  @ApiProperty({ description: "ID del formulario asociado a la medida" })
  idFormulario: string;

  @ApiProperty({ description: "Punto de medida" })
  ptoMedida: string;

  @ApiProperty({ description: "Número de medida" })
  nMedida: number;

  @ApiProperty({
    description: "Nombre de fichero de la imagen de la antena",
  })
  fotoAntena: string;

  @ApiProperty({
    description: "Imagen de la antena en formato base64",
    nullable: true,
  })
  fotoAntenaBase64: string | null;

  constructor(areaImage: AreaImages) {
    this.idFormulario = areaImage.idFormulario;
    this.ptoMedida = areaImage.ptoMedida;
    this.nMedida = areaImage.nMedida;
    this.fotoAntena = areaImage.fotoAntena;
    this.fotoAntenaBase64 = areaImage.fotoAntenaBase64;
  }
}
