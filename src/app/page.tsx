"use client";

import { NextPage } from "next";
import { useState, useEffect } from "react";
import { Page } from "@/types";
import { getAnalyzerRegistry } from "@/analysis/registry";
import { getStorageManager } from "@/storage/db";
import { AnalysisPipeline } from "@/analysis/pipeline";
import { registerAllAnalyzers } from "@/analyzers";
import { registerAllVisualizers } from "@/visualizers";
import type { ProcessingProgress, AnalysisResult } from "@/analysis/types";
import { TabNavigation } from "@/components/TabNavigation";
import { IntroPage } from "@/components/pages/IntroPage";
import { LibraryPage } from "@/components/pages/LibraryPage";
import { AnalysisPage } from "@/components/pages/AnalysisPage";

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
    // Navigation state
    const [currentPage, setCurrentPage] = useState<Page>(Page.Library);
    const [showIntro, setShowIntro] = useState(true);

    // Shared state across all pages
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
        loadUserPreferences();
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

    // Load user preferences on mount
    const loadUserPreferences = async () => {
        const storage = getStorageManager();
        const hasSeenIntro = await storage.getUserPreference<boolean>("hasSeenIntro");

        if (hasSeenIntro === true) {
            setShowIntro(false);
            setCurrentPage(Page.Library);
        } else {
            setShowIntro(true);
            setCurrentPage(Page.Intro);
        }
    };

    // Handle intro dismissal
    const handleDismissIntro = async () => {
        const storage = getStorageManager();
        await storage.setUserPreference("hasSeenIntro", true);
        setShowIntro(false);
        setCurrentPage(Page.Library);
    };

    // Handle page navigation
    const handlePageChange = (page: Page) => {
        setCurrentPage(page);
    };

    // Render current page based on navigation state
    const renderCurrentPage = () => {
        switch (currentPage) {
            case Page.Intro:
                return <IntroPage onDismiss={handleDismissIntro} />;

            case Page.Library:
                return (
                    <LibraryPage
                        files={files}
                        progress={progress}
                        isProcessing={isProcessing}
                        analyzedFiles={analyzedFiles}
                        selectedFileIds={selectedFileIds}
                        connectCodes={connectCodes}
                        filterText={filterText}
                        viewMode={viewMode}
                        onFileSelection={handleFileSelection}
                        onProcess={handleProcess}
                        onToggleSelection={toggleFileSelection}
                        onConnectCodesChange={setConnectCodes}
                        onFilterTextChange={setFilterText}
                        onSelectAll={selectAll}
                        onDeselectAll={deselectAll}
                        onToggleViewMode={() => setViewMode(viewMode === "all" ? "selected" : "all")}
                        onDeleteSelected={deleteSelectedFiles}
                        onRegenerateAnalysis={loadResults}
                    />
                );

            case Page.Analysis:
                return (
                    <AnalysisPage
                        results={results}
                        analyzedFiles={analyzedFiles}
                        selectedFileIds={selectedFileIds}
                        viewMode={viewMode}
                    />
                );

            default:
                return <div>Unknown page</div>;
        }
    };

    return (
        <div className="flex flex-1 min-h-0">
            <TabNavigation
                currentPage={currentPage}
                showIntro={showIntro}
                onPageChange={handlePageChange}
            />
            <div className="flex-1 overflow-auto">
                {renderCurrentPage()}
            </div>
        </div>
    );
};

const TurnipCounter: NextPage = () => {
    return (
        <main className="min-h-screen flex flex-col">
            <Header />
            <Body />
            <Footer />
        </main>
    );
};

export default TurnipCounter;
