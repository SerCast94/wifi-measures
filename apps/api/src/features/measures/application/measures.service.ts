import { Inject, Injectable } from "@nestjs/common";

import {
  MEASURES_REPOSITORY_TOKEN,
  SUBMISSIONS_REPOSITORY_TOKEN,
} from "../domain/config/tokens";
import { AppConfigService } from "@config/app-config.service";
import { MeasureEntity } from "../domain/entities/measure.entity";
import { AreaImages } from "../domain/entities/area-images.entity";
import { MeasureImagesEntity } from "../domain/entities/measure-images.entity";
import { IMeasuresRepository } from "../domain/interfaces/measures-repository.interface";
import { ISubmissionsRepository } from "../domain/interfaces/submissions-repository.interface";

@Injectable()
export class MeasuresService {
  constructor(
    @Inject(MEASURES_REPOSITORY_TOKEN)
    private readonly measuresRepository: IMeasuresRepository,
    @Inject(SUBMISSIONS_REPOSITORY_TOKEN)
    private readonly submissionsRepository: ISubmissionsRepository,
    private readonly config: AppConfigService
  ) {}

  async getAll(): Promise<MeasureEntity[]> {
    try {
      return this.measuresRepository.getAll();
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting measures, please try again later");
    }
  }

  async getSubmissions(): Promise<MeasureEntity[]> {
    try {
      return this.submissionsRepository.getAll();
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting submissions, please try again later");
    }
  }

  async syncMeasuresFromSubmissions(): Promise<MeasureEntity[]> {
    try {
      // Obtener nuevos envíos
      const submissions = await this.submissionsRepository.getAll();
      const measureSubmissionsIds =
        await this.measuresRepository.getSubmissionsIds();
      const newSubmissions = submissions.filter(
        (s) => !measureSubmissionsIds.includes(s.idFormulario as string)
      );

      // Crear las nuevas medidas en la base de datos
      const measuresCreated = [];
      for (const submission of newSubmissions) {
        const measure = await this.measuresRepository.create(submission);
        if (measure) measuresCreated.push(measure);
      }

      // Devolver las nuevas medidas
      return measuresCreated;
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error syncing submissions, please try again later");
    }
  }

  async getImages(
    id: string,
    original?: boolean
  ): Promise<MeasureImagesEntity> {
    try {
      // Se obtiene idFormulario
      const measure = await this.measuresRepository.getById(id);
      if (!measure) {
        throw new Error("Measure not found");
      }

      const idFormulario = measure.idFormulario;
      if (!idFormulario) {
        throw new Error("Measure has no associated submission");
      }

      // Se obtienen las imágenes de la entidad Submission
      const submissionImages =
        await this.submissionsRepository.getImagesBySubmissionId(idFormulario);
      if (!submissionImages) {
        throw new Error("Submission not found");
      }

      // Se obtiene las imágenes en base64
      for (const image of submissionImages.images) {
        if (image.fileName) {
          const imageBase64 = await this.submissionsRepository.getImage(
            idFormulario,
            image.fileName,
            original ? undefined : 370
          );
          image.base64 = imageBase64;
        }
      }

      return submissionImages;
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting measure images, please try again later");
    }
  }

  async getAreaAnthemsImages(areaId: string): Promise<AreaImages[]> {
    try {
      // Se obtienen las medidas asociados del área de la BBDD
      const measuresByArea = await this.measuresRepository.getByIdArea(+areaId);

      if (!measuresByArea || measuresByArea.length === 0) {
        throw new Error("No measures found for the given area");
      }

      const measuresByAreaResume = measuresByArea.map((measure) => {
        return {
          idFormulario: measure.idFormulario,
          ptoMedida: measure.ptoMedida,
          nMedida: measure.nMedida,
        };
      });

      // Se obtienen para cada medida la foto de antena
      const submissionsByArea =
        await this.submissionsRepository.getFotoAntenaByIdentifier(
          "DG/id",
          areaId
        );

      if (!submissionsByArea || submissionsByArea.length === 0) {
        throw new Error("No submissions found for the given area");
      }

      // Se cruzan ambos arrays para obtener las imágenes de las medidas del área
      const measuresWithImages = measuresByAreaResume.map((measure) => {
        const matchingSubmission = submissionsByArea.find(
          (submission) => submission.idFormulario === measure.idFormulario
        );

        return AreaImages.fromRawData({
          idFormulario: measure.idFormulario,
          ptoMedida: measure.ptoMedida,
          nMedida: measure.nMedida,
          fotoAntena: matchingSubmission ? matchingSubmission.fotoAntena : null,
          fotoAntenaBase64: "",
        });
      });

      // Para cada imagen, hacer llamada para obtener la imagen en base64
      for (const measure of measuresWithImages) {
        if (measure.fotoAntena) {
          const imageBase64 = await this.submissionsRepository.getImage(
            measure.idFormulario as string,
            measure.fotoAntena,
            370
          );
          measure.fotoAntenaBase64 = imageBase64;
        }
      }

      return measuresWithImages; // Devolver array de imágenes en base64
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error(
        "Error getting area anthems images, please try again later"
      );
    }
  }

  async getAreaImages(
    areaId: string,
    original?: boolean
  ): Promise<MeasureImagesEntity[]> {
    try {
      // Se obtienen las medidas asociados del área de la BBDD
      const measuresByArea = await this.measuresRepository.getByIdArea(+areaId);

      if (!measuresByArea || measuresByArea.length === 0) {
        throw new Error("No measures found for the given area");
      }

      const measuresByAreaResume = measuresByArea.map((measure) => {
        return {
          idFormulario: measure.idFormulario,
          ptoMedida: measure.ptoMedida,
          nMedida: measure.nMedida,
        };
      });

      // Se obtienen las imágenes de la entidad Submission
      const submissionImages = await Promise.all(
        measuresByAreaResume.map(async (measure) => {
          const images =
            await this.submissionsRepository.getImagesBySubmissionId(
              measure.idFormulario!
            );
          return images;
        })
      );

      if (!submissionImages || submissionImages.length === 0) {
        throw new Error("Submission not found");
      }

      for (const submissionImage of submissionImages) {
        for (const image of submissionImage.images) {
          if (image.fileName) {
            const imageBase64 = await this.submissionsRepository.getImage(
              submissionImage.idFormulario as string,
              image.fileName,
              original ? undefined : 370
            );
            image.base64 = imageBase64;
          }
        }
      }

      return submissionImages;
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting measure images, please try again later");
    }
  }
}
