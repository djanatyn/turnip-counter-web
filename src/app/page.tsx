"use client";

/* ux flow:
 * - user is prompted to insert the connect code they want to analyze
 * - user is prompt to select multiple slp files or directories
 *   if any replays fail to be processed, an error is displayed
 *   (we parse + analyze the individual replays at this step)
 *  - processed replays can be removed by clicking an X
 *  - when the user is done, they can click on an "analyze!" button
 * - user is sent to a loading screen, all analysis from individual files are combined
 * - user is sent to a results page, with the option to download the results */

/* downloading result ideas:
 * - allow downloading raw JSON of analysis
 * - https://www.npmjs.com/package/use-react-screenshot */

/* ideas of analysis to include:
 * - count of all items pulls across all replays, matching one or more player tags
 * - item pulls broken down into categories (stitchface, beamsword, bombs) showing the count across all replays and the expected value,
 * - consecutive item pull highscores (you pulled a stitchface 3x in a row on friday the 13th 2023)
 * - comparison of your percentage vs expected value is a must to see if you are unlucky. could you add a hit percentage? like how many turnips did you hit
 * - average lifespan of turnips?
 * - you could add a p-value with a binomial t-test to see if a player is getting significantly more stitches than expected?
 * - maybe add a player breakdown of how many smash throws, dash throws, zdrops, regular throws if possible?
 * - a "snipes" where a player died immediately after being hit by a weak turnip (most of those would be from off stage snipes). That might not work z-drop nair would probably count as a snipe then */

import { NextPage } from "next";
import { useEffect, useRef, useState } from "react";
// @ts-ignore experimental urlImport feature from next.js
import { Game } from "https://cdn.skypack.dev/@slippilab/parser";

// https://stackoverflow.com/a/76993906
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type GameRecord = {
  game: Game;
  fileName: string;
};

enum CounterStep {
  GetSlippiTag,
  LoadSLPFiles,
  AnalyzeReplays,
  DisplayResults,
}

type State = {
  step: CounterStep;
  // which slippi tags are we using to filter players?
  matchingTags: string[];
  // all parsed replays
  parsedReplays: GameRecord[];
  logMessages: string[];
  gameRecords: GameRecord[];
};

const DEFAULT_STATE: State = {
  step: CounterStep.GetSlippiTag,
  matchingTags: [],
  parsedReplays: [],
  logMessages: [],
  gameRecords: [],
};

// attempt to parse an slp replay from a File entry
const parseReplay = async (file: File): Promise<Result<GameRecord, string>> => {
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

const GetSlippiTag: React.FC<{
  tags: string[];
  addTag: (newTag: string) => void;
  removeTag: (removed: string) => void;
  nextStep: () => void;
}> = ({ tags, addTag, removeTag, nextStep }) => {
  const [currentText, setCurrentText] = useState<string>("");

  const addTagDisabled: boolean = tags.includes(currentText) ||
    currentText === "";
  const nextStepDisabled: boolean = tags.length == 0;

  // show a placeholder when user has no input
  const placeholder: string | undefined = tags.length == 0
    ? "FIZZI#36"
    : undefined;

  return (
    <div className="flex flex-col gap-2 w-full items-center">
      <p className="text-xl font-bold">
        To get started, we need to know what which players to analyze item pulls
        for.
      </p>
      <p>Include Peach item pulls by:{"  "}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!addTagDisabled) {
            addTag(currentText);
            setCurrentText("");
          }
        }}
      >
        <input
          type="text"
          className="border border-b p-1"
          onChange={({ target: { value } }) => setCurrentText(value)}
          value={currentText}
          placeholder={placeholder}
        />
        <button
          className={`bg-pink-500 p-2 rounded-md text-white font-bold mx-2 ${
            addTagDisabled ? "opacity-50" : ""
          }`}
          disabled={addTagDisabled}
          onClick={() => {
            if (!addTagDisabled) {
              addTag(currentText);
              setCurrentText("");
            }
          }}
        >
          Add
        </button>
      </form>
      <TagDisplay
        tags={tags}
        removeTag={removeTag}
      />
      <button
        className={`bg-pink-500 p-2 rounded-md text-white font-bold mx-2 ${
          nextStepDisabled ? "opacity-50" : ""
        }`}
        disabled={nextStepDisabled}
        onClick={() => nextStep(tags)}
      >
        Select Replays
      </button>
    </div>
  );
};

