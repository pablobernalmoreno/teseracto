import { NextRequest } from "next/server";
import { GET } from "./route";

describe("legacy /auth/callback", () => {
  it("forwards code and next to /api/auth/callback with a 307", () => {
    const response = GET(
      new NextRequest("https://teseracto.test/auth/callback?code=abc&next=%2Fmain%3Ftab%3D1")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://teseracto.test/api/auth/callback?code=abc&next=%2Fmain%3Ftab%3D1"
    );
  });

  it("forwards an empty query so the handler reports missing_code", () => {
    const response = GET(new NextRequest("https://teseracto.test/auth/callback"));

    expect(response.headers.get("location")).toBe("https://teseracto.test/api/auth/callback");
  });
});
