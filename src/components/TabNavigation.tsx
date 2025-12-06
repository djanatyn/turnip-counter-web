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
    { page: Page.Analysis, label: "Analysis" },
    { page: Page.Export, label: "Export" },
  ];

  return (
    <nav className="border-r w-48 flex-shrink-0">
      <div className="p-4 space-y-2">
        {tabs.map(({ page, label }) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-full px-4 py-3 rounded text-left font-medium transition-all
              ${
                currentPage === page
                  ? "border-l-4 border-current pl-3"
                  : "opacity-60 hover:opacity-100 border-l-4 border-transparent"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
};
