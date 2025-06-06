// PRD: PublicLoopBoard
'use client';

import { useState } from 'react';
import { useExploreStore, SortOption, FrequencyFilter } from '@/store/slices/exploreSlice';
import { Button } from '@heroui/button';
import { ChevronDown, Filter, XCircle } from 'lucide-react';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
} from '@heroui/dropdown';
import { Badge } from '@heroui/badge';

export const ExploreHeader = () => {
    const { sortBy, frequencyFilter, setSortBy, setFrequencyFilter, resetFilters } = useExploreStore();
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Count the number of active filters
    const activeFilterCount = frequencyFilter !== 'all' ? 1 : 0;

    // Map sort options to display names
    const sortOptions: Record<SortOption, string> = {
        newest: 'Newest',
        mostCheered: 'Most Cheered',
        longestStreak: 'Longest Streak',
    };

    // Map frequency filters to display names
    const frequencyOptions: Record<FrequencyFilter, string> = {
        all: 'All Frequencies',
        daily: 'Daily',
        weekdays: 'Weekdays',
        '3x/week': '3x/week',
        custom: 'Custom',
    };

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border pb-2">
            <div className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Discover Loops</h1>

                    {/* Reset filters button, only shown when filters are active */}
                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="text-muted-foreground"
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reset
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    {/* Sort dropdown */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="flat" size="sm" className="flex-1">
                                Sort: {sortOptions[sortBy]}
                                <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            {Object.entries(sortOptions).map(([value, label]) => (
                                <DropdownItem 
                                    key={value} 
                                    isSelected={value === sortBy}
                                    onPress={() => setSortBy(value as SortOption)}
                                >
                                    {label}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>

                    {/* Filter dropdown */}
                    <Dropdown isOpen={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
                        <DropdownTrigger>
                            <Button variant="flat" size="sm" className="flex-1">
                                <Filter className="mr-1 h-4 w-4" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge variant="faded" className="ml-1 px-1 min-w-5 h-5 text-xs">
                                        {activeFilterCount}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu   className="w-56">
                            <DropdownSection title="Frequency">
                                {Object.entries(frequencyOptions).map(([value, label]) => (
                                    <DropdownItem 
                                        key={value} 
                                        isSelected={value === frequencyFilter}
                                        onPress={() => {
                                            setFrequencyFilter(value as FrequencyFilter);
                                            setIsFilterMenuOpen(false);
                                        }}
                                    >
                                        {label}
                                    </DropdownItem>
                                ))}
                            </DropdownSection>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
}; 