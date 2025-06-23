// @vitest-environment node
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import supertest from "supertest";
import { webserver } from "./server.js";

let server;
let request;

beforeAll(() => {
  server = webserver.listen(0); // 0 — любой свободный порт
  request = supertest(server);
});

afterAll(() => {
  server.close();
});

describe("Express server", () => {
  test("GET / должен возвращать 200", async () => {
    const res = await request.get("/");
    expect(res.status).toBe(200);
  });
});
