import type { Metadata } from "next";
import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import MainPageClient from "./MainPageClient";
import { fetchBooksPage } from "@/app/actions/dashboard";
import { Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";

export const metadata: Metadata = {
  title: "Panel",
  description: "Panel privado de gestion de libros financieros.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/main",
  },
};

const DashboardLoadingFallback = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      width: "100%",
    }}
  >
    <CircularProgress />
  </Box>
);

async function DashboardContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  // Fetch initial books page
  const { data: initialBooks, count: totalBooksCount } = await fetchBooksPage(0, "");

  return <MainPageClient initialBooks={initialBooks || []} initialBooksCount={totalBooksCount} />;
}

const Page = async () => {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <DashboardContent />
    </Suspense>
  );
};

export default Page;
