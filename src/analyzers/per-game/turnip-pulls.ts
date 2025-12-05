import type {
  Analyzer,
  AnalyzerMetadata,
  AnalysisContext,
  DistributionOutput,
  UserContext,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";
import type { ReplayData } from "@slippilab/common";

/**
 * Analyzes Peach turnip pulls in a game
 * Tracks which turnip faces were pulled and their distribution
 *
 * Turnip faces (peachTurnipFace values):
 * 0 = Normal (most common)
 * 1 = Stitch Face (rare, stronger)
 * 2 = Dot Eyes
 * 3 = Line Eyes
 * 4 = Circle Eyes
 * 5 = Carrot Eyes
 * 6 = Wink (rare)
 * 7 = Dot Eyes Closed (very rare)
 * 8 = Mr. Saturn (very rare item)
 * 9 = Bob-omb (very rare item)
 */
export class TurnipPullsAnalyzer implements Analyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "turnip-pulls",
    name: "Turnip Pull Distribution",
    description:
      "Analyzes which turnip faces were pulled (Peach-specific)",
    phase: AnalysisPhase.PerGame,
    outputShape: DataShape.Distribution,
    version: 1,
    author: "DJAN",
    tags: ["peach", "items", "rng"],
  };

  private readonly TURNIP_NAMES: Record<number, string> = {
    0: "Normal",
    1: "Stitch Face",
    2: "Dot Eyes",
    3: "Line Eyes",
    4: "Circle Eyes",
    5: "Carrot Eyes",
    6: "Wink",
    7: "Dot Eyes", // Combine with regular Dot Eyes
    8: "Mr. Saturn",
    9: "Bob-omb",
    // Mystery values - may need adjustment based on actual data
    99: "Unknown (99)",
    219: "Unknown (219)",
    230: "Unknown (230)",
    255: "Unknown (255)",
  };

  analyze(context: AnalysisContext): DistributionOutput {
    const { replay, userContext } = context;

    // Determine which player indices to analyze
    const targetIndices = this.getTargetPlayerIndices(replay, userContext);

    // Track unique turnips by spawnId to avoid counting the same turnip multiple times
    const seenTurnips = new Set<number>();
    const turnipCounts = new Map<number, number>();

    // Iterate through frames looking for turnip spawns
    for (const frame of replay.frames) {
      for (const item of frame.items) {
        // Check if this is a turnip (has peachTurnipFace and not the default/null value)
        // and if it belongs to a target player
        // Note: peachTurnipFace === 75 appears to be a default/null value for non-turnip items
        if (
          item.peachTurnipFace !== undefined &&
          item.peachTurnipFace !== 75 &&
          targetIndices.has(item.owner) &&
          !seenTurnips.has(item.spawnId)
        ) {
          seenTurnips.add(item.spawnId);
          const face = item.peachTurnipFace;
          turnipCounts.set(face, (turnipCounts.get(face) || 0) + 1);
        }
      }
    }

    // Convert to distribution format
    const totalPulls = Array.from(turnipCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const data = Array.from(turnipCounts.entries())
      .map(([face, count]) => ({
        label: this.TURNIP_NAMES[face] || `Type ${face}`,
        count,
        percentage:
          totalPulls > 0 ? Math.round((count / totalPulls) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      shape: DataShape.Distribution,
      label: `Turnip Pulls (${totalPulls} total)`,
      data,
    };
  }

  private getTargetPlayerIndices(
    replay: ReplayData,
    userContext?: UserContext
  ): Set<number> {
    const indices = new Set<number>();

    if (
      userContext?.targetPlayerCodes &&
      userContext.targetPlayerCodes.length > 0
    ) {
      // Filter by connect code
      for (const playerSettings of replay.settings.playerSettings) {
        if (
          playerSettings.connectCode &&
          userContext.targetPlayerCodes.includes(playerSettings.connectCode)
        ) {
          indices.add(playerSettings.playerIndex);
        }
      }
    } else {
      // Analyze all players
      for (const playerSettings of replay.settings.playerSettings) {
        indices.add(playerSettings.playerIndex);
      }
    }

    return indices;
  }
}
