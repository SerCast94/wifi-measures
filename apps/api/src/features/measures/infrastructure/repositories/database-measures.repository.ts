import { Injectable } from "@nestjs/common";

import { AppConfigService } from "@config/app-config.service";
import { DatabaseService } from "@core/database/database.service";
import { MeasureEntity } from "@features/measures/domain/entities/measure.entity";
import { DatabaseException } from "@core/exceptions/technical-exceptions";
import { IMeasuresRepository } from "@features/measures/domain/interfaces/measures-repository.interface";

@Injectable()
export class DatabaseMeasuresRepository implements IMeasuresRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: AppConfigService
  ) {}

  private getDb() {
    const db = this.database.getClient();
    if (!db) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? "Database client not available"
          : "Error occurred while accessing the database",
        "MEASURES_REPOSITORY"
      );
    }
    return db;
  }

  async getAll(): Promise<MeasureEntity[]> {
    try {
      const medidas = await this.getDb().medida.findMany({
        orderBy: { createdAt: "desc" },
      });
      return medidas.map(this.fromDbToEntity);
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_ALL_MEASURES_REPOSITORY"
      );
    }
  }

  async getByIdArea(_areaId: number): Promise<MeasureEntity[] | null> {
    try {
      const medidas = await this.getDb().medida.findMany({
        where: { lat: { not: null } },
        orderBy: { createdAt: "desc" },
      });
      return medidas
        .filter((m: any) => m.lat !== null)
        .map(this.fromDbToEntity);
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_MEASURES_BY_AREA_REPOSITORY"
      );
    }
  }

  async getSubmissionsIds(): Promise<string[]> {
    try {
      const medidas = await this.getDb().medida.findMany({
        select: { idLinkLive: true },
      });
      return medidas.map((m: { idLinkLive: string }) => m.idLinkLive);
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_MEASURES_IDS_REPOSITORY"
      );
    }
  }

  async getById(measureId: string): Promise<MeasureEntity | null> {
    try {
      const medida = await this.getDb().medida.findUnique({
        where: { id: measureId },
      });
      return medida ? this.fromDbToEntity(medida) : null;
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_MEASURE_BY_ID_REPOSITORY"
      );
    }
  }

  async create(measure: Partial<MeasureEntity>): Promise<MeasureEntity | null> {
    try {
      const idLinkLive = measure.idFormulario;
      if (!idLinkLive) {
        return null;
      }

      const saved = await this.getDb().medida.upsert({
        where: { idLinkLive },
        create: {
          id: measure.id as string,
          idLinkLive,
          name: measure.name,
          fechaHora: measure.fechaHora ? new Date(measure.fechaHora) : null,
          lat: measure.lat,
          lon: measure.lon,
          areaGeogr: measure.areaGeogr,
          provincia: measure.provincia,
          emisiones: measure.emisiones,
          ptoMedida: measure.ptoMedida,
          nMedida: measure.nMedida ?? 0,
          azimut: measure.azimut ?? 0,
          resultType: measure.emisiones,
          unitName: measure.areaGeogr,
          profileName: measure.name,
          overallColor: measure.monitorizacion,
          raw: measure.raw ?? undefined,
        },
        update: {
          name: measure.name,
          fechaHora: measure.fechaHora ? new Date(measure.fechaHora) : null,
          lat: measure.lat,
          lon: measure.lon,
          areaGeogr: measure.areaGeogr,
          provincia: measure.provincia,
          emisiones: measure.emisiones,
          ptoMedida: measure.ptoMedida,
          nMedida: measure.nMedida ?? 0,
          azimut: measure.azimut ?? 0,
          resultType: measure.emisiones,
          unitName: measure.areaGeogr,
          profileName: measure.name,
          overallColor: measure.monitorizacion,
          raw: measure.raw ?? undefined,
        },
      });

      return this.fromDbToEntity(saved);
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "CREATE_MEASURE_REPOSITORY"
      );
    }
  }

  async delete(measureId: string): Promise<void> {
    try {
      await this.getDb().medida.delete({ where: { id: measureId } });
    } catch (error: any) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "DELETE_MEASURE_REPOSITORY"
      );
    }
  }

  private fromDbToEntity(medida: any): MeasureEntity {
    return MeasureEntity.create({
      id: medida.id,
      idArea: 0,
      lat: medida.lat ?? null,
      lon: medida.lon ?? null,
      areaGeogr: medida.areaGeogr ?? "",
      provincia: medida.provincia ?? "",
      emisiones: medida.resultType ?? medida.emisiones ?? "",
      ptoMedida: medida.ptoMedida ?? "",
      nMedida: medida.nMedida ?? 0,
      fechaHora: medida.fechaHora
        ? medida.fechaHora.toISOString()
        : medida.createdAt.toISOString(),
      azimut: medida.azimut ?? 0,
      monitorizacion: medida.overallColor ?? null,
      idFormulario: medida.idLinkLive,
      name: medida.profileName ?? medida.name ?? "",
      raw: medida.raw ?? null,
      createdAt: medida.createdAt,
      updatedAt: medida.updatedAt,
    });
  }
}
