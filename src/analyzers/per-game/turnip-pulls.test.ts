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

    // Debug: Check if frames have items
    console.log("Total frames:", replay.frames.length);

    // Check first few frames for structure
    const framesWithItems = replay.frames.filter((f: any) =>
      f.items && Array.isArray(f.items) && f.items.length > 0
    );
    console.log("Frames with items:", framesWithItems.length);

    // Collect unique typeIds and items with peachTurnipFace
    const typeIds = new Set<number>();
    const itemsWithTurnipFace: any[] = [];

    for (const frame of replay.frames) {
      if (frame.items) {
        for (const item of frame.items) {
          typeIds.add(item.typeId);
          if (item.peachTurnipFace !== undefined && item.peachTurnipFace !== 75) {
            itemsWithTurnipFace.push(item);
          }
        }
      }
    }

    console.log("Unique typeIds:", Array.from(typeIds).sort((a, b) => a - b));
    console.log("Items with turnipFace (non-75):", itemsWithTurnipFace.length);

    // Collect unique peachTurnipFace values
    const turnipFaceValues = new Set<number>();
    for (const frame of replay.frames) {
      if (frame.items) {
        for (const item of frame.items) {
          if (item.peachTurnipFace !== undefined && item.peachTurnipFace !== 75) {
            turnipFaceValues.add(item.peachTurnipFace);
          }
        }
      }
    }
    console.log("Unique peachTurnipFace values:", Array.from(turnipFaceValues).sort((a, b) => a - b));

    // Check player characters (Peach is character ID 13)
    console.log("Players:", replay.settings.playerSettings.map((p: any) => ({
      index: p.playerIndex,
      characterId: p.characterId,
      connectCode: p.connectCode,
    })));

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
    expect(result.label).toContain("Turnip Pulls");
    expect(Array.isArray(result.data)).toBe(true);

    console.log(`Turnip Pulls Result:`, JSON.stringify(result, null, 2));

    // If there are Peach players, we should see turnip data
    // (or at least understand why we don't)
  });
});
