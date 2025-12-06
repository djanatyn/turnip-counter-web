import { ReplayData } from "@slippilab/common";

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/// Parsed game record in memory.
export type GameRecord = {
  game: ReplayData;
  fileName: string;
};


export enum Page {
  /// Introduce the user to the tool and tell them what to expect.
  Intro,
  /// Add replay directories, scan for new files, run pending analysis, remove
  /// files from library.
  Library,
  /// Filter games by connect codes and manage selections
  Filtering,
  /// View analysis results and visualizations
  Analysis,
}

/// User preferences for persistent settings
export interface UserPreferences {
  hasSeenIntro: boolean;
  lastActiveTab?: Page;
}

/// Persistent session state.
export type State = {
  currentPage: Page;
   // which slippi tags are we using to filter players?
  matchingTags: string[];
  // // all parsed replays
  parsedReplays: GameRecord[];
};
