import supabase from "@/config/supabaseClient";
import { encryptData } from "@/app/utils/crypto";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirm_password: string;
}

export const loginService = {
  async signInWithPassword(credentials: LoginCredentials) {
    return await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
  },

  validatePassword(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
  },

  async signUp(credentials: RegisterCredentials) {
    // Sign up user
    const { error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.confirm_password,
    });

    if (error) {
      return { error, success: false };
    }

    // Encrypt email and store in sessionStorage
    try {
      const { encrypted, iv } = await encryptData(credentials.email);
      if (!encrypted || !iv) {
        throw new Error("Encryption failed");
      }
      sessionStorage.setItem("registered_email", encrypted);
      sessionStorage.setItem("email_iv", iv);
      return { error: null, success: true };
    } catch (encryptError) {
      const errorMessage =
        encryptError instanceof Error ? encryptError.message : "Unknown error";
      return { error: { message: errorMessage }, success: false };
    }
  },

  async signOut() {
    return await supabase.auth.signOut();
  }
};

