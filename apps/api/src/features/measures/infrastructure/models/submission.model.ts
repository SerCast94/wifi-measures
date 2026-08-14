export type ApiOdkResponseSuccess<T> = {
  data: T;
  status: string;
  message: string;
};

export type ApiOdkGetSubmissionsResponse = ApiOdkResponseSuccess<
  ApiSubmissionModel[]
>;
export type ApiOdkGetImageResponse = ApiOdkResponseSuccess<string>;
export type ApiOdkGetSubmissionResponse =
  ApiOdkResponseSuccess<ApiSubmissionModel>;

export interface ApiSubmissionModel {
  id: number;
  formId: number;
  instanceId: string;
  createdAt: string;
  updatedAt: null | string;
  deletedAt: null | string;
  submitterId: number;
  draft: boolean;
  reviewState: null | "rejected";
  definition: DefinitionModel;
}

export interface DefinitionModel {
  id: number;
  submissionId: number;
  xml: Record<string, unknown>;
  formDefId: number;
  submitterId: number;
  createdAt: string;
  current: boolean;
  instanceName: string;
  instanceId: string;
  userAgent: string;
  root: boolean;
  attachments: AttachmentModel[];
}

export interface AttachmentModel {
  blobId: number;
  name: string;
  submissionDefId: number;
  index: null;
  isClientAudit: boolean;
}
