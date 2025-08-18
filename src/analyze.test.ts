import { expect, test } from "@jest/globals";
import { promises as fs } from "fs";

import { GameRecord, Result } from "./types";
import { parseReplayFile } from "./analyze";

test("read replay file", async () => {
  const buffer = await fs.readFile(process.cwd() + "/tests/example.slp");
  console.log(buffer);
  const result = parseReplayFile("example.slp", buffer);
  console.log(result);
  expect(result.ok).toBe(true);
});
