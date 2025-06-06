// PRD: Auth
'use client';

import { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { useAuthStore } from '@/store/slices/authSlice';

interface SignupFormProps {
    onSuccess: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);

    const signup = useAuthStore(state => state.signup);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await signup(email, password);
            setVerificationSent(true);
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (verificationSent) {
        return (
            <div className="py-6 text-center">
                <h3 className="text-lg font-medium mb-2">Verification Email Sent!</h3>
                <p className="text-default-500 mb-4">
                    Please check your inbox at <span className="font-medium">{email}</span> and click the verification link.
                </p>
                <p className="text-xs text-default-400">
                    You'll be redirected to login in a moment...
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-4">
            <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                variant="bordered"
                isRequired
                autoComplete="email"
                isDisabled={isLoading}
            />

            <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                variant="bordered"
                isRequired
                autoComplete="new-password"
                isDisabled={isLoading}
                description="Min. 8 characters"
            />

            <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                variant="bordered"
                isRequired
                autoComplete="new-password"
                isDisabled={isLoading}
            />

            {error && (
                <div className="text-danger text-sm px-1">{error}</div>
            )}

            <div className="flex justify-end mt-2">
                <Button
                    type="submit"
                    color="primary"
                    isLoading={isLoading}
                    isDisabled={!email || !password || !confirmPassword || isLoading}
                >
                    Sign Up
                </Button>
            </div>
        </form>
    );
} 