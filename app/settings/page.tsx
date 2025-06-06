'use client';

import { useEffect, useState } from 'react';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useAuthStore } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();
    const [email, setEmail] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
        } else if (user) {
            setEmail(user.email || '');
        }
    }, [isAuthenticated, router, user]);

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (!isAuthenticated || !user) {
        return null; // Don't render anything until redirected
    }

    return (
        <div className="container mx-auto max-w-2xl py-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <Card className="mb-6">
                <CardHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold">Profile</h2>
                    <p className="text-default-500 text-sm">Manage your personal information</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    <form className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                label="Email Address"
                                value={email}
                                isReadOnly
                                variant="bordered"
                                className="max-w-md"
                            />
                            <p className="text-xs text-default-500 mt-1">
                                Email cannot be changed. This is your login identifier.
                            </p>
                        </div>
                    </form>
                </CardBody>
            </Card>

            <Card className="mb-6">
                <CardHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold">Account</h2>
                    <p className="text-default-500 text-sm">Manage your account settings</p>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="space-y-4">
                        <p className="text-sm">
                            Your account was verified on {new Date((user as any).createdAt || Date.now()).toLocaleDateString()}.
                        </p>
                    </div>
                </CardBody>
                <Divider />
                <CardFooter>
                    <Button
                        color="danger"
                        variant="flat"
                        onPress={handleLogout}
                    >
                        Sign Out
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 