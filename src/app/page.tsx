"use client";

import { NextPage } from "next";
import { useState } from "react";
import { GetSlippiTag, SelectReplays } from "@/components";

// https://stackoverflow.com/a/76993906
declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

const Header: React.FC<{}> = () => {
  return (
    <div className="w-full min-h-fit h-[10vh] overflow-auto font-mono flex flex-row gap-4 justify-center items-center">
      <img src="/turnip-icon.png" alt="" />
      <p className="text-4xl font-mono font-bold">Turnip Counter</p>
      <p className="text-xl">Analyze Melee Slippi Replays</p>
    </div>
  );
};

const Footer: React.FC<{}> = () => {
  return (
    <div className="h-[10vh] font-mono w-full flex flex-row justify-center items-center gap-2">
      <p>
        Built by{" "}
        <a href="https://github.com/djanatyn" className="underline">
          DJAN
        </a>{" "}
        with{" "}
        <a href="https://nextjs.org/" className="underline">
          next.js
        </a>
        {" and "}
        <a
          href="https://www.npmjs.com/package/@slippilab/parser"
          className="underline"
        >
          @slippilab/parser
        </a>
      </p>
    </div>
  );
};

const Body: React.FC<{}> = () => {
  return (
    <div className="flex flex-col gap-4 w-full px-24 h-[80vh] bg-white font-mono text-black">
      <div className="mt-4" />
      <p>
        All replays are processed locally in your browser - the replays do not
        leave your computer, and are not uploaded anywhere.
      </p>
      <div className="flex flex-col items-center mt-4">
        <p>This site is under construction.</p>
      </div>
    </div>
  );
};

const TurnipCounter: NextPage = () => {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Header />
      <Body />
      <Footer />
    </main>
  );
};

export default TurnipCounter;
