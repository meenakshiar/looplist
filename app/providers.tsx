"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/slices/authSlice';
import { SessionProvider } from 'next-auth/react';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const { initAuth } = useAuthStore();
  const authInitialized = useRef(false);

  const defaultThemeProps: ThemeProviderProps = {
    attribute: "class",
    defaultTheme: "system",
    enableSystem: true,
    disableTransitionOnChange: false,
    themes: ["light", "dark"],
    ...themeProps
  };

  // Initialize auth just once on mount
  useEffect(() => {
    if (!authInitialized.current) {
      console.log('🔐 Initializing authentication state...');
      authInitialized.current = true;

      initAuth().catch(err => {
        console.error('❌ Failed to initialize authentication:', err);
        // Don't set authInitialized back to false - we don't want to retry
      });
    }
  }, [initAuth]);

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...defaultThemeProps}>{children}</NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
