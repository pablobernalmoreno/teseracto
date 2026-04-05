import supabase from "@/config/supabaseClient";
import type { MainData } from "@/types/dashboard";

export interface UserData {
  id: string;
  book_id: string;
}

export interface BookData {
  id: string;
  title: string;
  content?: MainData[];
  owner_id?: string;
  creationTime?: string;
}

interface FetchBookDataPageParams {
  from: number;
  to: number;
  searchQuery?: string;
}

interface ServiceError {
  message: string;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function toServiceError(message: string): ServiceError {
  return { message };
}

async function authenticatedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return await fetch(input, {
    ...init,
    headers,
  });
}

// Dashboard service object with separate functions
export const dashboardService = {
  async getSession() {
    return await supabase.auth.getSession();
  },

  async fetchUserData() {
    try {
      const response = await authenticatedFetch("/api/dashboard/profile");

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as { data?: UserData[] };
      return {
        data: payload.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(error instanceof Error ? error.message : "Failed to load user data"),
      };
    }
  },

  async fetchCurrentUserProfile() {
    try {
      const response = await authenticatedFetch("/api/dashboard/profile/current");

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as { data?: UserData | null };
      return {
        data: payload.data || null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(
          error instanceof Error ? error.message : "Failed to load current user profile"
        ),
      };
    }
  },

  async fetchBookDataPage({ from, to, searchQuery }: FetchBookDataPageParams) {
    try {
      const searchParams = new URLSearchParams({
        from: String(from),
        to: String(to),
      });

      const trimmedQuery = searchQuery?.trim();
      if (trimmedQuery) {
        searchParams.set("searchQuery", trimmedQuery);
      }

      const response = await authenticatedFetch(`/api/dashboard/books?${searchParams.toString()}`);

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          count: 0,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as {
        data?: BookData[];
        count?: number;
      };

      return {
        data: payload.data || [],
        count: payload.count || 0,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        count: 0,
        error: toServiceError(error instanceof Error ? error.message : "Failed to load books"),
      };
    }
  },

  // Fetch full content for a single book by id (used for lazy-loading)
  async fetchBookContent(bookId: string | number) {
    try {
      const response = await authenticatedFetch(`/api/dashboard/books/${bookId}/content`);

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as {
        data?: { content?: MainData[] };
      };

      return {
        data: payload.data || null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(
          error instanceof Error ? error.message : "Failed to load book content"
        ),
      };
    }
  },

  async deleteBooks(bookIds: Array<string | number>) {
    try {
      const response = await authenticatedFetch("/api/dashboard/books", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookIds }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as {
        data?: Array<{ id: string | number }>;
      };

      return {
        data: payload.data || [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(error instanceof Error ? error.message : "Failed to delete books"),
      };
    }
  },

  async insertBookData(title: string, content: MainData[], bookId?: string) {
    try {
      const response = await authenticatedFetch("/api/dashboard/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, bookId }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as { data?: BookData };
      return {
        data: payload.data ? [payload.data] : [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(error instanceof Error ? error.message : "Failed to create book"),
      };
    }
  },

  async updateBookContent(bookId: string | number, content: MainData[]) {
    try {
      const response = await authenticatedFetch(`/api/dashboard/books/${bookId}/content`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as {
        data?: BookData;
      };

      return {
        data: payload.data || null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(
          error instanceof Error ? error.message : "Failed to update book content"
        ),
      };
    }
  },

  async createUserProfile(_userId: string) {
    try {
      const response = await authenticatedFetch("/api/dashboard/profile/initialize", {
        method: "POST",
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        return {
          data: null,
          error: toServiceError(message),
        };
      }

      const payload = (await response.json()) as { data?: UserData };
      return {
        data: payload.data ? [payload.data] : [],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: toServiceError(
          error instanceof Error ? error.message : "Failed to initialize user profile"
        ),
      };
    }
  },

  async initializeUserProfile(
    sessionData: { session?: { user?: { role?: string; id?: string } } } | null,
    _userData: unknown[] | null | undefined
  ) {
    const user = sessionData?.session?.user;
    if (user?.role === "authenticated") {
      return await this.createUserProfile(user.id || "");
    }

    return { data: null, error: null };
  },
};
