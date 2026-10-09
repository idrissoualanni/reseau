import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/client", () => ({ checkDatabase: vi.fn() }));

import { checkDatabase } from "@/db/client";
import { GET } from "./route";

const mockedCheckDatabase = vi.mocked(checkDatabase);

describe("GET /api/health", () => {
  beforeEach(() => {
    mockedCheckDatabase.mockReset();
  });

  it("répond 200 avec database=true quand la base répond", async () => {
    mockedCheckDatabase.mockResolvedValue(true);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database).toBe(true);
  });

  it("répond 503 avec database=false quand la base est injoignable", async () => {
    mockedCheckDatabase.mockResolvedValue(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.database).toBe(false);
  });
});
