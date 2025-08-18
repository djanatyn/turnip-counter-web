import { parseReplay } from "@slippilab/parser";
import { GameRecord, Result } from "@/types";

// attempt to parse an slp replay from a File entry
export const parseReplayFile = (fileName: string, buffer: ArrayBuffer): Result<GameRecord, string> => {
  const unknownError: Result<GameRecord, string> = {
    ok: false,
    error: "unknown error occurred",
  };
  try {
    const game = parseReplay(undefined, new Uint8Array(buffer));
    return game
      ? { ok: true, value: { game, fileName } }
      : unknownError;
  } catch (e: unknown) {
    return (e instanceof Error)
      ? { ok: false, error: e.message }
      : unknownError;
  }
};
