import { Global, Injectable } from "@nestjs/common";

import axios, { AxiosInstance } from "axios";

import { AppConfigService } from "@config/app-config.service";

@Global()
@Injectable()
export class OdkService {
  private readonly odkApi: AxiosInstance;

  constructor(private readonly config: AppConfigService) {
    const baseUrl = this.config.get("odkApiUrl");
    this.odkApi = axios.create({ baseURL: baseUrl });
  }

  getInstance(): AxiosInstance {
    return this.odkApi;
  }
}
