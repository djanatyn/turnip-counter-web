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
import { useRef, useState } from "react";
// @ts-ignore experimental urlImport feature from next.js
import { Game } from "https://cdn.skypack.dev/@slippilab/parser";

// https://stackoverflow.com/a/76993906
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

export type GameRecord = {
  game: Game;
  file: String;
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
};

const DEFAULT_STATE: State = {
  step: CounterStep.GetSlippiTag,
  matchingTags: [],
  parsedReplays: [],
};

const GetSlippiTag: React.FC<{
  nextStep: (tags: string[]) => void;
}> = ({ nextStep }) => {
  return (
    <div>
      <p>Include turnip pulls by:{"  "}</p>
      <input
        type="text"
        className="border border-b p-1"
        defaultValue="ACAB#420"
      />
      <button className="bg-pink-500 p-2 rounded-md text-white font-bold">
        Add
      </button>
      {/* TODO: display names selected */}
      {/* TODO: add button to move onto next step (validate at least one name selected) */}
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
            key={`game-${game.file}`}
            className="group hover:bg-pink-100 flex flex-row items-center justify-between w-full"
          >
            <span>{idx + 1}. {game.file}</span>
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

const SelectReplays: React.FC<{}> = () => {
  const directoryRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <div className="flex flex-row items-center justify-between w-full">
        {/* @ts-ignore */}
        <input
          type="file"
          name="fileList"
          webkitdirectory=""
          id="replayDataDirectory"
          ref={directoryRef}
        />
        <button className="px-4 py-2 rounded-md border-b border-indigo-500 bg-indigo-500 text-white">
          Add Replays from Directory
        </button>
      </div>
      <div className="flex flex-row items-center justify-between w-full">
        <input
          type="file"
          id="replayDataFile"
          ref={fileRef}
        />
        <button
          className="px-4 py-2 rounded-md border-b border-indigo-500 bg-indigo-500 text-white"
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
          Add Replay File
        </button>
      </div>
    </>
  );
};

const Header: React.FC<{}> = () => {
  return (
    <div className="w-full min-h-fit h-[10vh] bg-pink-200 overflow-auto flex flex-row gap-8 justify-center items-center">
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
  setState: (updated: State) => void;
}> = ({ games, setGames, state, setState }) => {
  let activeStep: JSX.Element = (() => {
    switch (state.step) {
      case CounterStep.GetSlippiTag: {
        return (
          <GetSlippiTag
            nextStep={(tags: string[]) =>
              setState({
                ...state,
                step: CounterStep.LoadSLPFiles,
                matchingTags: tags,
              })}
          />
        );
      }
      case CounterStep.LoadSLPFiles: {
        return <p>load slp files</p>;
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
    <div
      className="flex flex-col gap-4 w-full px-24 h-[80vh] bg-white"
      style={{
        backgroundImage: `url("/turnip-icon.png")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mt-4" />
      <p>
        All replays are processed locally in your browser - the replays do not
        leave your computer, and are not uploaded anywhere.
      </p>
      {activeStep}
      <GameDisplay
        games={games}
        removeGame={(remove: GameRecord) =>
          setGames(
            games.filter((game: GameRecord) => game.file != remove.file),
          )}
      />
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
