import { Injectable } from "@nestjs/common";

import { LinkLiveService } from "@core/linklive/linklive.service";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";
import { MeasureImagesEntity } from "@features/measures/domain/entities/measure-images.entity";
import { LinkLiveResultMapper } from "../models/mappers/linklive-result.mapper";
import { ISubmissionsRepository } from "@features/measures/domain/interfaces/submissions-repository.interface";

@Injectable()
export class LinkLiveSubmissionsRepository implements ISubmissionsRepository {
  constructor(private readonly linkLiveService: LinkLiveService) {}

  async getAll(): Promise<MeasureEntity[]> {
    const results = await this.linkLiveService.listResults();
    return results.map((result) =>
      LinkLiveResultMapper.fromResultToEntity(result)
    );
  }

  async getFotoAntenaByIdentifier(
    _identifier: string,
    _value: string
  ): Promise<{ idFormulario: string; fotoAntena: string | null }[]> {
    return [];
  }

  async getImagesBySubmissionId(_id: string): Promise<MeasureImagesEntity> {
    throw new Error("Images are not available for Link-Live measurements");
  }

  async getImage(
    _submissionId: string,
    _imageId: string,
    _height?: number
  ): Promise<string> {
    throw new Error("Images are not available for Link-Live measurements");
  }
}
