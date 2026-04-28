"use client";

import React from "react";
import { AppBarMenu } from "@/app/components/appBarMenu/AppBarMenu";
import { DashboardModalProvider } from "@/features/dashboard/model/state/DashboardModalContext";
import { MainPageContent } from "./MainPageContent";
import { type BookData } from "@/app/actions/dashboard";

interface MainPageClientProps {
  initialBooks: BookData[];
  initialBooksCount: number;
}

const MainPageClient = ({ initialBooks, initialBooksCount }: MainPageClientProps) => {
  return (
    <DashboardModalProvider>
      <AppBarMenu variant="authenticated" />
      <MainPageContent initialBooks={initialBooks} initialBooksCount={initialBooksCount} />
    </DashboardModalProvider>
  );
};

export default MainPageClient;
