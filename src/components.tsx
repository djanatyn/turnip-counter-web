import { useEffect, useRef, useState } from "react";
import { GameRecord, Result } from "@/types";
import { parseReplay } from "@/analyze";

export const GetSlippiTag: React.FC<{
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
        onClick={nextStep}
      >
        Select Replays
      </button>
    </div>
  );
};

export const TagDisplay: React.FC<{
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

export const GameDisplay: React.FC<{
  games: GameRecord[];
  removeGame: (record: GameRecord) => void;
}> = ({ games, removeGame }) => {
  const end = useRef<HTMLDivElement | null>(null);

  // scroll to bottom of log when a new message is added
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [games]);

  return (
    <div className="overflow-auto max-h-64">
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
        <div ref={end} />
      </ul>
    </div>
  );
};

export const SelectReplays: React.FC<{
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
          onChange={async (e) => {
            if (e.currentTarget.files !== null) {
              const target = e.currentTarget.files[0];
              const result: Result<GameRecord, string> = await parseReplay(
                target,
              );
              if (result.ok) {
                log(`parsed "${result.value.fileName}" successfully`);
                console.log(result.value.game);
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
          onChange={async (e) => {
            if (e.currentTarget.files !== null) {
              const length = e.currentTarget.files.length;
              const directory =
                e.currentTarget.files[0].webkitRelativePath.split("/")[0];
              log(`parsing ${length} files from "${directory}":`);
              for (const file of Array.from(e.currentTarget.files)) {
                const result: Result<GameRecord, string> = await parseReplay(
                  file,
                );
                if (result.ok) {
                  log(
                    `> parsed "${result.value.fileName}" successfully`,
                  );
                  addGameRecord(result.value);
                } else {
                  log(
                    `> failed to load "${file.name}": ${result.error}`,
                  );
                }
              }
              log(`finished processing ${length} files from "${directory}"`);
            }
          }}
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
          }}
        >
          Analyze Replays
        </button>
      </div>
    </div>
  );
};
