"use client";

import React, { useState } from "react";
import { ExportType, type ExportData, type GameExport } from "@/export/types";
import type { AnalysisResult } from "@/analysis/types";
import { getStorageManager } from "@/storage/db";
import { getAnalyzerRegistry } from "@/analysis/registry";

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

interface ExportPageProps {
  analyzedFiles: FileMetadata[];
  selectedFileIds: Set<string>;
  filterText: string;
  connectCodes: string;
}

export const ExportPage: React.FC<ExportPageProps> = ({
  analyzedFiles,
  selectedFileIds,
  filterText,
  connectCodes,
}) => {
  const [exportType, setExportType] = useState<ExportType>(
    ExportType.SelectedGames
  );
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      type: ExportType.SingleGame,
      label: "Single Game",
      description: "Export one game with all its analysis",
      disabled: selectedFileIds.size !== 1,
      disabledReason:
        selectedFileIds.size === 0
          ? "Select exactly one game from Library"
          : selectedFileIds.size > 1
          ? `${selectedFileIds.size} games selected (need exactly 1)`
          : undefined,
    },
    {
      type: ExportType.SelectedGames,
      label: "Selected Games",
      description: "Export selected games with per-game analysis",
      disabled: selectedFileIds.size === 0,
      disabledReason:
        selectedFileIds.size === 0 ? "Select games from Library first" : undefined,
    },
    {
      type: ExportType.AggregateOnly,
      label: "Aggregate Analysis",
      description: "Export only aggregate statistics for selected games",
      disabled: selectedFileIds.size === 0,
      disabledReason:
        selectedFileIds.size === 0 ? "Select games from Library first" : undefined,
    },
    {
      type: ExportType.FullLibrary,
      label: "Full Library",
      description: "Export all games and all analysis",
      disabled: analyzedFiles.length === 0,
      disabledReason:
        analyzedFiles.length === 0 ? "No games analyzed yet" : undefined,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const storage = getStorageManager();
      const registry = getAnalyzerRegistry();

      const exportData: ExportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportType,
          formatVersion: "1.0.0",
          gameCount: 0,
        },
      };

      // Determine which files to export
      let fileIdsToExport: string[] = [];
      switch (exportType) {
        case ExportType.SingleGame:
        case ExportType.SelectedGames:
        case ExportType.AggregateOnly:
          fileIdsToExport = Array.from(selectedFileIds);
          break;
        case ExportType.FullLibrary:
          fileIdsToExport = analyzedFiles.map((f) => f.id);
          break;
      }

      exportData.metadata.gameCount = fileIdsToExport.length;

      // Add selection metadata if applicable
      if (
        exportType === ExportType.SelectedGames ||
        exportType === ExportType.AggregateOnly ||
        exportType === ExportType.SingleGame
      ) {
        exportData.metadata.selection = {
          fileIds: fileIdsToExport,
          filterText: filterText || undefined,
          connectCodes: connectCodes
            ? connectCodes.split(",").map((c) => c.trim())
            : undefined,
        };
      }

      // Export per-game data (except for aggregate-only)
      if (exportType !== ExportType.AggregateOnly) {
        exportData.games = [];
        for (const fileId of fileIdsToExport) {
          const metadata = analyzedFiles.find((f) => f.id === fileId);
          if (!metadata) continue;

          const analysisResults = await storage.getAnalysisResultsForFile(fileId);
          exportData.games.push({
            metadata: metadata as any,
            analysisResults,
          });
        }
      }

      // Run and export aggregate analysis if we have selections
      if (
        (exportType === ExportType.SelectedGames ||
          exportType === ExportType.AggregateOnly) &&
        fileIdsToExport.length > 0
      ) {
        // Load per-game results for selected files
        const perGameResults: AnalysisResult[] = [];
        for (const fileId of fileIdsToExport) {
          const results = await storage.getAnalysisResultsForFile(fileId);
          perGameResults.push(...results);
        }

        // Run aggregate analyzers
        exportData.aggregateResults = [];
        exportData.timeSeriesResults = [];
        exportData.comparativeResults = [];

        const aggregateAnalyzers = registry.getAnalyzersByPhase("aggregate" as any);
        for (const analyzer of aggregateAnalyzers) {
          try {
            const output = await (analyzer as any).aggregate(perGameResults);
            exportData.aggregateResults.push({
              id: `aggregate::${analyzer.metadata.id}`,
              fileId: "aggregate",
              analyzerId: analyzer.metadata.id,
              analyzerVersion: analyzer.metadata.version,
              analyzedAt: new Date().toISOString(),
              output,
              processingTime: 0,
            });
          } catch (error) {
            console.error(`Aggregate analyzer ${analyzer.metadata.id} failed:`, error);
          }
        }

        const timeSeriesAnalyzers = registry.getAnalyzersByPhase("time-series" as any);
        for (const analyzer of timeSeriesAnalyzers) {
          try {
            const output = await (analyzer as any).analyzeTrends(perGameResults);
            exportData.timeSeriesResults.push({
              id: `time-series::${analyzer.metadata.id}`,
              fileId: "time-series",
              analyzerId: analyzer.metadata.id,
              analyzerVersion: analyzer.metadata.version,
              analyzedAt: new Date().toISOString(),
              output,
              processingTime: 0,
            });
          } catch (error) {
            console.error(`Time-series analyzer ${analyzer.metadata.id} failed:`, error);
          }
        }

        const comparativeAnalyzers = registry.getAnalyzersByPhase("comparative" as any);
        for (const analyzer of comparativeAnalyzers) {
          try {
            const output = await (analyzer as any).compare(perGameResults, "character");
            exportData.comparativeResults.push({
              id: `comparative::${analyzer.metadata.id}`,
              fileId: "comparative",
              analyzerId: analyzer.metadata.id,
              analyzerVersion: analyzer.metadata.version,
              analyzedAt: new Date().toISOString(),
              output,
              processingTime: 0,
            });
          } catch (error) {
            console.error(`Comparative analyzer ${analyzer.metadata.id} failed:`, error);
          }
        }
      }

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `turnip-counter-export-${exportType}-${timestamp}.json`;

      // Download JSON
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFiles = analyzedFiles.filter((f) => selectedFileIds.has(f.id));

  return (
    <main className="max-w-4xl mx-auto px-8 py-12">
      <h2 className="text-2xl font-bold mb-4">Export Analysis Data</h2>
      <p className="text-sm opacity-60 mb-12">
        Export your analysis data as JSON for backup, sharing, or external processing.
      </p>

      {/* Export Type Selection */}
      <div className="mb-12">
        <h3 className="text-lg font-medium mb-4">Export Type</h3>
        <div className="grid gap-4">
          {exportOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => !option.disabled && setExportType(option.type)}
              disabled={option.disabled}
              className={`
                p-4 rounded border-2 text-left transition-all
                ${
                  exportType === option.type
                    ? "border-current"
                    : "border-transparent opacity-70"
                }
                ${option.disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-100 hover:border-opacity-30 hover:border-current"}
              `}
            >
              <div className="font-medium mb-1">{option.label}</div>
              <div className="text-sm opacity-60">
                {option.disabled && option.disabledReason
                  ? option.disabledReason
                  : option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {selectedFileIds.size > 0 && (
        <div className="mb-12 p-4 border rounded">
          <h3 className="font-medium mb-3">
            Current Selection ({selectedFileIds.size} game{selectedFileIds.size !== 1 ? "s" : ""})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div key={file.id} className="text-sm">
                <div className="font-medium truncate">{file.fileName}</div>
                <div className="opacity-60">
                  {file.gameMetadata.players
                    .map((p) => p.connectCode || "Unknown")
                    .join(" vs ")}{" "}
                  • {new Date(file.gameMetadata.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Preview */}
      <div className="mb-12 p-4 border rounded">
        <h3 className="font-medium mb-3">Export Preview</h3>
        <div className="text-sm space-y-1 opacity-80">
          <div>
            <span className="opacity-60">Type:</span> {exportType}
          </div>
          <div>
            <span className="opacity-60">Games:</span>{" "}
            {exportType === ExportType.FullLibrary
              ? analyzedFiles.length
              : selectedFileIds.size}
          </div>
          {(exportType === ExportType.SelectedGames ||
            exportType === ExportType.SingleGame) && (
            <div>
              <span className="opacity-60">Includes:</span> Per-game analysis results
            </div>
          )}
          {(exportType === ExportType.AggregateOnly ||
            exportType === ExportType.SelectedGames) &&
            selectedFileIds.size > 0 && (
              <div>
                <span className="opacity-60">Includes:</span> Aggregate, time-series,
                and comparative analysis
              </div>
            )}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={
          isExporting ||
          exportOptions.find((o) => o.type === exportType)?.disabled
        }
        className="px-8 py-3 rounded text-base font-medium"
      >
        {isExporting ? "Exporting..." : "Download JSON Export"}
      </button>

      {/* Help Text */}
      <div className="mt-12 p-4 border rounded text-sm opacity-60">
        <p className="mb-2">
          <strong>Note:</strong> Exports include all metadata and analysis results in
          JSON format.
        </p>
        <p>
          To select games for export, go to the Library page and use the checkboxes
          to select specific games.
        </p>
      </div>
    </main>
  );
};
