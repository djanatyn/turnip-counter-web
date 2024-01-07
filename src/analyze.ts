import { Game } from "@slippilab/parser/dist/index.js";
import { GameRecord, Result } from "@/types";

// attempt to parse an slp replay from a File entry
export const parseReplay = (fileName: string, file: ArrayBuffer): Result<GameRecord, string> => {
  const unknownError: Result<GameRecord, string> = {
    ok: false,
    error: "unknown error occurred",
  };
  try {
    const game = new Game(file);
    return game
      ? { ok: true, value: { game, fileName } }
      : unknownError;
  } catch (e: unknown) {
    return (e instanceof Error)
      ? { ok: false, error: e.message }
      : unknownError;
  }
};
