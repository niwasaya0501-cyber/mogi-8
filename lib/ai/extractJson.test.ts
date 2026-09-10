import { describe, it, expect } from "vitest";
import { extractJson } from "./extractJson";

describe("extractJson", () => {
  it("extracts JSON wrapped in a ```json code fence", () => {
    const text = '```json\n{"summary":"ok","actions":["a"]}\n```';
    expect(extractJson(text)).toBe('{"summary":"ok","actions":["a"]}');
  });

  it("extracts JSON wrapped in a plain ``` code fence", () => {
    const text = '```\n{"summary":"ok","actions":["a"]}\n```';
    expect(extractJson(text)).toBe('{"summary":"ok","actions":["a"]}');
  });

  it("extracts a bare JSON object surrounded by extra prose", () => {
    const text = 'はい、分析結果です。\n{"summary":"ok","actions":["a"]}\nご確認ください。';
    expect(extractJson(text)).toBe('{"summary":"ok","actions":["a"]}');
  });

  it("returns the trimmed text as-is when no JSON object is found", () => {
    expect(extractJson("  すみません、分析できませんでした。  ")).toBe("すみません、分析できませんでした。");
  });
});
