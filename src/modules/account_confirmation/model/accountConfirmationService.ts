import supabase from "@/config/supabaseClient";

export const accountConfirmationService = {
  async resendConfirmationEmail(email: string) {
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
};
