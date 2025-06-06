// PRD: Auth
/**
 * Auth slice for managing user authentication state.
 * State:
 * - user: The authenticated user's information.
 * - accessToken: The access token for authentication.
 * - isAuthenticated: Boolean indicating authentication status.
 * Actions:
 * - login: Function to authenticate a user.
 * - signup: Function to register a new user.
 * - logout: Function to clear authentication.
 * - refreshToken: Function to refresh the access token.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { signIn, getSession } from "next-auth/react";

// Set a reasonable token expiration (15 minutes in ms)
const TOKEN_EXPIRY_MS = 15 * 60 * 1000;

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenExpiry: number | null; // When the token expires (timestamp)
  initializing: boolean; // Track initialization state

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  getSession: () => Promise<boolean>; // Check if session is valid
  initAuth: () => Promise<void>; // Initialize auth state
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      tokenExpiry: null,
      initializing: true,

      initAuth: async () => {
        // Set initializing state
        set((state) => {
          state.initializing = true;
          state.isLoading = true;
        });

        try {
          console.log("Initializing auth state...");

          // First, try to refresh tokens from backend
          const refreshed = await get().refreshToken();

          // If refresh successful, we're done
          if (refreshed) {
            console.log("Auth initialized with refreshed token");
            set((state) => {
              state.initializing = false;
              state.isLoading = false;
            });
            return;
          }

          // If refresh failed, clear auth state
          console.log("Token refresh failed, clearing auth state");
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.initializing = false;
            state.isLoading = false;
            state.tokenExpiry = null;
          });
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Reset auth state
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.tokenExpiry = null;
            state.initializing = false;
          });
        }
      },

      login: async (email: string, password: string) => {
        set(state => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          console.log('Authenticating user...');
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Important: include cookies
          });
          console.log(response);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: `Server error: ${response.status}`
            }));
            throw new Error(errorData.message || 'Invalid credentials or email not verified');
          }

          const data = await response.json();
          console.log(data)
          localStorage.setItem("userId", data.user.id)
          if (!data.accessToken) {
            console.error('No access token received from server');
            throw new Error('Authentication error: No access token received');
          }

          console.log('Authentication successful, setting state...');

          // Store the access token in state only (no manual cookie setting)
          set(state => {
            state.user = data.user;
            state.accessToken = data.accessToken;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.tokenExpiry = Date.now() + TOKEN_EXPIRY_MS;
          });
        } catch (error: any) {
          console.error('Login error in store:', error);
          set(state => {
            state.isLoading = false;
            state.error = error.message || 'Authentication failed';
          });
          throw error;
        }
      },

      // login: async (email, password) => {
      //   set((state) => {
      //     state.isLoading = true;
      //     state.error = null;
      //   });

      //   try {
      //     const res = await signIn("credentials", {
      //       email,
      //       password,
      //       redirect: false,
      //     });

      //     if (!res || !res.ok) {
      //       throw new Error("Invalid credentials or email not verified");
      //     }

      //     // Get session data (optional, if needed in client)
      //     const session = await getSession();

      //     set((state: any) => {
      //       state.user = session?.user || null;
      //       state.isAuthenticated = true;
      //       state.isLoading = false;
      //     });
      //   } catch (err: any) {
      //     set((state) => {
      //       state.isLoading = false;
      //       state.error = err.message || "Authentication failed";
      //     });
      //     throw err;
      //   }
      // },

      signup: async (email: string, password: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create account");
          }

          set((state) => {
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message;
          });
          throw error;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          console.log("Logging out user...");
          await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include", // Important for cookies
          });

          // Clear the auth state
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.tokenExpiry = null;
          });

          // Redirect to home page after logout
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        } catch (error: any) {
          console.error("Logout error:", error);
          set((state) => {
            state.isLoading = false;
            state.error = error.message;

            // Still clear auth state even if API call fails
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            state.tokenExpiry = null;
          });
        }
      },

      refreshToken: async () => {
        try {
          console.log("Refreshing authentication token...");
          const response = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include", // Important: include cookies
          });

          if (!response.ok) {
            console.error("Token refresh failed:", response.status);
            // Don't automatically logout - just return false
            return false;
          }

          const data = await response.json();
          console.log("Token refreshed successfully");

          // Update access token in state only (refresh token is in HTTP-only cookie)
          set((state) => {
            state.user = data.user;
            state.accessToken = data.accessToken;
            state.isAuthenticated = true;
            state.tokenExpiry = Date.now() + TOKEN_EXPIRY_MS;
          });

          return true;
        } catch (error) {
          console.error("Token refresh failed:", error);
          return false;
        }
      },

      resetPassword: async (email: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await fetch("/api/auth/reset/request", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.message || "Failed to request password reset"
            );
          }

          set((state) => {
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message;
          });
          throw error;
        }
      },

      verifyEmail: async (token: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await fetch(`/api/auth/verify?token=${token}`, {
            method: "GET",
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to verify email");
          }

          set((state) => {
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message;
          });
          throw error;
        }
      },

      resendVerification: async (email: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await fetch("/api/auth/verify/resend", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.message || "Failed to resend verification email"
            );
          }

          set((state) => {
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.isLoading = false;
            state.error = error.message;
          });
          throw error;
        }
      },

      getSession: async () => {
        const state = get();

        // If we have a valid token in state, consider us authenticated
        if (
          state.isAuthenticated &&
          state.tokenExpiry &&
          Date.now() < state.tokenExpiry
        ) {
          return true;
        }

        // Otherwise try to refresh the token
        return await get().refreshToken();
      },
    })),
    {
      name: "auth-storage", // unique name for localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiry: state.tokenExpiry,
      }),
    }
  )
);
