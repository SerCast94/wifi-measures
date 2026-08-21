import { ApiProperty } from "@nestjs/swagger";

import type { NetAllyDashboardData } from "@features/netally/application/netally.service";

export class NetAllyDashboardPresenter {
  @ApiProperty({ type: "number", example: 3 })
  totalResults: number;
  @ApiProperty({ type: "number", example: 2 })
  totalUnits: number;
  @ApiProperty({ type: "number", example: 3 })
  totalFiles: number;
  @ApiProperty({
    type: "object",
    additionalProperties: { type: "number" },
    example: { red: 3 },
  })
  resultsByColor: Record<string, number>;
  @ApiProperty({ type: "number", example: 3 })
  resultsWithFailures: number;
  @ApiProperty({
    type: "object",
    additionalProperties: { type: "number" },
    example: { AirCheckG3: 1, iPerf: 1 },
  })
  unitsByType: Record<string, number>;
  @ApiProperty({ type: "string", example: "2026-07-17T10:46:11.373Z" })
  lastUpdated: string | null;

  constructor(data: NetAllyDashboardData) {
    this.totalResults = data.totalResults;
    this.totalUnits = data.totalUnits;
    this.totalFiles = data.totalFiles;
    this.resultsByColor = data.resultsByColor;
    this.resultsWithFailures = data.resultsWithFailures;
    this.unitsByType = data.unitsByType;
    this.lastUpdated = data.lastUpdated;
  }
}
