"use client";

import React from "react";
import { Page } from "@/types";

interface TabNavigationProps {
  currentPage: Page;
  showIntro: boolean;
  onPageChange: (page: Page) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  currentPage,
  showIntro,
  onPageChange,
}) => {
  const tabs = [
    ...(showIntro ? [{ page: Page.Intro, label: "Intro" }] : []),
    { page: Page.Library, label: "Library" },
    { page: Page.Filtering, label: "Filtering" },
    { page: Page.Analysis, label: "Analysis" },
  ];

  return (
    <nav className="border-b">
      <div className="max-w-4xl mx-auto px-8">
        <div className="flex gap-1">
          {tabs.map(({ page, label }) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                px-6 py-4 font-medium transition-colors
                ${
                  currentPage === page
                    ? "border-b-2 border-current"
                    : "opacity-60 hover:opacity-100"
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};
