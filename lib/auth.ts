// PRD: Auth
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth/utils";
import { User } from "@/models";

// Six months in seconds: 6 months * 30 days * 24 hours * 60 minutes * 60 seconds
const SIX_MONTHS = 6 * 30 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find the user with the email
        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });
        console.log(user, "findOnefindOne");
        if (!user) {
          return null;
        }

        // Check if the email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        // Verify the password
        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return the user object without the password
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || null,
          image: user.image || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.image,
          accessTokenExpires: Date.now() + SIX_MONTHS * 1000,
        };
      }

      // Return previous token if not expired
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }

      // Token is expired, but we'll return it anyway and let the client handle refresh
      // This helps prevent unnecessary redirects
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          name: token.name as string | null,
          email: token.email as string | null,
          image: token.picture as string | null,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt",
    maxAge: SIX_MONTHS, // 6 months as requested by user
  },
  jwt: {
    // Long secret to improve encryption security
    secret: process.env.NEXTAUTH_SECRET,
    // Maximum token age - should match session maxAge
    maxAge: SIX_MONTHS,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SIX_MONTHS,
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Type extension for the NextAuth session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}


