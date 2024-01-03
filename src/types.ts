// @ts-ignore experimental urlImport feature from next.js
import { Game } from "@slippilab/parser/dist/index.js";

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type GameRecord = {
  game: Game;
  fileName: string;
};

export enum PeachItem {
  // [1,2,3,4].includes(misc[1])
  NormalTurnip,
  // misc[1] === 5
  WinkyTurnip,
  // misc[1] === 6
  DotEyesTurnip,
  // misc[1] === 7
  StitchfaceTurnip,
  Beamsword,
  Bobomb,
  MrSaturn,
}

export type ItemData = {
  kind: PeachItem;
  frame: number;
  owner: string; // TODO
};

export enum CounterStep {
  GetSlippiTag,
  LoadSLPFiles,
  AnalyzeReplays,
  DisplayResults,
}

export type State = {
  step: CounterStep;
  // which slippi tags are we using to filter players?
  matchingTags: string[];
  // all parsed replays
  parsedReplays: GameRecord[];
  logMessages: string[];
  gameRecords: GameRecord[];
};

export const DEFAULT_STATE: State = {
  step: CounterStep.GetSlippiTag,
  matchingTags: [],
  parsedReplays: [],
  logMessages: [],
  gameRecords: [],
};
