"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { initInstallPrompt, showInstallPrompt, isInstallable, isAppInstalled } from "./pwa-utils";
import { AuthModal } from "@/components/auth";
import { useAuthStore } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { Link } from "@heroui/link";

export default function Home() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  // Simpler redirect logic - only redirect once when we know user is authenticated
  useEffect(() => {
    if (isAuthenticated && !redirected) {
      console.log('Home: User is authenticated, redirecting once to dashboard');
      setRedirected(true);
      router.push('/dashboard');
    }
  }, [isAuthenticated, redirected, router]);

  useEffect(() => {
    // Initialize the install prompt handler
    initInstallPrompt();

    // Check if the app is already installed
    setInstalled(isAppInstalled());

    // Update the canInstall state when the isInstallable function changes
    const checkInstallable = () => setCanInstall(isInstallable());
    checkInstallable();

    // Create a listener to check if the app becomes installable
    window.addEventListener('beforeinstallprompt', checkInstallable);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    // Show the install prompt
    const installed = await showInstallPrompt();
    if (installed) {
      setCanInstall(false);
      setInstalled(true);
    }
  };

  const handleGetStartedClick = () => {
    setAuthModalOpen(true);
  };

  // Simple loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-center text-muted-foreground">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] min-h-[600px] gap-4 text-center">
        <div className="inline-block max-w-2xl text-center justify-center">
          <h1 className={title({ class: "text-4xl md:text-5xl font-bold tracking-tight" })}>
            Build Better Habits with{" "}
            <span className="text-primary">Social Accountability</span>
          </h1>
          <p className={subtitle({ class: "mt-4 text-lg" })}>
            LoopList helps you create micro-habits, track your streaks visually, and share
            your progress for better accountability.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-1">
          <Button
            className={buttonStyles({
              color: "primary",
              size: "lg",
              radius: "full",
              variant: "shadow",
              className: "font-medium px-8"
            })}
            onPress={handleGetStartedClick}
          >
            Get Started
          </Button>
          {/* <Button
            size="lg"
            radius="full"
            variant="bordered"
            className="font-medium px-8"
            onPress={handleInstallClick}
            isDisabled={installed || !canInstall}
          >
            {installed ? "Installed" : "Install as App"}
          </Button> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 w-full max-w-4xl">
          <div className="flex flex-col items-center p-4 rounded-lg border">
            <div className="rounded-full bg-primary/10 p-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1">Create Small Habits</h2>
            <p className="text-muted-foreground text-center text-sm">Start with micro-habits you can consistently maintain</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-lg border">
            <div className="rounded-full bg-primary/10 p-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20v-6M6 20V10M18 20V4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1">Track Your Streaks</h2>
            <p className="text-muted-foreground text-center text-sm">Visualize progress with streak counters and calendars</p>
          </div>

          <div className="flex flex-col items-center p-4 rounded-lg border">
            <div className="rounded-full bg-primary/10 p-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 7a5 5 0 0 0-10 0" />
                <path d="M19 8a7 7 0 0 0-14 0" />
                <path d="M12 20v-8" />
                <path d="M16 12a4 4 0 0 0-8 0" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-1">Share Your Progress</h2>
            <p className="text-muted-foreground text-center text-sm">Get accountability from others with public habit boards</p>
          </div>
        </div>
      </section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
