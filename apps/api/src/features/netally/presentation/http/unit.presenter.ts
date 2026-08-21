import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import type {
  LinkLiveUnit,
  LinkLiveUploadedFile,
} from "@core/linklive/linklive.service";

export class UploadedFilePresenter {
  @ApiProperty({ type: "string", example: "6a5a0134f2214038bb74e56b" })
  id: string;
  @ApiProperty({ type: "string", example: "20260717-101722.jpg" })
  name: string;
  @ApiProperty({ type: "string", example: "image" })
  format: string;
  @ApiPropertyOptional({ type: "number", example: 71654 })
  size: number | null;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T10:17:24.641Z" })
  uploadedAt: string | null;
  @ApiPropertyOptional({ type: "string" })
  href: string | null;
  @ApiPropertyOptional({ type: "string" })
  mediumImage: string | null;
  @ApiPropertyOptional({ type: "string" })
  thumb: string | null;

  constructor(file: LinkLiveUploadedFile) {
    this.id = file._id;
    this.name = file.title ?? file.fileName ?? "";
    this.format = file.fileFormat ?? "file";
    this.size = file.fileSize ?? null;
    this.uploadedAt = file.uploaded_at ?? file.created_at ?? null;
    this.href = file.href ?? null;
    this.mediumImage = file.mediumImage ?? null;
    this.thumb = file.thumb ?? null;
  }
}

export class UnitPresenter {
  @ApiProperty({ type: "string", example: "69ca1e61b22c9b7f420db848" })
  id: string;
  @ApiProperty({ type: "string", example: "Magtel's AirCheck G3 - 554CE0" })
  name: string;
  @ApiProperty({ type: "string", example: "AirCheckG3" })
  unitType: string;
  @ApiProperty({ type: "string", example: "1" })
  model: string;
  @ApiProperty({ type: "string", example: "AIRCHECK-G3E-PRO" })
  hardwareVersion: string;
  @ApiProperty({ type: "string", example: "00C017-554CE0" })
  mac: string;
  @ApiProperty({ type: "string", example: "2602106AC3" })
  serialNumber: string;
  @ApiPropertyOptional({ type: "string", example: "10.100.4.44" })
  ipAddress: string | null;
  @ApiPropertyOptional({ type: "string", example: "10.100.4.44" })
  ipWifiManagement: string | null;
  @ApiPropertyOptional({ type: "string", example: "10.100.4.44" })
  ipWiredManagement: string | null;
  @ApiPropertyOptional({ type: "string", example: "2026-06-22T08:52:09.481Z" })
  lastSeen: string | null;
  @ApiPropertyOptional({ type: "string", example: "2.9.0.85" })
  firmware: string | null;
  @ApiPropertyOptional({
    type: "object",
    additionalProperties: { type: "string" },
    example: { android: "2.9.0.85", apks: "2.9.0.85" },
  })
  firmwareVersions: Record<string, string>;
  @ApiPropertyOptional({ type: "string", example: "carlos.machin@magtel.es" })
  claimedBy: string | null;
  @ApiPropertyOptional({ type: "number", example: 2.01 })
  lastBattery: number | null;
  @ApiPropertyOptional({ type: "number", example: 1000 })
  lastLinkSpeed: number | null;
  @ApiProperty({ type: UploadedFilePresenter, isArray: true })
  files: UploadedFilePresenter[];

  constructor(unit: LinkLiveUnit & { files: LinkLiveUploadedFile[] }) {
    this.id = unit._id;
    this.name = unit.name ?? "";
    this.unitType = unit.unitType ?? "";
    this.model = unit.model ?? "";
    this.hardwareVersion = unit.hardwareVersion ?? "";
    this.mac = unit.mac ?? "";
    this.serialNumber = unit.serialNumber ?? "";
    this.ipAddress = unit.ipAddress ?? null;
    this.ipWifiManagement = unit.ipWifiManagement ?? null;
    this.ipWiredManagement = unit.ipWiredManagement ?? null;
    this.lastSeen = unit.lastSeen ?? null;
    this.firmware = unit.firmwareVersion ?? null;
    this.firmwareVersions = unit.otas ?? {};
    this.claimedBy = unit.claimedBy ?? null;
    this.lastBattery = unit.lastBattery ?? null;
    this.lastLinkSpeed = unit.lastLinkSpeed ?? null;
    this.files = (unit.files ?? []).map(
      (file) => new UploadedFilePresenter(file)
    );
  }
}
