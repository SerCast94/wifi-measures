import { INestApplication, VersioningType } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";

import request from "supertest";
import cookieParser from "cookie-parser";
import { App } from "supertest/types";
import { AppModule } from "./../src/app.module";

describe("Health (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.enableVersioning({
      defaultVersion: "1",
      type: VersioningType.URI,
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("emite token CSRF público", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/csrf/token")
      .expect(200);
    const cookies = response.headers["set-cookie"];
    const csrfCookie = ([] as string[])
      .concat(cookies ?? [])
      .find((cookie) => cookie.toLowerCase().includes("csrf"));
    expect(csrfCookie).toBeDefined();
  });
});
