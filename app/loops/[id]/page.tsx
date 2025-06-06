// PRD: TrackStreaks
'use client';

import { useEffect, useState } from 'react';
import { useLoopStore } from '@/store';
import LoopStats from '@/components/dashboard/LoopStats';
import CheckInHistory from '@/components/dashboard/CheckInHistory';
import { ILoop } from '@/models/Loop';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoopDetailPage({ params }: { params: { id: string } }) {
    const { loops, fetchLoops, isLoading } = useLoopStore();
    const [loop, setLoop] = useState<ILoop | null>(null);
    const [notFound, setNotFound] = useState(false);

    // Fetch the specific loop on page load
    useEffect(() => {
        const getLoopDetails = async () => {
            // Check if loops are already loaded
            const existingLoop = loops.find(l => l._id.toString() === params.id);

            if (existingLoop) {
                setLoop(existingLoop);
                return;
            }

            // If not, fetch all loops
            await fetchLoops();

            // Find the loop in the updated list
            const foundLoop = loops.find(l => l._id.toString() === params.id);

            if (foundLoop) {
                setLoop(foundLoop);
            } else {
                setNotFound(true);
            }
        };

        getLoopDetails();
    }, [params.id, loops, fetchLoops]);

    if (isLoading) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <span className="ml-3">Loading loop...</span>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="text-center py-12 bg-card border rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Loop Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        The loop you're looking for doesn't exist or you don't have access to it.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center text-sm hover:underline"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Dashboard
                </Link>
            </div>

            {loop && <LoopStats loop={loop} />}

            <div className="mt-8 space-y-6">
                {/* Loop Details */}
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-medium mb-4">Loop Details</h3>

                    {loop && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                                <p className="text-base">
                                    {typeof loop.frequency === 'string'
                                        ? loop.frequency.charAt(0).toUpperCase() + loop.frequency.slice(1)
                                        : Array.isArray(loop.frequency)
                                            ? loop.frequency.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')
                                            : 'Custom'
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                                <p className="text-base">
                                    {new Date(loop.startDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                                <p className="text-base">
                                    {loop.visibility.charAt(0).toUpperCase() + loop.visibility.slice(1)}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Created</p>
                                <p className="text-base">
                                    {new Date(loop.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Check-in History */}
                <div className="bg-card border rounded-lg p-6">
                    {loop && <CheckInHistory loopId={loop._id.toString()} />}
                </div>
            </div>
        </div>
    );
} 