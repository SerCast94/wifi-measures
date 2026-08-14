export class AreaImages {
  constructor(
    public idFormulario: string,
    public ptoMedida: string,
    public nMedida: number,
    public fotoAntena: string,
    public fotoAntenaBase64: string | null
  ) {}

  static fromRawData(data: any): AreaImages {
    return new AreaImages(
      data.idFormulario,
      data.ptoMedida,
      data.nMedida,
      data.fotoAntena,
      data.fotoAntenaBase64
    );
  }
}
