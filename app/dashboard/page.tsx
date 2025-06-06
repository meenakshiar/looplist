'use client';

import { useAuthStore } from '@/store/slices/authSlice';
import Dashboard from '@/components/dashboard/Dashboard';

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuthStore();
    console.log(user)

    // Show simple loading if we don't have user data yet
    if (!user) {
        return (
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Your Loops</h1>
                <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-3"></div>
                    <span>Loading your dashboard...</span>
                </div>
            </main>
        );
    }

    // User is authenticated and data is available
    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Your Loops</h1>
            <Dashboard user={user} />
        </main>
    );
} 