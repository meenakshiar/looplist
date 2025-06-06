// PRD: Auth
'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Link } from '@heroui/link';
import { useAuthStore } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function ResendVerificationPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const resendVerification = useAuthStore(state => state.resendVerification);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address');
            return;
        }

        setStatus('loading');
        setMessage('Sending verification email...');

        try {
            await resendVerification(email);
            setStatus('success');
            setMessage(`Verification email sent to ${email}. Please check your inbox.`);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to send verification email. Please try again.');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-15rem)]">
            <Card className="max-w-md w-full">
                <CardHeader className="flex flex-col gap-1 items-center">
                    <h1 className="text-xl font-bold">Resend Verification Email</h1>
                </CardHeader>

                <CardBody className="py-6">
                    {status === 'success' ? (
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div className="rounded-full bg-success/10 p-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-success"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <p>{message}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <Input
                                type="email"
                                label="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                variant="bordered"
                                isRequired
                                autoComplete="email"
                                isDisabled={status === 'loading'}
                            />

                            {status === 'error' && (
                                <div className="text-danger text-sm px-1">{message}</div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    color="primary"
                                    isLoading={status === 'loading'}
                                    isDisabled={!email || status === 'loading'}
                                >
                                    Resend Verification Email
                                </Button>
                            </div>
                        </form>
                    )}
                </CardBody>

                <CardFooter className="flex justify-center">
                    <Button
                        variant="flat"
                        onPress={() => router.push(status === 'success' ? '/login' : '/')}
                    >
                        {status === 'success' ? 'Go to Login' : 'Back to Home'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
} 