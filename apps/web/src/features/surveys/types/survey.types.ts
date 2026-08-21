export interface SurveyPoint {
  pointIdx: number;
  x: number;
  y: number;
  value: number | null;
  time?: string | null;
}

export interface SurveyMetric {
  key: string;
  label: string;
  unit: string;
  points: SurveyPoint[];
}

export interface LinkLiveSurvey {
  id: number;
  idLinkLive: string;
  name: string | null;
  surveyName: string | null;
  surveyDescription: string | null;
  surveyMode: string | null;
  surveyPointCount: number;
  surveyBluetooth: boolean;
  surveyActive1x1: boolean;
  ssid1x1: string | null;
  unitName: string | null;
  unitType: string | null;
  unitHardware: string | null;
  unitMac: string | null;
  unitSerial: string | null;
  status: string | null;
  floorPlanFilename: string | null;
  floorPlanWidth: number;
  floorPlanHeight: number;
  floorPlanScaledWidth: number;
  floorPlanScaledHeight: number;
  analysisGuid: string | null;
  surveyStartTime: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  metrics?: SurveyMetric[];
}