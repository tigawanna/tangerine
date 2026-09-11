import { describe, expect, it } from "vitest";
import { resolveServerGemmaOptions } from "./server-options.js";
import { resolveWebGemmaOptions } from "./web-options.js";

describe("resolveServerGemmaOptions", () => {
  it("defaults to cpu + q4", () => {
    const prevPath = process.env.GEMMA_MODEL_PATH;
    const prevDtype = process.env.GEMMA_DTYPE;
    delete process.env.GEMMA_MODEL_PATH;
    delete process.env.GEMMA_DTYPE;

    expect(resolveServerGemmaOptions()).toEqual({
      device: "cpu",
      dtype: "q4",
    });

    if (prevPath !== undefined) process.env.GEMMA_MODEL_PATH = prevPath;
    if (prevDtype !== undefined) process.env.GEMMA_DTYPE = prevDtype;
  });

  it("reads GEMMA_MODEL_PATH when unset in options", () => {
    const prev = process.env.GEMMA_MODEL_PATH;
    process.env.GEMMA_MODEL_PATH = "/models/gemma";

    expect(resolveServerGemmaOptions()).toMatchObject({
      modelPath: "/models/gemma",
      device: "cpu",
    });

    if (prev === undefined) {
      delete process.env.GEMMA_MODEL_PATH;
    } else {
      process.env.GEMMA_MODEL_PATH = prev;
    }
  });
});

describe("resolveWebGemmaOptions", () => {
  it("defaults to wasm + q8", () => {
    expect(resolveWebGemmaOptions()).toEqual({
      device: "wasm",
      dtype: "q8",
    });
  });
});
