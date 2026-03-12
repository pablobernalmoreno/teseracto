import supabase from "@/config/supabaseClient";

export const accountConfirmationService = {
  async decryptRegisteredEmail(): Promise<string | null> {
    // Email is no longer stored client-side for security
    // Return null to show generic confirmation message
    return null;
  },

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
