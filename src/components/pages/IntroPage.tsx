"use client";

import React from "react";

interface IntroPageProps {
  onDismiss: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({ onDismiss }) => {
  return (
    <main className="max-w-4xl mx-auto px-8 py-12">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Welcome to Turnip Counter</h2>
          <p className="text-lg opacity-80 mb-6">
            Analyze your Super Smash Bros. Melee Slippi replays to gain insights
            into your gameplay.
          </p>
          <p className="opacity-60">
            All replays are processed locally in your browser - replays never
            leave your computer.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Features</h3>
          <ul className="space-y-2 opacity-80">
            <li>• Filter games by connect code or player</li>
            <li>• Track L-cancel success rates over time</li>
            <li>• Analyze Peach turnip pull statistics</li>
            <li>• Compare performance across matchups</li>
            <li>• View aggregate statistics and trends</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
          <ol className="space-y-2 opacity-80">
            <li>1. Go to the <strong>Library</strong> tab to parse and analyze local .slp files and select specific games</li>
            <li>2. View results in the <strong>Analysis</strong> tab</li>
          </ol>
        </section>

        <div className="pt-6 border-t">
          <button
            onClick={onDismiss}
            className="px-8 py-3 rounded text-base font-medium"
          >
            Don&apos;t show this again
          </button>
        </div>
      </div>
    </main>
  );
};
