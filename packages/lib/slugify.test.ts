import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("should convert to lowercase", () => {
    expect(slugify("Hello")).toEqual("hello");
    expect(slugify("HELLO")).toEqual("hello");
  });

  it("should convert spaces, _, +, # and any other special character to -", () => {
    expect(slugify("hello there")).toEqual("hello-there");
    expect(slugify("hello_there")).toEqual("hello-there");
    expect(slugify("hello$there")).toEqual("hello-there");
    expect(slugify("hello+there")).toEqual("hello-there");
    expect(slugify("#hellothere")).toEqual("hellothere");
  });

  it("should keep numbers as is", () => {
    expect(slugify("hellothere123")).toEqual("hellothere123");
    expect(slugify("321hello there123")).toEqual("321hello-there123");
    expect(slugify("hello$there")).toEqual("hello-there");
  });

  // So that user can freely add spaces and any other character iteratively and it get's converted to - later on.
  it("should remove dashes from start and end.", () => {
    expect(slugify("hello-there-")).toEqual("hello-there");
    expect(slugify("hello-there_")).toEqual("hello-there");
    expect(slugify("_hello-there_")).toEqual("hello-there");
    expect(slugify("$hello-there_")).toEqual("hello-there");
  });

  // This is failing, if we want to fix it, one approach is as used in getValidRhfFieldName
  it.skip("should remove unicode and emoji characters", () => {
    expect(slugify("Hello 📚🕯️®️ There")).toEqual("hello---------there");
    expect(slugify("📚🕯️®️")).toEqual("");
  });
});