const TagDisplay: React.FC<{
  tags: string[];
  removeTag: (tag: string) => void;
}> = ({ tags, removeTag }) => {
  return (
    <div>
      <ul className="py-4 text-lg font-mono w-full">
        {tags.map((tag, idx) => (
          <li
            key={`tag-${tag}`}
            className="group hover:bg-pink-100 flex flex-row items-center justify-between w-full"
          >
            <span>{idx + 1}. {tag}</span>
            <button
              className="border rounded-md group-hover:visible p-1 m-1 hover:bg-pink-500 hover:text-white invisible"
              onClick={() => removeTag(tag)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const GameDisplay: React.FC<{
  games: GameRecord[];
  removeGame: (record: GameRecord) => void;
}> = ({ games, removeGame }) => {
  return (
    <div>
      <ul className="py-4 text-lg font-mono">
        {games.map((game, idx) => (
          <li
            key={`game-${game.fileName}`}
            className="group hover:bg-pink-100 flex flex-row items-center justify-between w-full"
          >
            <span>{idx + 1}. {game.fileName}</span>
            <button
              className="border rounded-md group-hover:visible p-1 m-1 hover:bg-pink-500 hover:text-white invisible"
              onClick={() => removeGame(game)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SelectReplays: React.FC<{
  tags: string[];
  gameRecords: GameRecord[];
  addGameRecord: (record: GameRecord) => void;
  removeGameRecord: (removed: GameRecord) => void;
  logMessages: string[];
  log: (msg: string) => void;
  nextStep: () => void;
  previousStep: () => void;
}> = (
  {
    tags,
    gameRecords,
    addGameRecord,
    removeGameRecord,
    logMessages,
    log,
    nextStep,
    previousStep,
  },
) => {
  const directoryRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const logEnd = useRef<HTMLDivElement | null>(null);

  const logWindow: JSX.Element | null = logMessages.length === 0
    ? null
    : (
      <div className="border border-b m-4 p-4 bg-gray-100 font-mono h-64 overflow-y-auto">
        {logMessages.map((msg: string, idx) => <p key={`log-${idx}`}>{msg}</p>)}
        <div ref={logEnd} />
      </div>
    );

  // scroll to bottom of log when a new message is added
  useEffect(() => {
    logEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [logMessages]);

  return (
    <div className="w-[50vw]">
      <p>Searching replays for:</p>
      <ul className="list-disc pl-4">
        {tags.map((tag: string) => (
          <li key={`tag-${tag}`} className="font-mono">{tag}</li>
        ))}
      </ul>
      <p className="text-xl font-bold my-2">
        Next, select the replay files you want to analyze.
      </p>
      <p className="text-lg my-2">
        You can select individual replay files, or a directory of replay files.
      </p>
      <div className="flex flex-row items-center justify-between w-full">
        <input
          type="file"
          id="replayDataFile"
          ref={fileRef}
          onChange={async (e) => {
            if (fileRef.current && fileRef.current.files !== null) {
              const target = fileRef.current.files[0];
              const result: Result<GameRecord, string> = await parseReplay(
                target,
              );
              if (result.ok) {
                log(`parsed "${result.value.fileName}" successfully`);
                addGameRecord(result.value);
              } else {
                log(`failed to load "${target.name}": ${result.error}`);
              }
            }
          }}
        />
        {/* @ts-ignore */}
        <input
          type="file"
          name="fileList"
          webkitdirectory=""
          id="replayDataDirectory"
          ref={directoryRef}
        />
      </div>
      {logWindow}
      <GameDisplay
        games={gameRecords}
        removeGame={removeGameRecord}
      />
      <div className="flex flex-row items-center justify-between w-full">
        <button
          className="px-4 py-2 mt-4 rounded-md border-b border-orange-500 bg-orange-500 text-white font-bold"
          onClick={previousStep}
        >
          Configure Tags
        </button>
        <button
          className="px-4 py-2 mt-4 rounded-md border-b border-pink-500 bg-pink-500 text-white font-bold"
          onClick={async () => {
            {
              /* if (directoryRef.current && directoryRef.current.files) {
            const file = await directoryRef.current.files[0].arrayBuffer();
            setGames([...games, {
            game: new Game(file),
            file: directoryRef.current.files[0].name,
            }]);
            directoryRef.current.value = "";
            } */
            }
          }}
        >
          Analyze Replays
        </button>
      </div>
    </div>
  );
};

const Header: React.FC<{}> = () => {
  return (
    <div className="w-full min-h-fit h-[10vh] bg-pink-200 overflow-auto flex flex-row gap-4 justify-center items-center">
      <img src="/turnip-icon.png" alt="" />
      <p className="text-4xl font-bold">Turnip Counter</p>
      <p className="text-xl">Analyze Melee Peach Item Pull RNG</p>
    </div>
  );
};

const Footer: React.FC<{}> = () => {
  return (
    <div className="h-[10vh] bg-pink-200 w-full flex flex-row justify-center items-center gap-2">
      <p>
        Built by{" "}
        <a href="https://github.com/djanatyn" className="text-pink-900">
          DJAN
        </a>{" "}
        with <a href="https://nextjs.org/" className="text-pink-900">next.js</a>
        {" and "}
        <a
          href="https://www.npmjs.com/package/@slippilab/parser"
          className="text-pink-900"
        >
          @slippilab/parser
        </a>
      </p>
    </div>
  );
};

const Body: React.FC<{
  games: GameRecord[];
  setGames: (games: GameRecord[]) => void;
  state: State;
  setState: (update: (oldState: State) => State) => void;
}> = ({ games, setGames, state, setState }) => {
  const addTag = (newTag: string) =>
    setState((oldState: State) => {
      const alreadyAdded: boolean = oldState.matchingTags.includes(newTag);
      return alreadyAdded ? oldState : {
        ...state,
        matchingTags: [...oldState.matchingTags, newTag],
      };
    });

  const removeTag = (removedTag: string) =>
    setState((oldState: State) => {
      return {
        ...oldState,
        matchingTags: oldState.matchingTags.filter((tag: string) =>
          tag != removedTag
        ),
      };
    });

  const log = (msg: string) =>
    setState((oldState: State) => {
      return {
        ...oldState,
        logMessages: [...oldState.logMessages, msg],
      };
    });

  const activeStep: JSX.Element = (() => {
    switch (state.step) {
      case CounterStep.GetSlippiTag: {
        return (
          <GetSlippiTag
            tags={state.matchingTags}
            addTag={addTag}
            removeTag={removeTag}
            nextStep={() =>
              setState((oldState: State) => {
                return {
                  ...oldState,
                  step: CounterStep.LoadSLPFiles,
                };
              })}
          />
        );
      }
      case CounterStep.LoadSLPFiles: {
        return (
          <SelectReplays
            tags={state.matchingTags}
            gameRecords={state.gameRecords}
            addGameRecord={(game: GameRecord) => {
              setState((oldState: State) => {
                const alreadyAdded = oldState.gameRecords.some((
                  addedGame: GameRecord,
                ) => addedGame.fileName == game.fileName);
                return alreadyAdded ? oldState : {
                  ...oldState,
                  gameRecords: [...oldState.gameRecords, game],
                };
              });
            }}
            removeGameRecord={(removed: GameRecord) => {
              setState((oldState: State) => {
                return {
                  ...oldState,
                  gameRecords: oldState.gameRecords.filter((game: GameRecord) =>
                    game.fileName != removed.fileName
                  ),
                };
              });
              log(`removed "${removed.fileName}`);
            }}
            logMessages={state.logMessages}
            log={log}
            nextStep={() => console.log("TODO")}
            previousStep={() =>
              setState((oldState: State) => {
                return {
                  ...oldState,
                  step: CounterStep.GetSlippiTag,
                };
              })}
          />
        );
      }
      case CounterStep.AnalyzeReplays: {
        return <p>analyze replays</p>;
      }
      case CounterStep.DisplayResults: {
        return <p>display results</p>;
      }
      default: {
        return <p>fatal error</p>;
      }
    }
  })();

  return (
    <div className="flex flex-col gap-4 w-full px-24 h-[80vh] bg-white">
      <div className="mt-4" />
      <p>
        All replays are processed locally in your browser - the replays do not
        leave your computer, and are not uploaded anywhere.
      </p>
      <div className="flex flex-col items-center mt-4">
        {activeStep}
      </div>
    </div>
  );
};

const TurnipCounter: NextPage = () => {
  const [games, setGames] = useState<GameRecord[]>([]);
  const [state, setState] = useState<State>(DEFAULT_STATE);

  return (
    <main className="min-h-screen flex flex-col items-center">
      <Header />
      <Body
        games={games}
        setGames={setGames}
        state={state}
        setState={setState}
      />
      <Footer />
    </main>
  );
};

export default TurnipCounter;
