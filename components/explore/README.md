# Explore Components

These components implement the Public Loop Boards feature as described in the core-public-loop-board PRD.

## Component Structure

- **ExploreView** - Main container component that combines all UI elements
- **ExploreHeader** - Header with sorting and filtering controls
- **InfiniteLoopScroll** - Infinite scroll implementation with load more functionality
- **PublicLoopCard** - Individual card component for displaying public loops

## Key Features

1. **Cursor-based Pagination** - Efficiently loads loops in batches as user scrolls
2. **Sorting Options** - Newest, Most Cheered, Longest Streak
3. **Filtering** - By frequency (daily, weekdays, 3x/week, custom)
4. **Social Reactions** - "Cheer" with emoji reactions
5. **Cloning** - Copy others' loops to your own dashboard
6. **Accessibility** - Screen reader support with proper ARIA roles

## Data Flow

1. User navigates to `/explore`
2. `useExploreStore` fetches initial batch of public loops from `/api/explore`
3. As user scrolls, more loops are fetched using the cursor
4. User can interact with loops (react/clone) which updates the database
5. UI updates optimistically and reconciles with server response

## Edge Cases Handled

- Network failures with retry options
- End of content detection
- Concurrent reactions debouncing
- Mobile performance optimization by switching to manual loading after initial batches 