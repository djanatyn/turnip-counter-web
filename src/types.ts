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
  /// Upload files, filter games, and manage selections
  Library,
  /// View analysis results and visualizations
  Analysis,
  /// Export analysis data as JSON
  Export,
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
