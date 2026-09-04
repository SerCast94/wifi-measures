export interface UploadedFile {
  id: string;
  name: string;
  format: string;
  size: number | null;
  uploadedAt: string | null;
  href: string | null;
  mediumImage: string | null;
  thumb: string | null;
}

export interface Unit {
  id: string;
  name: string;
  unitType: string;
  model: string;
  hardwareVersion: string;
  mac: string;
  serialNumber: string;
  ipAddress: string | null;
  ipWifiManagement: string | null;
  ipWiredManagement: string | null;
  lastSeen: string | null;
  firmware: string | null;
  firmwareVersions: Record<string, string>;
  claimedBy: string | null;
  lastBattery: number | null;
  lastLinkSpeed: number | null;
  files: UploadedFile[];
}

export interface NetAllyDashboard {
  totalResults: number;
  totalUnits: number;
  totalFiles: number;
  resultsByColor: Record<string, number>;
  resultsWithFailures: number;
  unitsByType: Record<string, number>;
  lastUpdated: string | null;
}

export interface UploadFloorPlanPayload {
  imageBase64: string;
  labels?: string[];
  fileName: string;
  floorPlanName: string;
  floorPlanWidthPx: number;
  floorPlanHeightPx: number;
  floorPlanScalePpf: number;
  unit: string;
  width: number | string;
  height: number | string;
}

export interface UploadFloorPlanResult {
  id: string;
  fileName: string;
}

export interface UpdateFloorPlanMeasurementsPayload {
  linkLiveId: string;
  floorPlanScalePpf: number;
  unit: string;
  width: number | string;
  height: number | string;
}