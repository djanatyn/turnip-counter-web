import { ReplayData } from "@slippilab/common";

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type GameRecord = {
  game: ReplayData;
  fileName: string;
};
