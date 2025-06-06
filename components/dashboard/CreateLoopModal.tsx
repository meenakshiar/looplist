"use client";
import { useState } from 'react';
import { useLoopStore } from '@/store';
import { X, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface CreateLoopModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const FREQUENCY_OPTIONS = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekdays', label: 'Weekdays' },
    { id: '3x/week', label: '3x/week' },
    { id: 'custom', label: 'Custom' },
];

const WEEKDAYS = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];

const VISIBILITY_OPTIONS = [
    { id: 'private', label: 'Private' },
    { id: 'public', label: 'Public' },
    { id: 'friends', label: 'Friends Only' },
];

// Default emoji options to choose from
const DEFAULT_EMOJIS = ['📝', '📚', '🏃', '💪', '🧘', '🍎', '💧', '😴', '🧠', '🎯'];

export default function CreateLoopModal({ isOpen, onClose }: CreateLoopModalProps) {
    const {
        createLoopForm,
        validationErrors,
        isCreating,
        setFormField,
        createLoop,
    } = useLoopStore();

    // Local state for custom frequency
    const [isCustomFrequency, setIsCustomFrequency] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    // For the date picker
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If using custom frequency, update the form with the selected days
        if (isCustomFrequency) {
            setFormField('frequency', selectedDays);
        }

        // Create the loop
        try {
            const result = await createLoop();
            if (result) {
                // Success - show browser notification if available
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Loop Created', {
                        body: `Your loop "${result.title}" was created successfully!`
                    });
                }
                onClose();
            }
        } catch (error) {
            console.error('Failed to create loop:', error);
        }
    };

    // Handle frequency selection
    const handleFrequencyChange = (frequency: string) => {
        if (frequency === 'custom') {
            setIsCustomFrequency(true);
            // Set default selection for 3x/week (Mon, Wed, Fri)
            setSelectedDays(['mon', 'wed', 'fri']);
            setFormField('frequency', ['mon', 'wed', 'fri']);
        } else {
            setIsCustomFrequency(false);
            setFormField('frequency', frequency);
        }
    };

    // Handle custom day selection
    const handleDayToggle = (day: string) => {
        const newSelectedDays = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];

        setSelectedDays(newSelectedDays);
        setFormField('frequency', newSelectedDays);
    };

    // Handle date selection from the date picker
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setFormField('startDate', date);
            setIsDatePickerOpen(false);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji: string) => {
        setFormField('iconEmoji', emoji);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-auto border-2 border-orange-400">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Create New Loop</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium">
                            Loop Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={createLoopForm.title}
                            onChange={(e) => setFormField('title', e.target.value)}
                            placeholder="Read 10 pages"
                            className="w-full p-2 border rounded-md"
                            maxLength={100}
                        />
                        {validationErrors.title && (
                            <p className="text-red-500 text-sm">{validationErrors.title}</p>
                        )}
                    </div>

                    {/* Frequency Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Frequency</label>
                        <div className="grid grid-cols-4 gap-2">
                            {FREQUENCY_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleFrequencyChange(option.id)}
                                    className={`py-2 px-3 rounded-md text-sm ${(isCustomFrequency && option.id === 'custom') ||
                                        (!isCustomFrequency && createLoopForm.frequency === option.id)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Custom day selection */}
                        {isCustomFrequency && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                                <p className="text-sm font-medium mb-2">Select days:</p>
                                <div className="flex flex-wrap gap-2">
                                    {WEEKDAYS.map((day) => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => handleDayToggle(day.id)}
                                            className={`py-1 px-2 rounded-md text-xs ${selectedDays.includes(day.id)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background text-muted-foreground hover:bg-background/80'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                                {validationErrors.frequency && (
                                    <p className="text-red-500 text-sm mt-2">{validationErrors.frequency}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Start Date Picker */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Start Date</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                className="w-full flex items-center justify-between p-2 border rounded-md text-left"
                            >
                                <span>
                                    {createLoopForm.startDate
                                        ? format(new Date(createLoopForm.startDate), 'PPP')
                                        : 'Select date'}
                                </span>
                                <Calendar size={16} />
                            </button>

                            {isDatePickerOpen && (
                                <div className="absolute z-10 mt-1 bg-background border rounded-md shadow-lg">
                                    <DayPicker
                                        mode="single"
                                        selected={new Date(createLoopForm.startDate)}
                                        onSelect={handleDateSelect}
                                        className="p-2"
                                    />
                                </div>
                            )}

                            {validationErrors.startDate && (
                                <p className="text-red-500 text-sm">{validationErrors.startDate}</p>
                            )}
                        </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Visibility</label>
                        <div className="grid grid-cols-3 gap-2">
                            {VISIBILITY_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setFormField('visibility', option.id as any)}
                                    className={`py-2 px-3 rounded-md text-sm ${createLoopForm.visibility === option.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon Emoji Picker */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Icon</label>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 flex items-center justify-center text-2xl border rounded-md">
                                {createLoopForm.iconEmoji}
                            </div>
                            <span className="text-sm text-muted-foreground">Select an emoji:</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {DEFAULT_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleEmojiSelect(emoji)}
                                    className={`w-8 h-8 flex items-center justify-center text-xl rounded-md ${createLoopForm.iconEmoji === emoji
                                        ? 'bg-primary/20 border-2 border-primary'
                                        : 'bg-muted hover:bg-muted/80'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 border rounded-md text-muted-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
                        >
                            {isCreating ? 'Creating...' : 'Create Loop'}
                            {!isCreating && <Check size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 