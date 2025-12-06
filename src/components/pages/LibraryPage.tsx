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
  onFileSelection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  onToggleSelection: (fileId: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  files,
  progress,
  isProcessing,
  analyzedFiles,
  selectedFileIds,
  onFileSelection,
  onProcess,
  onToggleSelection,
}) => {
  return (
    <main className="max-w-4xl mx-auto px-8 py-12">
      <p className="text-sm opacity-60 mb-12">
        Upload .slp replay files to analyze. All processing happens locally.
      </p>

      {/* File Selection */}
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
            {analyzedFiles.length} games analyzed
            {selectedFileIds.size > 0 && ` • ${selectedFileIds.size} selected`}
          </p>

          <div className="border rounded max-h-96 overflow-y-auto">
            {analyzedFiles.map((file) => (
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
