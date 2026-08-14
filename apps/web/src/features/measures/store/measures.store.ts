import { create } from "zustand";
import { MeasureModel } from "../models/measure.model";

export interface MeasuresStore {
  measures: Record<string, MeasureModel>;
  measuresIds: string[]; // Para mantener el orden de los measures
  globalFilter: string;

  setMeasures: (measures: MeasureModel[]) => void;
  setGlobalFilter: (value: string) => void;
}

export const useMeasuresStore = create<MeasuresStore>((set) => ({
  measures: {},
  lastUpdateInfo: null,
  measuresIds: [],
  globalFilter: "",

  setMeasures: (measures: MeasureModel[]) => {
    const measuresIds = measures.map((measure) => String(measure.id));
    set(() => ({
      measures: Object.fromEntries(
        measures.map((measure) => [measure.id, measure])
      ),
      measuresIds: measuresIds,
    }));
  },
  setGlobalFilter: (value: string) => {
    set(() => ({ globalFilter: value }));
  },
}));
