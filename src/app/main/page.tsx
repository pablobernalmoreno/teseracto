import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import MainPageClient from "./MainPageClient";

const Page = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login");
  }

  return <MainPageClient />;
};

export default Page;
