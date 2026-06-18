import { getSafeAuthRedirectPath } from "./redirect";

describe("getSafeAuthRedirectPath", () => {
  it("defaults to /main when next is missing", () => {
    expect(getSafeAuthRedirectPath(null)).toBe("/main");
  });

  it("keeps valid in-app relative paths", () => {
    expect(getSafeAuthRedirectPath("/main")).toBe("/main");
    expect(getSafeAuthRedirectPath("/dashboard/books?id=1")).toBe("/dashboard/books?id=1");
  });

  it("rejects protocol-relative targets", () => {
    expect(getSafeAuthRedirectPath("//evil.com")).toBe("/main");
  });

  it("rejects absolute URLs", () => {
    expect(getSafeAuthRedirectPath("https://evil.com")).toBe("/main");
    expect(getSafeAuthRedirectPath("http://evil.com/path")).toBe("/main");
  });

  it("rejects backslash-based paths", () => {
    expect(getSafeAuthRedirectPath("/\\evil")).toBe("/main");
  });
});
