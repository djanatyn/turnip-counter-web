import type {
  ComparativeAnalyzer,
  AnalyzerMetadata,
  AnalysisResult,
  ComparisonOutput,
  PercentageOutput,
  ComparisonDimension,
} from "@/analysis/types";
import { AnalysisPhase, DataShape } from "@/analysis/types";
import { getStorageManager } from "@/storage/db";
import { charactersExt } from "@slippilab/common";

/**
 * Compares L-Cancel rates across different matchups
 * Groups by opponent character to show performance vs different characters
 */
export class LCancelByMatchupAnalyzer implements ComparativeAnalyzer {
  readonly metadata: AnalyzerMetadata = {
    id: "l-cancel-by-matchup",
    name: "L-Cancel Rate by Matchup",
    description: "Compare L-Cancel rates against different characters",
    phase: AnalysisPhase.Comparative,
    outputShape: DataShape.Comparison,
    version: 1,
    dependencies: ["l-cancel-rate"],
    author: "DJAN",
    tags: ["comparative", "matchup", "tech-skill"],
  };

  async compare(
    results: AnalysisResult[],
    dimension: ComparisonDimension
  ): Promise<ComparisonOutput> {
    const storage = getStorageManager();

    // Filter for L-cancel results
    const lCancelResults = results.filter(
      (r) => r.analyzerId === "l-cancel-rate"
    );

    if (lCancelResults.length === 0) {
      return {
        shape: DataShape.Comparison,
        label: "L-Cancel Rate by Character Matchup",
        data: [],
      };
    }

    // Group by opponent character
    const byCharacter = new Map<
      number,
      { successful: number; total: number }
    >();

    for (const result of lCancelResults) {
      // Get file metadata to find opponent character
      const fileMetadata = await storage.getFileMetadata(result.fileId);
      if (!fileMetadata) continue;

      // Find opponent's character (assuming 2-player game)
      const players = fileMetadata.gameMetadata.players;
      if (players.length < 2) continue;

      // Get opponent character ID (not the user's character)
      // This is simplified - in a real impl you'd match by connect code
      const opponentChar = players[1].characterId;

      if (!byCharacter.has(opponentChar)) {
        byCharacter.set(opponentChar, { successful: 0, total: 0 });
      }

      const output = result.output as PercentageOutput;
      if (output.numerator !== undefined && output.denominator !== undefined) {
        const stats = byCharacter.get(opponentChar)!;
        stats.successful += output.numerator;
        stats.total += output.denominator;
      }
    }

    // Convert to comparison data
    const data = Array.from(byCharacter.entries())
      .map(([charId, stats]) => ({
        label: charactersExt[charId] || `Character ${charId}`,
        value: stats.total > 0 ? (stats.successful / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      shape: DataShape.Comparison,
      label: "L-Cancel Rate by Opponent Character",
      data,
    };
  }
}
