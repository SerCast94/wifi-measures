export class ApiSubmissionEntity {
  constructor(
    public id: number,
    public formId: number,
    public instanceId: string,
    public createdAt: string,
    public updatedAt: null | string,
    public deletedAt: null | string,
    public submitterId: number,
    public draft: boolean,
    public reviewState: null | "rejected",
    public definition: DefinitionEntity
  ) {}
}

export class DefinitionEntity {
  constructor(
    public id: number,
    public submissionId: number,
    public xml: Record<string, unknown>,
    public formDefId: number,
    public submitterId: number,
    public createdAt: string,
    public current: boolean,
    public instanceName: string,
    public instanceId: string,
    public userAgent: string,
    public root: boolean,
    public attachments: AttachmentEntity[]
  ) {}
}

export class AttachmentEntity {
  constructor(
    public blobId: number,
    public name: string,
    public submissionDefId: number,
    public index: null,
    public isClientAudit: boolean
  ) {}
}
