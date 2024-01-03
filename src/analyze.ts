import { Game } from "@slippilab/parser/dist/index.js";
import { GameRecord, Result } from "@/types";

// attempt to parse an slp replay from a File entry
export const parseReplay = async (file: File): Promise<Result<GameRecord, string>> => {
  const unknownError: Result<GameRecord, string> = {
    ok: false,
    error: "unknown error occurred",
  };
  const contents = await file.arrayBuffer();
  try {
    const game = new Game(contents);
    return game
      ? { ok: true, value: { game, fileName: file.name } }
      : unknownError;
  } catch (e: unknown) {
    return (e instanceof Error)
      ? { ok: false, error: e.message }
      : unknownError;
  }
};
