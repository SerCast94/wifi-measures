import { Injectable } from "@nestjs/common";

import {
  LinkLiveService,
  LinkLiveUnit,
  LinkLiveUploadedFile,
} from "@core/linklive/linklive.service";

export interface UnitWithFiles extends LinkLiveUnit {
  files: LinkLiveUploadedFile[];
}

export interface NetAllyDashboardData {
  totalResults: number;
  totalUnits: number;
  totalFiles: number;
  resultsByColor: Record<string, number>;
  resultsWithFailures: number;
  unitsByType: Record<string, number>;
  lastUpdated: string | null;
}

@Injectable()
export class NetAllyService {
  constructor(private readonly linkLive: LinkLiveService) {}

  async getUnits(): Promise<UnitWithFiles[]> {
    const [units, files] = await Promise.all([
      this.linkLive.listUnits(),
      this.linkLive.listUploadedFiles(),
    ]);

    return units.map((unit) => ({
      ...unit,
      files: files.filter((file) => file.unitId === unit._id),
    }));
  }

  async getNetAllyDashboard(): Promise<NetAllyDashboardData> {
    const [results, units, files] = await Promise.all([
      this.linkLive.listResults({ limit: 100 }),
      this.linkLive.listUnits(),
      this.linkLive.listUploadedFiles(),
    ]);

    const resultsByColor: Record<string, number> = {};
    for (const result of results) {
      const color = String(
        result.overallColor ?? result.linkColor ?? "unknown"
      ).toLowerCase();
      resultsByColor[color] = (resultsByColor[color] ?? 0) + 1;
    }

    const resultsWithFailures = results.filter((result) => {
      const reasons = result.linkFailureReasons ?? result.failureReasons ?? [];
      return Array.isArray(reasons) && reasons.length > 0;
    }).length;

    const unitsByType: Record<string, number> = {};
    for (const unit of units) {
      const type = String(unit.unitType ?? "unknown");
      unitsByType[type] = (unitsByType[type] ?? 0) + 1;
    }

    const lastUpdated =
      results
        .map((result) => result.updated_at ?? result.created_at ?? "")
        .filter(Boolean)
        .sort()
        .pop() ?? null;

    return {
      totalResults: results.length,
      totalUnits: units.length,
      totalFiles: files.length,
      resultsByColor,
      resultsWithFailures,
      unitsByType,
      lastUpdated,
    };
  }
}
