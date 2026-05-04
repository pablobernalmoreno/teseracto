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

  return (
    <DashboardModalProvider>
      <AppBarMenu variant="authenticated" onShowHistory={() => setShowHistory(true)} />
      <MainPageContent
        initialBooks={initialBooks}
        initialBooksCount={initialBooksCount}
        showHistory={showHistory}
        onHideHistory={() => setShowHistory(false)}
      />
    </DashboardModalProvider>
  );
};

export default MainPageClient;
