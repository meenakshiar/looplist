"use client";
import { useEffect } from 'react';
import { useLoopStore } from '@/store';
import CreateLoopButton from './CreateLoopButton';
import LoopList from './LoopList';
import CreateLoopModal from './CreateLoopModal';

interface DashboardProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export default function Dashboard({ user }: DashboardProps) {
    const {
        loops,
        isLoading,
        error,
        fetchLoops,
        showCreateModal,
        setShowCreateModal
    } = useLoopStore();

    // Fetch loops on component mount
    useEffect(() => {
        fetchLoops();
    }, [fetchLoops]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl text-muted-foreground">
                        Welcome back, {user.name || user.email || 'there'}
                    </h2>
                </div>
                <CreateLoopButton onClick={() => setShowCreateModal(true)} />
            </div>

            {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-300 text-red-600 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={() => useLoopStore.setState({ error: null })}
                        className="text-red-400 hover:text-red-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="py-8 flex justify-center">
                    <p className="text-muted-foreground">Loading your loops...</p>
                </div>
            ) : loops.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center bg-muted rounded-lg">
                    <h3 className="text-xl font-medium mb-2">No loops yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Create your first loop to start building habits!
                    </p>
                    <CreateLoopButton onClick={() => setShowCreateModal(true)} />
                </div>
            ) : (
                <LoopList loops={loops} />
            )}

            <CreateLoopModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    );
} 