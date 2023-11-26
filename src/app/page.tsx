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
import { useState } from "react";
import { CounterStep, DEFAULT_STATE, GameRecord, State } from "@/types";
import { GetSlippiTag, SelectReplays } from "@/components";

// https://stackoverflow.com/a/76993906
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

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
  const log = (msg: string) =>
    setState((oldState: State) => {
      return {
        ...oldState,
        logMessages: [...oldState.logMessages, msg],
      };
    });

  const setStep = (step: CounterStep) => {
    return () =>
      setState((oldState: State) => {
        return { ...oldState, step };
      });
  };

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

  const addGameRecord = (game: GameRecord) => {
    setState((oldState: State) => {
      const alreadyAdded = oldState.gameRecords.some((
        addedGame: GameRecord,
      ) => addedGame.fileName == game.fileName);
      return alreadyAdded ? oldState : {
        ...oldState,
        gameRecords: [...oldState.gameRecords, game],
      };
    });
  };

  const removeGameRecord = (removed: GameRecord) => {
    setState((oldState: State) => {
      return {
        ...oldState,
        gameRecords: oldState.gameRecords.filter((game: GameRecord) =>
          game.fileName != removed.fileName
        ),
      };
    });
    log(`removed "${removed.fileName}`);
  };

  const activeStep: JSX.Element = (() => {
    switch (state.step) {
      case CounterStep.GetSlippiTag: {
        return (
          <GetSlippiTag
            tags={state.matchingTags}
            addTag={addTag}
            removeTag={removeTag}
            nextStep={setStep(CounterStep.LoadSLPFiles)}
          />
        );
      }
      case CounterStep.LoadSLPFiles: {
        return (
          <SelectReplays
            tags={state.matchingTags}
            gameRecords={state.gameRecords}
            addGameRecord={addGameRecord}
            removeGameRecord={removeGameRecord}
            logMessages={state.logMessages}
            log={log}
            nextStep={setStep(CounterStep.AnalyzeReplays)}
            previousStep={setStep(CounterStep.GetSlippiTag)}
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
