import { expect, test, describe } from "@jest/globals";
import { promises as fs } from "fs";
import { parseReplayFile } from "@/analyze";
import { LCancelRateAnalyzer } from "./l-cancel-rate";
import type { AnalysisContext } from "@/analysis/types";
import { DataShape } from "@/analysis/types";

describe("LCancelRateAnalyzer", () => {
  let analyzer: LCancelRateAnalyzer;

  beforeEach(() => {
    analyzer = new LCancelRateAnalyzer();
  });

  test("has correct metadata", () => {
    expect(analyzer.metadata.id).toBe("l-cancel-rate");
    expect(analyzer.metadata.name).toBe("L-Cancel Success Rate");
    expect(analyzer.metadata.phase).toBe("per-game");
    expect(analyzer.metadata.outputShape).toBe(DataShape.Percentage);
  });

  test("analyzes example replay", async () => {
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
    expect(result.shape).toBe(DataShape.Percentage);
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
    expect(result.label).toBe("L-Cancel Success Rate");

    // Should have numerator and denominator
    expect(result.numerator).toBeDefined();
    expect(result.denominator).toBeDefined();
    expect(typeof result.numerator).toBe("number");
    expect(typeof result.denominator).toBe("number");

    // Numerator should be <= denominator
    if (result.numerator !== undefined && result.denominator !== undefined) {
      expect(result.numerator).toBeLessThanOrEqual(result.denominator);
    }

    console.log(`L-Cancel Rate: ${result.value}% (${result.numerator}/${result.denominator})`);
  });
});
