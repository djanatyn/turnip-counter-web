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
 * Analyzes Peach down-b pulls in a game
 * Tracks which turnip faces and special items were pulled
 *
 * Peach's down-b pull mechanics:
 * - 127/128 chance: Turnip (typeId 99) with peachTurnipFace 0-7
 * - 1/128 chance: Special item (Bob-omb, Mr. Saturn, or Beam Sword)
 *
 * Turnip faces (peachTurnipFace values for typeId 99):
 * 0 = Normal (most common)
 * 1 = Stitch Face (rare, stronger)
 * 2 = Dot Eyes
 * 3 = Line Eyes
 * 4 = Circle Eyes
 * 5 = Carrot Eyes
 * 6 = Wink (rare)
 * 7 = Dot Eyes (merged with 2)
 *
 * Special items (separate typeIds):
 * typeId 6 = Bob-omb
 * typeId 7 = Mr. Saturn
 * typeId 12 = Beam Sword
 */
export class TurnipPullsAnalyzer implements Analyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "turnip-pulls",
    name: "Turnip Pull Distribution",
    description:
      "Analyzes which turnip faces and special items were pulled from Peach's down-b",
    phase: AnalysisPhase.PerGame,
    outputShape: DataShape.Distribution,
    version: 2,
    author: "DJAN",
    tags: ["peach", "items", "rng"],
  };

  private readonly TURNIP_TYPE_ID = 99;
  private readonly BOB_OMB_TYPE_ID = 6;
  private readonly MR_SATURN_TYPE_ID = 7;
  private readonly BEAM_SWORD_TYPE_ID = 12;

  private readonly TURNIP_FACE_NAMES: Record<number, string> = {
    0: "Normal",
    1: "Stitch Face",
    2: "Dot Eyes", // Combines face 2 and 7
    3: "Line Eyes",
    4: "Circle Eyes",
    5: "Carrot Eyes",
    6: "Wink",
    7: "Dot Eyes", // Merged with 2
  };

  analyze(context: AnalysisContext): DistributionOutput {
    const { replay, userContext } = context;

    // Determine which player indices to analyze
    const targetIndices = this.getTargetPlayerIndices(replay, userContext);

    // Track unique items by spawnId to avoid counting the same item multiple times
    const seenItems = new Set<number>();
    const pullCounts = new Map<string, number>();

    // Iterate through frames looking for Peach down-b pulls
    for (const frame of replay.frames) {
      for (const item of frame.items) {
        // Skip if already seen or not owned by target player
        if (
          seenItems.has(item.spawnId) ||
          !targetIndices.has(item.owner)
        ) {
          continue;
        }

        let pullType: string | null = null;

        // Check for turnips (typeId 99)
        if (item.typeId === this.TURNIP_TYPE_ID) {
          const face = item.peachTurnipFace;
          // Valid turnip faces are 0-7
          if (face >= 0 && face <= 7) {
            seenItems.add(item.spawnId);
            pullType = this.TURNIP_FACE_NAMES[face];
          }
        }
        // Check for special items from down-b
        else if (item.typeId === this.BOB_OMB_TYPE_ID) {
          seenItems.add(item.spawnId);
          pullType = "Bob-omb";
        } else if (item.typeId === this.MR_SATURN_TYPE_ID) {
          seenItems.add(item.spawnId);
          pullType = "Mr. Saturn";
        } else if (item.typeId === this.BEAM_SWORD_TYPE_ID) {
          seenItems.add(item.spawnId);
          pullType = "Beam Sword";
        }

        if (pullType) {
          pullCounts.set(pullType, (pullCounts.get(pullType) || 0) + 1);
        }
      }
    }

    // Convert to distribution format
    const totalPulls = Array.from(pullCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );

    const data = Array.from(pullCounts.entries())
      .map(([label, count]) => ({
        label,
        count,
        percentage:
          totalPulls > 0 ? Math.round((count / totalPulls) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      shape: DataShape.Distribution,
      label: `Peach Down-B Pulls (${totalPulls} total)`,
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
