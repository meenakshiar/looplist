# TrackStreaks Components

This directory contains the UI components for the Track Your Streaks feature of LoopList, which enables users to mark daily habit completions and visualize their streak progress.

## Component Overview

### LoopCard.tsx
A card component displaying a loop with its basic information and a check-in button that allows users to mark the loop as done for the current day. Features optimistic UI updates for a smooth user experience.

### LoopStats.tsx
Displays detailed statistics for a loop, including:
- Current streak
- Longest streak
- Completion rate
- Total check-ins
- GitHub-style heatmap calendar showing check-in activity

### CheckInHistory.tsx
Shows a detailed history of a user's check-ins for a specific loop, allowing them to:
- View past check-ins with dates and times
- Delete check-ins if needed (which will recalculate streak metrics)

## Usage

These components are used in the following pages:
- Dashboard page (`/app/dashboard/page.tsx`) - Shows the LoopCard with check-in functionality
- Loop detail page (`/app/loops/[id]/page.tsx`) - Shows the LoopStats and CheckInHistory

## Data Flow

1. User clicks "Mark Done" on a LoopCard
2. The UI optimistically updates to show success
3. The action is dispatched to the `useCheckInStore`
4. An API request is sent to `/api/loops/:id/checkin`
5. The backend calculates streak metrics and returns updated values
6. The store updates with the new streak information

## Design Principles

- **Low Friction**: One-tap check-in for easy daily habit tracking
- **Visual Feedback**: Immediate UI response to make check-ins rewarding
- **Data Visualization**: Calendar heatmap to visualize long-term progress
- **Accountability**: Clear streak metrics to motivate continued engagement 