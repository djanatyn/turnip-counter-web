import type {
  Analyzer,
  AnalyzerMetadata,
  AnalysisContext,
  PercentageOutput,
  UserContext,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";
import type { ReplayData } from "@slippilab/common";

/**
 * Analyzes L-Cancel success rate for a single game
 *
 * L-Canceling is a technique where players press L/R/Z during landing
 * to reduce landing lag by 50%. This analyzer calculates the success rate.
 */
export class LCancelRateAnalyzer implements Analyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "l-cancel-rate",
    name: "L-Cancel Success Rate",
    description:
      "Calculates the percentage of successful L-Cancels in a game",
    phase: AnalysisPhase.PerGame,
    outputShape: DataShape.Percentage,
    version: 1,
    author: "DJAN",
    tags: ["tech-skill", "movement", "fundamental"],
  };

  analyze(context: AnalysisContext): PercentageOutput {
    const { replay, userContext } = context;

    // Determine which player indices to analyze
    const targetIndices = this.getTargetPlayerIndices(replay, userContext);

    let totalAttempts = 0;
    let successfulCancels = 0;

    // Iterate through frames looking for landing events
    for (const frame of replay.frames) {
      for (const playerUpdate of frame.players) {
        // Only analyze target players
        if (!targetIndices.has(playerUpdate.playerIndex)) {
          continue;
        }

        const state = playerUpdate.state;

        // L-Cancel status is only populated on first landing frame
        if (state.lCancelStatus) {
          totalAttempts++;
          if (state.lCancelStatus === "successful") {
            successfulCancels++;
          }
        }
      }
    }

    // Calculate percentage
    const percentage =
      totalAttempts > 0 ? (successfulCancels / totalAttempts) * 100 : 0;

    return {
      shape: DataShape.Percentage,
      value: Math.round(percentage * 100) / 100, // Round to 2 decimals
      label: "L-Cancel Success Rate",
      numerator: successfulCancels,
      denominator: totalAttempts,
    };
  }

  /**
   * Helper: Determine which players to analyze based on user context
   */
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
