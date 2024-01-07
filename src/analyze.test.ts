import { expect, test } from "@jest/globals";
import { promises as fs } from "fs";

import { GameRecord, Result } from "./types";
import { parseReplay } from "./analyze";

test("read replay file", async () => {
  const file = await fs.readFile(process.cwd() + "/tests/example.slp");
  const result = parseReplay("example.slp", file);
  expect(result.ok).toBe(true);
});
