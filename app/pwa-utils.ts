"use client";

// Define a type for the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

// Store the beforeinstallprompt event so it can be triggered later
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Handle the beforeinstallprompt event
export function initInstallPrompt(): void {
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Store the event so it can be triggered later
            deferredPrompt = e as BeforeInstallPromptEvent;
        });
    }
}

// Show the install prompt
export async function showInstallPrompt(): Promise<boolean> {
    if (!deferredPrompt) {
        return false;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;

    // Reset the deferred prompt variable
    deferredPrompt = null;

    return choiceResult.outcome === 'accepted';
}

// Check if the app is installable
export function isInstallable(): boolean {
    return !!deferredPrompt;
}

// Check if the app is already installed
export function isAppInstalled(): boolean {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;
    }
    return false;
} 