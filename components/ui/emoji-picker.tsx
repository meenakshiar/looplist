// PRD: PublicLoopBoard
'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

// Common emoji set for reactions
const defaultEmojis = [
    '👍', '❤️', '🎉', '👏', '🔥',
    '💯', '🙌', '✅', '🚀', '💪',
    '😊', '👊', '💫', '🌟', '⭐',
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
    const [customEmoji, setCustomEmoji] = useState('');

    // Handle custom emoji input
    const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Limit to single emoji
        if (e.target.value.length <= 2) {
            setCustomEmoji(e.target.value);
        }
    };

    // Handle custom emoji submit
    const handleCustomSubmit = () => {
        if (customEmoji) {
            onEmojiSelect(customEmoji);
            setCustomEmoji('');
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-2">
                {defaultEmojis.map((emoji) => (
                    <Button
                        key={emoji}
                        variant="bordered"
                        className="h-12 text-2xl"
                        onClick={() => onEmojiSelect(emoji)}
                    >
                        {emoji}
                    </Button>
                ))}
            </div>

            <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={customEmoji}
                        onChange={handleCustomInput}
                        placeholder="Custom emoji..."
                        className="w-full h-12 pl-4 pr-10 border rounded-md bg-background"
                    />
                </div>
                <Button
                    onClick={handleCustomSubmit}
                    disabled={!customEmoji}
                >
                    Add
                </Button>
            </div>
        </div>
    );
}; 