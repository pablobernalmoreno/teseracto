import supabase from "@/config/supabaseClient";

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

    // Don't store email client-side for security
    return { error: null, success: true };
  },

  async signOut() {
    const clientResult = await supabase.auth.signOut();

    await fetch("/api/auth/session", {
      method: "DELETE",
    });

    return clientResult;
  },
};
