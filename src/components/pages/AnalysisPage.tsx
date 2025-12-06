"use client";

import React from "react";
import type { AnalysisResult } from "@/analysis/types";
import { getVisualizerRegistry } from "@/visualizers/registry";

interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  gameMetadata: {
    timestamp: string;
    players: Array<{
      connectCode?: string;
      characterId: number;
    }>;
  };
}

interface AnalysisPageProps {
  results: AnalysisResult[];
  analyzedFiles: FileMetadata[];
  selectedFileIds: Set<string>;
  viewMode: "all" | "selected";
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  results,
  analyzedFiles,
  selectedFileIds,
  viewMode,
}) => {
  if (results.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-8 py-12">
        <div className="p-8 border rounded text-center opacity-60">
          <p className="mb-2">No analysis results yet</p>
          <p className="text-sm">
            Upload and analyze some replay files in the Library tab to see results here.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-8 py-12">
      <h2 className="text-2xl font-bold mb-8">
        Analysis Results
        {selectedFileIds.size > 0
          ? ` (${selectedFileIds.size} games)`
          : analyzedFiles.length > 0
          ? ` (all ${analyzedFiles.length} games)`
          : ""}
      </h2>

      {/* Empty state when no selection */}
      {selectedFileIds.size === 0 && (
        <div className="p-8 border rounded text-center opacity-60 mb-12">
          <p className="mb-2">No games selected</p>
          <p className="text-sm">
            Select games from the Filtering tab and click &quot;Regenerate Analysis&quot;
            to see aggregate statistics for those games.
          </p>
        </div>
      )}

      {/* Summary Section - aggregate/time-series/comparative */}
      {selectedFileIds.size > 0 && (
        <div className="mb-12">
          <h3 className="text-lg font-medium opacity-60 mb-4">Summary</h3>
          <div className="space-y-6">
            {results
              .filter(
                (r) =>
                  r.fileId === "aggregate" ||
                  r.fileId === "time-series" ||
                  r.fileId === "comparative"
              )
              .map((result) => {
                const visualizerRegistry = getVisualizerRegistry();
                const visualizer = visualizerRegistry.getVisualizerForShape(
                  result.output.shape
                );
                return (
                  <div key={result.id}>
                    {visualizer ? (
                      visualizer.render(result.output)
                    ) : (
                      <pre className="text-xs">
                        {JSON.stringify(result.output, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Per-Game Section */}
      <details className="border-t pt-8" open>
        <summary className="cursor-pointer text-lg font-medium opacity-60 mb-6">
          Per-Game Results
        </summary>
        <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
          {(() => {
            const perGameResults = results.filter(
              (r) =>
                r.fileId !== "aggregate" &&
                r.fileId !== "time-series" &&
                r.fileId !== "comparative"
            );

            const groupedByFile = new Map<string, AnalysisResult[]>();
            for (const result of perGameResults) {
              const fileResults = groupedByFile.get(result.fileId) || [];
              fileResults.push(result);
              groupedByFile.set(result.fileId, fileResults);
            }

            const fileIdsToShow =
              viewMode === "selected" && selectedFileIds.size > 0
                ? Array.from(selectedFileIds)
                : Array.from(groupedByFile.keys());

            return fileIdsToShow.map((fileId) => {
              const fileResults = groupedByFile.get(fileId) || [];
              const fileMetadata = analyzedFiles.find((f) => f.id === fileId);

              return (
                <div key={fileId} className="border rounded p-6">
                  <div className="mb-4 pb-3 border-b">
                    <div className="font-medium mb-2">
                      {fileMetadata?.fileName || fileId}
                    </div>
                    {fileMetadata && (
                      <div className="text-sm opacity-60">
                        {fileMetadata.gameMetadata.players
                          .map((p) => p.connectCode || "Unknown")
                          .join(" vs ")}
                        {" • "}
                        {new Date(
                          fileMetadata.gameMetadata.timestamp
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {fileResults.map((result) => {
                      const visualizerRegistry = getVisualizerRegistry();
                      const visualizer =
                        visualizerRegistry.getVisualizerForShape(
                          result.output.shape
                        );
                      return (
                        <div key={result.id}>
                          {visualizer ? (
                            visualizer.render(result.output)
                          ) : (
                            <pre className="text-xs">
                              {JSON.stringify(result.output, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </details>
    </main>
  );
};
