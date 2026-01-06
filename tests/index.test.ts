import { describe, expect, it } from "vitest";
import check, { Schema } from "../src/index";
import type { RuleMap } from "../src/baserules";

describe("validator check", () => {
  it("accepts a valid string field", () => {
    const obj = { name: "john" };
    const schema: Schema = { name: "string" };

    const result = check(obj, schema);

    expect(result).toBeUndefined();
  });

  it("rejects an invalid string field", () => {
    const obj = { name: 123 };
    const schema: Schema = { name: "string" };

    const result = check(obj, schema);

    expect(result).toEqual({ name: ["string"] });
  });

  it("respects optional fields", () => {
    const obj: Record<string, unknown> = {};
    const schema: Schema = { nickname: "opt|string" };

    const result = check(obj, schema);

    expect(result).toBeUndefined();
  });

  it("validates numeric comparison rules", () => {
    const obj = { age: 16 };
    const schema: Schema = { age: ">=18" };

    const result = check(obj, schema);

    expect(result).toEqual({ age: [">=18"] });
  });

  it("validates arrays against provided schemas", () => {
    const obj = { tags: ["ok", 2] };
    const schema: Schema = { tags: ["string"] };

    const result = check(obj, schema);
    expect(result).toEqual({ tags: [undefined, ["string"]] });
  });

  it("applies custom rules", () => {
    const customRules: RuleMap = {
      positive: (value: unknown) => typeof value === "number" && value > 0,
    };
    const obj = { score: -1 };
    const schema: Schema = { score: "positive" };

    const result = check(obj, schema, customRules);

    expect(result).toEqual({ score: ["positive"] });
  });

  it("trims unknown keys from objects", () => {
    const obj: Record<string, unknown> = { keep: 1, drop: "x" };
    const schema: Schema = { keep: "number" };

    const result = check(obj, schema);

    expect(result).toBeUndefined();
    expect(obj).toEqual({ keep: 1 });
  });
});

