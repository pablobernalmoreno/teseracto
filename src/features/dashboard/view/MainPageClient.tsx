"use client";

import React, { useState } from "react";
import { AppBarMenu } from "@/app/components/appBarMenu/AppBarMenu";
import { DashboardModalProvider } from "@/features/dashboard/model/state/DashboardModalContext";
import { MainPageContent } from "./MainPageContent";
import { type BookData } from "@/app/actions/dashboard";

interface MainPageClientProps {
  initialBooks: BookData[];
  initialBooksCount: number;
}

const MainPageClient = ({ initialBooks, initialBooksCount }: MainPageClientProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  let activeSection: "books" | "pricing" | "history" = "books";
  if (showHistory) {
    activeSection = "history";
  } else if (showPricing) {
    activeSection = "pricing";
  }

  return (
    <DashboardModalProvider>
      <AppBarMenu
        variant="authenticated"
        activeSection={activeSection}
        onShowBooks={() => {
          setShowHistory(false);
          setShowPricing(false);
        }}
        onShowHistory={() => {
          setShowPricing(false);
          setShowHistory(true);
        }}
        onShowPricing={() => {
          setShowHistory(false);
          setShowPricing(true);
        }}
      />
      <MainPageContent
        initialBooks={initialBooks}
        initialBooksCount={initialBooksCount}
        showHistory={showHistory}
        showPricing={showPricing}
        onHideHistory={() => setShowHistory(false)}
        onHidePricing={() => setShowPricing(false)}
      />
    </DashboardModalProvider>
  );
};

export default MainPageClient;
