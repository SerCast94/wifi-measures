import { Injectable } from "@nestjs/common";

import { AxiosInstance } from "axios";

import {
  ApiOdkGetImageResponse,
  ApiOdkGetSubmissionResponse,
  ApiOdkGetSubmissionsResponse,
} from "../models/submission.model";
import { OdkService } from "@core/odk/odk.service";
import { AppConfigService } from "@config/app-config.service";
import { MeasureMapper } from "../models/mappers/measure.mapper";
import { ApiSubmissionMapper } from "../models/mappers/submission.mapper";
import { MeasureImagesMapper } from "../models/mappers/measure-images.mapper";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";
import { MeasureImagesEntity } from "@features/measures/domain/entities/measure-images.entity";
import { ISubmissionsRepository } from "@features/measures/domain/interfaces/submissions-repository.interface";

const VERSION = "v1";

@Injectable()
export class OdkSubmissionsRepository implements ISubmissionsRepository {
  private readonly http: AxiosInstance;
  private readonly config: AppConfigService;

  constructor(
    private readonly odkService: OdkService,
    private readonly configService: AppConfigService
  ) {
    this.http = this.odkService.getInstance();
    this.config = this.configService;
  }

  async getAll(): Promise<MeasureEntity[]> {
    try {
      const projectId = this.config.get("odkProjectId");
      const formId = this.config.get("odkFormId");
      const submissionsResponse =
        await this.http.get<ApiOdkGetSubmissionsResponse>(
          `${VERSION}/projects/forms/submissions`,
          {
            params: {
              project: projectId,
              form: formId,
              all: 1,
            },
          }
        );

      const submissions = submissionsResponse.data.data;
      const submissionEntities = submissions
        .map((submission) =>
          ApiSubmissionMapper.fromOdkModelToEntity(submission)
        )
        .filter((submission) => submission.draft === false);

      return submissionEntities.map((submission) =>
        MeasureMapper.fromApiSubmissionModelToEntity(submission)
      );
    } catch (error) {
      // TODO: Handle error
      throw new Error(error.message);
    }
  }

  async getFotoAntenaByIdentifier(
    identifier: string,
    value: string
  ): Promise<{ idFormulario: string; fotoAntena: string | null }[]> {
    try {
      const projectId = this.config.get("odkProjectId");
      const formId = this.config.get("odkFormId");

      const submissionsResponse =
        await this.http.get<ApiOdkGetSubmissionsResponse>(
          `${VERSION}/projects/forms/submissions`,
          {
            params: {
              project: projectId,
              form: formId,
              identifier,
              value,
              dateField: "today",
              dateStart: "2000-01-01",
              dateEnd: "2200-01-01",
            },
          }
        );
      const submissions = submissionsResponse.data.data;
      const submissionEntities = submissions
        .map((submission) =>
          ApiSubmissionMapper.fromOdkModelToEntity(submission)
        )
        .filter((submission) => submission.draft === false);
      return submissionEntities.map((submission) => {
        const xml = submission.definition.xml as Record<string, any>;

        return {
          idFormulario: submission.instanceId,
          fotoAntena: xml["DG"] ? (xml["DG"]["foto_antena"] as string) : null,
        };
      });
    } catch (error) {
      // TODO: Handle error
      throw new Error(error.message);
    }
  }

  async getImagesBySubmissionId(id: string): Promise<MeasureImagesEntity> {
    try {
      const projectId = this.config.get("odkProjectId");
      const formId = this.config.get("odkFormId");
      const submissionsResponse =
        await this.http.get<ApiOdkGetSubmissionResponse>(
          `${VERSION}/projects/${projectId}/forms/${formId}/submissions/${id}`
        );

      const submissions = submissionsResponse.data.data;
      const submissionEntity =
        ApiSubmissionMapper.fromOdkModelToEntity(submissions);

      return MeasureImagesMapper.fromOdkSubmission(submissionEntity);
    } catch (error) {
      // TODO: Handle error
      throw new Error(error.message);
    }
  }

  async getImage(
    submissionId: string,
    imageId: string,
    height?: number
  ): Promise<string> {
    try {
      const params: {
        submission: string;
        attachment: string;
        base64: number;
        height?: number;
      } = {
        submission: submissionId,
        attachment: imageId,
        base64: 1,
      };
      if (height) {
        params["height"] = height;
      }
      const image = await this.http.get<ApiOdkGetImageResponse>(
        `${VERSION}/submission/attachment`,
        { params }
      );

      const imageString = image.data.data;

      return `data:image/jpeg;base64,${imageString}`;
    } catch (error) {
      // TODO: Handle error
      throw new Error(error.message);
    }
  }
}
