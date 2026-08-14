import { MeasureEntity } from "../entities/measure.entity";

export interface IMeasuresRepository {
  getAll(): Promise<MeasureEntity[]>;
  getByIdArea(areaId: number): Promise<MeasureEntity[] | null>;
  getSubmissionsIds(): Promise<string[]>;
  getById(measureId: string): Promise<MeasureEntity | null>;
  create(measure: Partial<MeasureEntity>): Promise<MeasureEntity | null>;
  delete(measureId: string): Promise<void>;
}
