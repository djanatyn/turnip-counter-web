"use client";

import React from "react";
import type { ProcessingProgress } from "@/analysis/types";

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

interface LibraryPageProps {
  files: File[];
  progress: ProcessingProgress | null;
  isProcessing: boolean;
  analyzedFiles: FileMetadata[];
  selectedFileIds: Set<string>;
  connectCodes: string;
  filterText: string;
  viewMode: "all" | "selected";
  onFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  onToggleSelection: (fileId: string) => void;
  onConnectCodesChange: (codes: string) => void;
  onFilterTextChange: (text: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleViewMode: () => void;
  onDeleteSelected: () => void;
  onRegenerateAnalysis: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  files,
  progress,
  isProcessing,
  analyzedFiles,
  selectedFileIds,
  connectCodes,
  filterText,
  viewMode,
  onFileSelection,
  onProcess,
  onToggleSelection,
  onConnectCodesChange,
  onFilterTextChange,
  onSelectAll,
  onDeselectAll,
  onToggleViewMode,
  onDeleteSelected,
  onRegenerateAnalysis,
}) => {
  // Filter files based on search text
  const getFilteredFiles = () => {
    if (!filterText) return analyzedFiles;
    const lower = filterText.toLowerCase();
    return analyzedFiles.filter(
      (f) =>
        f.fileName.toLowerCase().includes(lower) ||
        f.gameMetadata.players.some((p) =>
          p.connectCode?.toLowerCase().includes(lower)
        )
    );
  };

  const filteredFiles = getFilteredFiles();
  const displayFiles =
    viewMode === "selected" && selectedFileIds.size > 0
      ? filteredFiles.filter((f) => selectedFileIds.has(f.id))
      : filteredFiles;
  return (
    <main className="max-w-4xl mx-auto px-8 py-12">
      <p className="text-sm opacity-60 mb-12">
        Upload .slp replay files to analyze. Filter and select games to generate aggregate statistics.
      </p>

      {/* File Upload Section */}
      <div className="mb-8">
        <label className="block font-medium mb-3">
          Select Replay Files (.slp)
        </label>
        <input
          type="file"
          multiple
          accept=".slp"
          onChange={onFileSelection}
          className="block w-full rounded p-3"
        />
        <p className="mt-2 text-sm opacity-60">
          {files.length} file(s) selected
        </p>
      </div>

      {/* Connect Code Input */}
      <div className="mb-8">
        <label htmlFor="connectCodes" className="block font-medium mb-3">
          Your Slippi Connect Code (optional)
        </label>
        <input
          type="text"
          id="connectCodes"
          placeholder="e.g., ABCD#123"
          value={connectCodes}
          onChange={(e) => onConnectCodesChange(e.target.value)}
          className="w-full px-4 py-3 rounded"
        />
        <p className="mt-2 text-sm opacity-60">
          Filter results to only show games with this connect code.
        </p>
      </div>

      {/* Process Button */}
      <button
        onClick={onProcess}
        disabled={isProcessing || files.length === 0}
        className="px-8 py-3 rounded text-base"
      >
        {isProcessing ? "Processing..." : "Analyze Replays"}
      </button>

      {/* Progress */}
      {progress && (
        <div className="mt-8 p-4 border rounded">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing files...</span>
              <span>
                {progress.processedFiles} / {progress.totalFiles}
              </span>
            </div>
            <div className="w-full h-2 rounded" style={{backgroundColor: 'var(--progress-bg)'}}>
              <div
                className="h-2 rounded transition-all"
                style={{
                  backgroundColor: 'var(--progress-fill)',
                  width: `${(progress.processedFiles / progress.totalFiles) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Game Library List */}
      {analyzedFiles.length > 0 && (
        <div className="mt-16 border-t pt-12">
          <h2 className="text-2xl font-bold mb-6">Game Library</h2>

          <p className="mb-6 opacity-60">
            {filteredFiles.length} of {analyzedFiles.length} games
            {selectedFileIds.size > 0 && ` • ${selectedFileIds.size} selected`}
          </p>

          {/* Filter Controls */}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Filter by filename or connect code..."
              value={filterText}
              onChange={(e) => onFilterTextChange(e.target.value)}
              className="w-full px-4 py-3 rounded"
            />

            <div className="flex flex-wrap gap-3">
              <button onClick={onSelectAll} className="px-4 py-2 rounded">
                Select All
              </button>
              <button onClick={onDeselectAll} className="px-4 py-2 rounded">
                Deselect All
              </button>
              <button
                onClick={onToggleViewMode}
                disabled={selectedFileIds.size === 0}
                className="px-4 py-2 rounded"
              >
                {viewMode === "all" ? "View Selected Only" : "View All"}
              </button>
              <button
                onClick={onDeleteSelected}
                disabled={selectedFileIds.size === 0}
                className="px-4 py-2 rounded"
              >
                Delete Selected ({selectedFileIds.size})
              </button>
              <button
                onClick={onRegenerateAnalysis}
                disabled={analyzedFiles.length === 0}
                className="px-4 py-2 rounded"
              >
                Regenerate Analysis (
                {selectedFileIds.size > 0 ? selectedFileIds.size : "all"} games)
              </button>
            </div>
          </div>

          {/* Filtered File List */}
          <div className="border rounded max-h-96 overflow-y-auto">
            {displayFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 border-b last:border-b-0"
                style={{
                  backgroundColor: selectedFileIds.has(file.id)
                    ? "var(--input-bg)"
                    : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFileIds.has(file.id)}
                  onChange={() => onToggleSelection(file.id)}
                  className="w-5 h-5"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1 truncate">{file.fileName}</div>
                  <div className="text-sm opacity-60">
                    {file.gameMetadata.players
                      .map((p) => p.connectCode || "Unknown")
                      .join(" vs ")}
                    {" • "}
                    {new Date(file.gameMetadata.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
};
