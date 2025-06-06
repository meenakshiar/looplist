// PRD: PublicLoopBoard
'use client';

import { useState } from 'react';
import { useExploreStore, PublicLoop } from '@/store/slices/exploreSlice';
import { useAuthStore } from '@/store';
import { Card,CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Badge } from '@heroui/badge';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover';
import { Calendar, Copy,Flame, Hash, SmilePlus, User } from 'lucide-react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from '@heroui/modal';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { addToast } from '@heroui/toast';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface PublicLoopCardProps {
    loop: PublicLoop;
}

export const PublicLoopCard: React.FC<PublicLoopCardProps> = ({ loop }) => {
    const { reactToLoop, removeReaction, cloneLoop } = useExploreStore();
    const { user, isAuthenticated } = useAuthStore();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCloneConfirm, setShowCloneConfirm] = useState(false);
    const router = useRouter();

    // Format the frequency for display
    const formatFrequency = (freq: string | string[]) => {
        if (Array.isArray(freq)) {
            return freq.length === 7 ? 'Daily' : `${freq.length}x per week`;
        }
        return freq === 'daily' ? 'Daily' :
            freq === 'weekdays' ? 'Weekdays' :
                freq === '3x/week' ? '3x per week' : freq;
    };

    // Format the date for display
    const formatDate = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch (e) {
            return 'recently';
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji: string) => {
        setShowEmojiPicker(false);

        if (!isAuthenticated) {
            addToast({
                title: 'Authentication required',
                description: 'Please sign in to react to loops',
                color: 'danger',
            });
            return;
        }

        if (loop.userReaction === emoji) {
            // If clicking the same emoji, remove the reaction
            removeReaction(loop.loopId);
        } else {
            // Otherwise add/change the reaction
            reactToLoop(loop.loopId, emoji);
        }
    };

    // Handle clone button click
    const handleCloneClick = () => {
        if (!isAuthenticated) {
            addToast({
                title: 'Authentication required',
                description: 'Please sign in to clone loops',
                color: 'danger',
            });
            return;
        }

        setShowCloneConfirm(true);
    };

    // Handle loop cloning confirmation
    const handleCloneConfirm = async () => {
        try {
            const newLoopId = await cloneLoop(loop.loopId);
            setShowCloneConfirm(false);

            if (newLoopId) {
                addToast({
                    title: 'Loop cloned!',
                    description: 'The loop has been added to your dashboard',
                });
            }
        } catch (error) {
            addToast({
                title: 'Failed to clone loop',
                description: (error as Error).message,
                color: 'danger',
            });
        }
    };

    // Get user initials for avatar
    const getUserInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <Card>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                        <Avatar
                        src='https://i.pravatar.cc/150?img=1'
                        >
                        </Avatar>
                        <div className="text-sm font-medium">{loop.ownerEmail.split('@')[0]}</div>
                    </div>
                    <Badge variant="flat" size="sm">
                        {formatFrequency(loop.frequency)}
                    </Badge>
                </div>
            </CardHeader>

            <CardBody className="p-4 pt-2 pb-3">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{loop.title}</h3>

                <div className="flex flex-wrap gap-2 text-sm text-default-500">
                    <div className="flex items-center gap-1">
                        <Flame className="w-4 h-4" />
                        <span>{loop.currentStreak} day streak</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(loop.createdAt)}</span>
                    </div>
                </div>
            </CardBody>

            <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger>
                            <Button
                                    color={loop.userReaction ? "secondary" : "default"}
                                    variant={loop.userReaction ? "solid" : "bordered"}
                                    size="sm"
                                    isDisabled={loop.isReacting}
                                    onPress={() => setShowEmojiPicker(true)}
                                >
                                    {loop.userReaction ? loop.userReaction : <SmilePlus className="h-4 w-4 mr-1" />}
                                    {loop.cheeredCount > 0 && <span className="ml-1">{loop.cheeredCount}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                                <p>{loop.userReaction ? 'Change reaction' : 'Add reaction'}</p>
                            </PopoverContent>
                        </Popover>
                    

                    <Modal isOpen={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <ModalContent>
                            <ModalHeader>
                                <h2 className="text-lg font-semibold">Add a reaction</h2>
                                <p className="text-sm text-default-500">
                                    Select an emoji to show your support
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                </div>

                <Button
                    variant="bordered"
                    size="sm"
                    isDisabled={loop.isCloning}
                    onPress={handleCloneClick}
                >
                    <Copy className="h-4 w-4 mr-1" />
                    Clone
                    {loop.clonedCount > 0 && <span className="ml-1">({loop.clonedCount})</span>}
                </Button>

                <Modal isOpen={showCloneConfirm} onOpenChange={setShowCloneConfirm}>
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="text-lg font-semibold">Clone this loop?</h2>
                            <p className="text-sm text-default-500">
                                This will add "{loop.title}" to your loops with the same frequency,
                                but will reset the streak and set it to private.
                            </p>
                        </ModalHeader>
                        <ModalFooter>
                            <Button variant="bordered" onPress={() => setShowCloneConfirm(false)}>
                                Cancel
                            </Button>
                            <Button onPress={handleCloneConfirm}>
                                Clone Loop
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </CardFooter>
        </Card>
    );
};