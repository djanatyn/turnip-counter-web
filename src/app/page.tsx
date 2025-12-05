"use client";

import { NextPage } from "next";
import { useState, useEffect } from "react";
import { getAnalyzerRegistry } from "@/analysis/registry";
import { getStorageManager } from "@/storage/db";
import { AnalysisPipeline } from "@/analysis/pipeline";
import { getVisualizerRegistry } from "@/visualizers/registry";
import { registerAllAnalyzers } from "@/analyzers";
import { registerAllVisualizers } from "@/visualizers";
import type { ProcessingProgress, AnalysisResult } from "@/analysis/types";

// https://stackoverflow.com/a/76993906
declare module "react" {
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
        webkitdirectory?: string;
    }
}

const Header: React.FC<{}> = () => {
    return (
        <header className="border-b p-6">
            <h1 className="text-3xl font-bold mb-1">Turnip Counter</h1>
            <p className="text-sm opacity-60">Analyze Melee Slippi Replays</p>
        </header>
    );
};

const Footer: React.FC<{}> = () => {
    return (
        <footer className="border-t p-6 text-center text-sm opacity-60">
            <p>
                Built by{" "}
                <a href="https://github.com/djanatyn">
                    djanatyn
                </a>
                {" • "}
                <a href="https://github.com/djanatyn/turnip-counter-web">
                    source
                </a>
            </p>
        </footer>
    );
};

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

