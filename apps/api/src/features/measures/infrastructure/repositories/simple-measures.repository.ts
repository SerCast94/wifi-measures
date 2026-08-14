import { Injectable } from "@nestjs/common";

import { IMeasuresRepository } from "@features/measures/domain/interfaces/measures-repository.interface";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";

@Injectable()
export class SimpleMeasuresRepository implements IMeasuresRepository {
  private measures: MeasureEntity[] = [];

  async getAll(): Promise<MeasureEntity[]> {
    return this.measures;
  }

  async getByIdArea(areaId: number): Promise<MeasureEntity[] | null> {
    return this.measures.filter((m) => +m.idArea === +areaId) || null;
  }

  async getSubmissionsIds(): Promise<string[]> {
    return this.measures.map((m) => `${m.idFormulario}`);
  }

  async getById(measureId: string): Promise<MeasureEntity | null> {
    return this.measures.find((m) => `${m.id}` === `${measureId}`) || null;
  }

  async create(measure: Partial<MeasureEntity>): Promise<MeasureEntity | null> {
    const id = (Date.now() + Math.floor(Math.random() * 1000)).toString();
    const entity = MeasureEntity.create({ ...measure, id, createdAt: new Date(), updatedAt: new Date() });
    this.measures.push(entity);
    return entity;
  }

  async delete(measureId: string): Promise<void> {
    this.measures = this.measures.filter((m) => `${m.id}` !== `${measureId}`);
  }
}
