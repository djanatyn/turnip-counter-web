import { expect, test, describe } from "@jest/globals";
import { promises as fs } from "fs";
import { parseReplayFile } from "@/analyze";
import { TurnipPullsAnalyzer } from "./turnip-pulls";
import type { AnalysisContext } from "@/analysis/types";
import { DataShape } from "@/analysis/types";

describe("TurnipPullsAnalyzer", () => {
  let analyzer: TurnipPullsAnalyzer;

  beforeEach(() => {
    analyzer = new TurnipPullsAnalyzer();
  });

  test("has correct metadata", () => {
    expect(analyzer.metadata.id).toBe("turnip-pulls");
    expect(analyzer.metadata.name).toBe("Turnip Pull Distribution");
    expect(analyzer.metadata.phase).toBe("per-game");
    expect(analyzer.metadata.outputShape).toBe(DataShape.Distribution);
  });

  test("analyzes example replay for turnips", async () => {
    // Load test replay
    const buffer = await fs.readFile(process.cwd() + "/tests/example.slp");
    const parseResult = parseReplayFile("example.slp", buffer);
    expect(parseResult.ok).toBe(true);

    if (!parseResult.ok) return;

    const replay = parseResult.value.game;

    // Create context
    const context: AnalysisContext = {
      replay,
      fileMetadata: {
        id: "test",
        fileName: "example.slp",
        fileSize: 0,
        lastModified: 0,
        contentHash: "",
        firstAnalyzed: "",
        lastAnalyzed: "",
        gameMetadata: {
          timestamp: replay.settings.startTimestamp,
          matchId: replay.settings.matchId,
          gameNumber: replay.settings.gameNumber,
          stageId: replay.settings.stageId,
          players: [],
        },
        analyzedBy: new Set(),
      },
    };

    // Run analyzer
    const result = analyzer.analyze(context);

    // Assertions
    expect(result.shape).toBe(DataShape.Distribution);
    expect(result.label).toContain("Peach Down-B Pulls");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);

    // Verify turnip types are properly labeled (no mystery values)
    for (const item of result.data) {
      expect(item.label).not.toContain("Unknown");
      expect(item.count).toBeGreaterThan(0);
      expect(item.percentage).toBeGreaterThan(0);
    }
  });
});
