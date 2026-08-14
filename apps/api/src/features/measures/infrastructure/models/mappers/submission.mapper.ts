import {
  ApiSubmissionModel,
  AttachmentModel,
  DefinitionModel,
} from "../submission.model";
import {
  ApiSubmissionEntity,
  AttachmentEntity,
  DefinitionEntity,
} from "@features/measures/domain/entities/submission.entity";

export class AttachmentMapper {
  static fromOdkModelToEntity(model: AttachmentModel): AttachmentEntity {
    return new AttachmentEntity(
      model.blobId,
      model.name,
      model.submissionDefId,
      model.index,
      model.isClientAudit
    );
  }
}

export class DefinitionMapper {
  static fromOdkModelToEntity(model: DefinitionModel): DefinitionEntity {
    return new DefinitionEntity(
      model.id,
      model.submissionId,
      model.xml,
      model.formDefId,
      model.submitterId,
      model.createdAt,
      model.current,
      model.instanceName,
      model.instanceId,
      model.userAgent,
      model.root,
      model.attachments.map(AttachmentMapper.fromOdkModelToEntity)
    );
  }
}

export class ApiSubmissionMapper {
  static fromOdkModelToEntity(model: ApiSubmissionModel): ApiSubmissionEntity {
    return new ApiSubmissionEntity(
      model.id,
      model.formId,
      model.instanceId,
      model.createdAt,
      model.updatedAt,
      model.deletedAt,
      model.submitterId,
      model.draft,
      model.reviewState,
      DefinitionMapper.fromOdkModelToEntity(model.definition)
    );
  }
}