const Body: React.FC<{}> = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [progress, setProgress] = useState<ProcessingProgress | null>(null);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [connectCodes, setConnectCodes] = useState<string>("");
    const [analyzedFiles, setAnalyzedFiles] = useState<FileMetadata[]>([]);
    const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
    const [filterText, setFilterText] = useState<string>("");
    const [viewMode, setViewMode] = useState<"all" | "selected">("all");

    // Initialize on mount
    useEffect(() => {
        registerAllAnalyzers();
        registerAllVisualizers();
        loadAnalyzedFiles();
    }, []);

    // Load analyzed files from storage
    const loadAnalyzedFiles = async () => {
        const storage = getStorageManager();
        const metadata = await storage.getAllFileMetadata();
        setAnalyzedFiles(metadata as any);
    };

    // Selection handlers
    const toggleFileSelection = (fileId: string) => {
        const newSelection = new Set(selectedFileIds);
        if (newSelection.has(fileId)) {
            newSelection.delete(fileId);
        } else {
            newSelection.add(fileId);
        }
        setSelectedFileIds(newSelection);
    };

    const selectAll = () => {
        const filtered = getFilteredFiles();
        setSelectedFileIds(new Set(filtered.map(f => f.id)));
    };

    const deselectAll = () => {
        setSelectedFileIds(new Set());
    };

    // Filter files
    const getFilteredFiles = () => {
        if (!filterText) return analyzedFiles;
        const lower = filterText.toLowerCase();
        return analyzedFiles.filter(f =>
            f.fileName.toLowerCase().includes(lower) ||
            f.gameMetadata.players.some(p => p.connectCode?.toLowerCase().includes(lower))
        );
    };

    // Delete selected files
    const deleteSelectedFiles = async () => {
        if (selectedFileIds.size === 0) return;
        if (!confirm(`Delete ${selectedFileIds.size} file(s) from analysis?`)) return;

        const storage = getStorageManager();
        for (const fileId of selectedFileIds) {
            await storage.deleteFile(fileId);
        }

        setSelectedFileIds(new Set());
        await loadAnalyzedFiles();
        await loadResults();
    };

    // Re-analyze selected files
    const reanalyzeSelectedFiles = async () => {
        if (selectedFileIds.size === 0) return;
        alert("Re-analysis not yet implemented - you can delete and re-upload files for now");
    };

    // Run aggregate/time-series/comparative analysis on filtered results
    const runAggregateAnalysis = async (
        resultsToAnalyze: AnalysisResult[],
        registry: any,
        shouldRun: boolean
    ): Promise<{
        aggregateResults: AnalysisResult[];
        timeSeriesResults: AnalysisResult[];
        comparativeResults: AnalysisResult[];
    }> => {
        const aggregateResults: AnalysisResult[] = [];
        const timeSeriesResults: AnalysisResult[] = [];
        const comparativeResults: AnalysisResult[] = [];

        if (!shouldRun) {
            return { aggregateResults, timeSeriesResults, comparativeResults };
        }

        // Run aggregate analyzers (Phase 2)
        const aggregateAnalyzers = registry.getAnalyzersByPhase("aggregate" as any);
        for (const analyzer of aggregateAnalyzers) {
            try {
                const output = await (analyzer as any).aggregate(resultsToAnalyze);
                aggregateResults.push({
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

        // Run time-series analyzers (Phase 3)
        const timeSeriesAnalyzers = registry.getAnalyzersByPhase("time-series" as any);
        for (const analyzer of timeSeriesAnalyzers) {
            try {
                const output = await (analyzer as any).analyzeTrends(resultsToAnalyze);
                timeSeriesResults.push({
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

        // Run comparative analyzers (Phase 4)
        const comparativeAnalyzers = registry.getAnalyzersByPhase("comparative" as any);
        for (const analyzer of comparativeAnalyzers) {
            try {
                const output = await (analyzer as any).compare(resultsToAnalyze, "character");
                comparativeResults.push({
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

        return { aggregateResults, timeSeriesResults, comparativeResults };
    };

    // Load all results from storage
    const loadResults = async () => {
        const storage = getStorageManager();
        const registry = getAnalyzerRegistry();

        // Load per-game results
        const perGameResults: AnalysisResult[] = [];
        const fileMetadata = await storage.getAllFileMetadata();

        for (const metadata of fileMetadata) {
            const fileResults = await storage.getAnalysisResultsForFile(metadata.id);
            perGameResults.push(...fileResults);
        }

        // Filter by selection if any games are selected
        let resultsToAnalyze = perGameResults;
        if (selectedFileIds.size > 0) {
            resultsToAnalyze = perGameResults.filter(
                (r) => selectedFileIds.has(r.fileId)
            );
        }

        // Run aggregate analysis on filtered results
        const { aggregateResults, timeSeriesResults, comparativeResults } =
            await runAggregateAnalysis(resultsToAnalyze, registry, selectedFileIds.size > 0);

        // Combine all results
        setResults([
            ...aggregateResults,
            ...timeSeriesResults,
            ...comparativeResults,
            ...perGameResults,
        ]);
    };

    const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        setFiles(selectedFiles);
    };

    const handleProcess = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setResults([]);

        const registry = getAnalyzerRegistry();
        const storage = getStorageManager();
        const pipeline = new AnalysisPipeline(registry, storage);

        // Subscribe to progress
        const unsubscribe = pipeline.onProgress(setProgress);

        try {
            // Parse connect codes (comma-separated)
            const targetPlayerCodes = connectCodes
                .split(",")
                .map((code) => code.trim().toUpperCase())
                .filter((code) => code.length > 0);

            await pipeline.processFiles(files, {
                batchSize: 10,
                skipAnalyzed: true,
                userContext:
                    targetPlayerCodes.length > 0
                        ? { targetPlayerCodes }
                        : undefined,
            });

            // Load per-game results
            const perGameResults: AnalysisResult[] = [];
            const fileMetadata = await storage.getAllFileMetadata();

            for (const metadata of fileMetadata) {
                const fileResults = await storage.getAnalysisResultsForFile(metadata.id);
                perGameResults.push(...fileResults);
            }

            // Filter by selection if any games are selected
            let resultsToAnalyze = perGameResults;
            if (selectedFileIds.size > 0) {
                resultsToAnalyze = perGameResults.filter(
                    (r) => selectedFileIds.has(r.fileId)
                );
            }

            // Run aggregate analysis on filtered results
            const { aggregateResults, timeSeriesResults, comparativeResults } =
                await runAggregateAnalysis(resultsToAnalyze, registry, selectedFileIds.size > 0);

            // Combine all results: aggregate/time-series/comparative first, then per-game
            setResults([
                ...aggregateResults,
                ...timeSeriesResults,
                ...comparativeResults,
                ...perGameResults,
            ]);

            // Reload analyzed files list
            await loadAnalyzedFiles();
        } catch (error) {
            console.error("Processing failed:", error);
        } finally {
            unsubscribe();
            setIsProcessing(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto px-8 py-12">
            <p className="text-sm opacity-60 mb-12">
                All replays are processed locally in your browser - replays never leave your computer.
            </p>

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
                    onChange={(e) => setConnectCodes(e.target.value)}
                    className="w-full px-4 py-3 rounded"
                />
                <p className="mt-2 text-sm opacity-60">
                    Leave empty to analyze all players, or enter your code to filter results.
                </p>
            </div>

            {/* File Selection */}
            <div className="mb-8">
                <label className="block font-medium mb-3">
                    Select Replay Files (.slp)
                </label>
                <input
                    type="file"
                    multiple
                    accept=".slp"
                    onChange={handleFileSelection}
                    className="block w-full rounded p-3"
                />
                <p className="mt-2 text-sm opacity-60">
                    {files.length} file(s) selected
                </p>
            </div>

            {/* Process Button */}
            <button
                onClick={handleProcess}
                disabled={isProcessing || files.length === 0}
                className="px-8 py-3 rounded text-base"
            >
                {isProcessing ? "Processing..." : "Analyze Replays"}
            </button>

            {/* Progress */}
            {progress && (
                <div className="mt-8 p-4 border rounded">
                    <div className="text-sm mb-3">
                        Progress: {progress.processedFiles} / {progress.totalFiles}
                    </div>
                    <div className="w-full h-2 rounded" style={{backgroundColor: 'var(--progress-bg)'}}>
                        <div
                            className="h-2 rounded"
                            style={{
                                backgroundColor: 'var(--progress-fill)',
                                width: `${
                                    (progress.processedFiles / progress.totalFiles) * 100
                                }%`,
                            }}
                        />
                    </div>
                    {progress.currentFile && (
                        <div className="mt-2 text-xs opacity-60">
                            {progress.currentFile} - {progress.currentAnalyzer}
                        </div>
                    )}
                    {progress.errors.length > 0 && (
                        <div className="mt-4">
                            <div className="text-sm font-medium mb-2">
                                {progress.errors.length} error(s):
                            </div>
                            <div className="max-h-40 overflow-y-auto text-xs">
                                {progress.errors.map((err, idx) => (
                                    <div key={idx} className="mb-1">
                                        {err.fileName}: {err.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Game Library */}
            {analyzedFiles.length > 0 && (
                <div className="mt-16 border-t pt-12">
                    <h2 className="text-2xl font-bold mb-6">Game Library</h2>
                    <p className="mb-6 opacity-60">
                        {getFilteredFiles().length} of {analyzedFiles.length} games
                        {selectedFileIds.size > 0 && ` • ${selectedFileIds.size} selected`}
                    </p>

                    {/* Filter and Actions */}
                    <div className="mb-6 space-y-4">
                        <input
                            type="text"
                            placeholder="Filter by filename or connect code..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full px-4 py-3 rounded"
                        />

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={selectAll}
                                className="px-4 py-2 rounded"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                className="px-4 py-2 rounded"
                            >
                                Deselect All
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === "all" ? "selected" : "all")}
                                disabled={selectedFileIds.size === 0}
                                className="px-4 py-2 rounded"
                            >
                                {viewMode === "all" ? "View Selected Only" : "View All"}
                            </button>
                            <button
                                onClick={deleteSelectedFiles}
                                disabled={selectedFileIds.size === 0}
                                className="px-4 py-2 rounded"
                            >
                                Delete Selected ({selectedFileIds.size})
                            </button>
                            <button
                                onClick={loadResults}
                                disabled={analyzedFiles.length === 0}
                                className="px-4 py-2 rounded"
                            >
                                Regenerate Analysis ({selectedFileIds.size > 0 ? selectedFileIds.size : 'all'} games)
                            </button>
                        </div>
                    </div>

                    {/* File List - Scrollable */}
                    <div className="border rounded max-h-96 overflow-y-auto">
                        {getFilteredFiles().map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-4 p-4 border-b last:border-b-0"
                                style={{backgroundColor: selectedFileIds.has(file.id) ? 'var(--input-bg)' : 'transparent'}}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedFileIds.has(file.id)}
                                    onChange={() => toggleFileSelection(file.id)}
                                    className="w-5 h-5"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium mb-1 truncate">{file.fileName}</div>
                                    <div className="text-sm opacity-60">
                                        {file.gameMetadata.players.map(p => p.connectCode || "Unknown").join(" vs ")}
                                        {" • "}
                                        {new Date(file.gameMetadata.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-bold mb-8">
                        Analysis Results
                        {selectedFileIds.size > 0
                            ? ` (${selectedFileIds.size} games)`
                            : analyzedFiles.length > 0 ? ` (all ${analyzedFiles.length} games)` : ''}
                    </h2>

                    {/* Empty state when no selection */}
                    {selectedFileIds.size === 0 && (
                        <div className="p-8 border rounded text-center opacity-60">
                            <p className="mb-2">No games selected</p>
                            <p className="text-sm">
                                Select games from the Game Library above and click &quot;Regenerate Analysis&quot;
                                to see aggregate statistics for those games.
                            </p>
                        </div>
                    )}

                    {/* Summary Section - only show if games selected */}
                    {selectedFileIds.size > 0 && (
                        <div className="mb-12">
                            <h3 className="text-lg font-medium opacity-60 mb-4">Summary</h3>
                        <div className="space-y-6">
                            {results
                                .filter((r) =>
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
                                                <pre className="text-xs">{JSON.stringify(result.output, null, 2)}</pre>
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
                                // Group results by fileId
                                const perGameResults = results.filter((r) =>
                                    r.fileId !== "aggregate" &&
                                    r.fileId !== "time-series" &&
                                    r.fileId !== "comparative"
                                );

                                // Group by fileId
                                const groupedByFile = new Map<string, AnalysisResult[]>();
                                for (const result of perGameResults) {
                                    const fileResults = groupedByFile.get(result.fileId) || [];
                                    fileResults.push(result);
                                    groupedByFile.set(result.fileId, fileResults);
                                }

                                // Filter based on viewMode
                                const fileIdsToShow = viewMode === "selected" && selectedFileIds.size > 0
                                    ? Array.from(selectedFileIds)
                                    : Array.from(groupedByFile.keys());

                                return fileIdsToShow.map((fileId) => {
                                    const fileResults = groupedByFile.get(fileId) || [];
                                    const fileMetadata = analyzedFiles.find(f => f.id === fileId);

                                    return (
                                        <div key={fileId} className="border rounded p-6">
                                            {/* File Header */}
                                            <div className="mb-4 pb-3 border-b">
                                                <div className="font-medium mb-2">{fileMetadata?.fileName || fileId}</div>
                                                {fileMetadata && (
                                                    <div className="text-sm opacity-60">
                                                        {fileMetadata.gameMetadata.players.map(p => p.connectCode || "Unknown").join(" vs ")}
                                                        {" • "}
                                                        {new Date(fileMetadata.gameMetadata.timestamp).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* File Results */}
                                            <div className="space-y-4">
                                                {fileResults.map((result) => {
                                                    const visualizerRegistry = getVisualizerRegistry();
                                                    const visualizer = visualizerRegistry.getVisualizerForShape(
                                                        result.output.shape
                                                    );
                                                    return (
                                                        <div key={result.id}>
                                                            {visualizer ? (
                                                                visualizer.render(result.output)
                                                            ) : (
                                                                <pre className="text-xs">{JSON.stringify(result.output, null, 2)}</pre>
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
                </div>
            )}
        </main>
    );
};

const TurnipCounter: NextPage = () => {
    return (
        <main className="min-h-screen flex flex-col items-center">
            <Header />
            <Body />
            <Footer />
        </main>
    );
};

export default TurnipCounter;
