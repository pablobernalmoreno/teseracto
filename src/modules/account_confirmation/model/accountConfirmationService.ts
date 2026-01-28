import supabase from "@/config/supabaseClient";
import { decryptData } from "@/app/utils/crypto";

export const accountConfirmationService = {
  async decryptRegisteredEmail(): Promise<string | null> {
    // Only accessible in browser context
    if (typeof window === "undefined") {
      return null;
    }

    const encryptedEmail = sessionStorage.getItem("registered_email");
    const emailIv = sessionStorage.getItem("email_iv");

    if (!encryptedEmail || !emailIv) {
      return null;
    }

    try {
      const email = await decryptData(encryptedEmail, emailIv);
      return email;
    } catch (error) {
      console.error("Error decrypting email:", error);
      return null;
    }
  },

  async resendConfirmationEmail(email: string) {
    try {
      await supabase.auth.resend({
        type: "signup",
        email: email,
      });
      return { success: true, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
};
