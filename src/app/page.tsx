"use client";

import { NextPage } from "next";
import { useRef, useState } from "react";
import { Game } from "https://cdn.skypack.dev/@slippilab/parser";

export type GameRecord = {
  game: Game;
  file: String;
};

const GameDisplay: React.FC<{
  games: GameRecord[];
}> = ({ games }) => {
  return (
    <div>
      <ul className="list-disc pl-4 text-lg font-mono">
        {games.map((game, idx) => (
          <li>
            {game.file}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TurnipCounter: NextPage = () => {
  const directoryRef = useRef(null);
  const fileRef = useRef(null);

  const [games, setGames] = useState<GameRecord[]>([]);

  return (
    <main className="min-h-screen flex flex-col items-center">
      {/* header */}
      <div className="w-full min-h-fit h-[10vh] bg-pink-200 overflow-auto flex flex-row gap-8 justify-center items-center">
        <p className="text-4xl font-bold">Turnip Counter</p>
        <p className="text-xl">Analyze Melee Peach Item Pull RNG</p>
      </div>

      {/* body */}
      <div
        className="flex flex-col gap-4 w-full px-24 h-[80vh] bg-white"
        style={{
          backgroundImage: `url("/turnip-icon.png")`,
          backgroundPositionX: "center",
          backgroundPositionY: "1rem",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="mt-4" />
        {/* upload slps */}
        <div className="flex flex-row items-center justify-between w-full">
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
              console.log("hi");
              if (fileRef.current && fileRef.current.files) {
                const file = await fileRef.current.files[0].arrayBuffer();
                setGames([...games, {
                  game: new Game(file),
                  file: fileRef.current.files[0].name,
                }]);
                fileRef.current.value = null;
              }
            }}
          >
            Add Replay File
          </button>
        </div>
        <div className="flex flex-row gap-2 items-center">
          Include turnip pulls by:{"  "}
          <input
            type="text"
            className="border border-b p-1"
            defaultValue="ACAB#420"
          />
          <button className="bg-pink-500 p-2 rounded-md text-white font-bold">
            Add
          </button>
        </div>
        <GameDisplay games={games} />
      </div>

      {/* footer */}
      <div className="h-[10vh] bg-pink-200 w-full flex flex-row justify-center items-center gap-2">
        <p>
          Built by{" "}
          <a href="https://github.com/djanatyn" className="text-pink-900">
            DJAN
          </a>{" "}
          with{" "}
          <a href="https://nextjs.org/" className="text-pink-900">next.js</a>
          {" and "}
          <a
            href="https://www.npmjs.com/package/@slippilab/parser"
            className="text-pink-900"
          >
            @slippilab/parser
          </a>
        </p>
      </div>
    </main>
  );
};

export default TurnipCounter;
