// PRD: TrackStreaks
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { ICheckIn } from "@/models/CheckIn";

// Interface for the date-based check-in map used by the heatmap
export interface CheckInMap {
  [date: string]: number; // date in YYYY-MM-DD format -> count
}

// Interface for loop statistics
export interface LoopStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  expectedCheckIns: number;
  completionRate: number;
  checkInsByDate: CheckInMap;
  startDate: string;
}

// Interface for the check-in store state
interface CheckInState {
  // State
  checkIns: ICheckIn[];
  isLoadingCheckIns: boolean;
  isSubmittingCheckIn: boolean;
  loopStats: Record<string, LoopStats>;
  isLoadingStats: boolean;
  error: string | null;

  // Actions
  fetchCheckIns: (loopId: string) => Promise<ICheckIn[]>;
  submitCheckIn: (loopId: string, date?: Date) => Promise<ICheckIn | null>;
  deleteCheckIn: (loopId: string, checkInDate: Date) => Promise<boolean>;
  fetchLoopStats: (loopId: string) => Promise<LoopStats | null>;
  clearError: () => void;
}

export const useCheckInStore = create<CheckInState>()(
  devtools(
    immer((set, get) => ({
      // State
      checkIns: [],
      isLoadingCheckIns: false,
      isSubmittingCheckIn: false,
      loopStats: {},
      isLoadingStats: false,
      error: null,

      // Actions
      fetchCheckIns: async (loopId: string) => {
        set({ isLoadingCheckIns: true, error: null });
        try {
          console.log("jjjjjjj");
          const response = await fetch(`/api/loops/${loopId}/checkin`);

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Authentication required");
            }
            throw new Error("Failed to fetch check-ins");
          }

          const data = await response.json();
          set({ checkIns: data.checkIns, isLoadingCheckIns: false });
          return data.checkIns;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isLoadingCheckIns: false,
          });
          return [];
        }
      },

      submitCheckIn: async (loopId: string, date?: Date) => {
        set({ isSubmittingCheckIn: true, error: null });

        try {
          // Use current date if not specified
          const checkInDate = date || new Date();

          const response = await fetch(`/api/loops/${loopId}/checkin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: checkInDate.toISOString() }),
          });
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Authentication required");
            }
            throw new Error("Failed to submit check-in");
          }

          const data = await response.json();

          // Update local state with new check-in
          set((state) => {
            // Add the new check-in to the array if it doesn't already exist
            const exists = state.checkIns.some(
              (c) =>
                c.loopId.toString() === loopId &&
                new Date(c.date).toDateString() ===
                  new Date(data.checkIn.date).toDateString()
            );

            if (!exists) {
              state.checkIns.push(data.checkIn);
            }

            // Update the loop stats with new streak information
            if (state.loopStats[loopId]) {
              state.loopStats[loopId].currentStreak = data.currentStreak;
              state.loopStats[loopId].longestStreak = data.longestStreak;

              // Update the checkInsByDate map
              const dateStr = new Date(data.checkIn.date)
                .toISOString()
                .split("T")[0];
              state.loopStats[loopId].checkInsByDate[dateStr] = 1;

              // Increment total check-ins
              state.loopStats[loopId].totalCheckIns++;

              // Recalculate completion rate
              if (state.loopStats[loopId].expectedCheckIns > 0) {
                state.loopStats[loopId].completionRate = Math.round(
                  (state.loopStats[loopId].totalCheckIns /
                    state.loopStats[loopId].expectedCheckIns) *
                    100
                );
              }
            }

            state.isSubmittingCheckIn = false;
          });

          return data.checkIn;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isSubmittingCheckIn: false,
          });
          return null;
        }
      },

      deleteCheckIn: async (loopId: string, checkInDate: Date) => {
        set({ isSubmittingCheckIn: true, error: null });

        try {
          // Format date as ISO string for URL
          const dateParam = encodeURIComponent(checkInDate.toISOString());

          const response = await fetch(
            `/api/loops/${loopId}/checkin/${dateParam}`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Authentication required");
            }
            throw new Error("Failed to delete check-in");
          }

          const data = await response.json();

          // Update local state by removing the deleted check-in
          set((state) => {
            // Remove the check-in with matching date
            state.checkIns = state.checkIns.filter(
              (c) =>
                !(
                  c.loopId.toString() === loopId &&
                  new Date(c.date).toDateString() === checkInDate.toDateString()
                )
            );

            // Update streak information
            if (state.loopStats[loopId]) {
              state.loopStats[loopId].currentStreak = data.currentStreak;
              state.loopStats[loopId].longestStreak = data.longestStreak;

              // Update the checkInsByDate map
              const dateStr = checkInDate.toISOString().split("T")[0];
              delete state.loopStats[loopId].checkInsByDate[dateStr];

              // Decrement total check-ins
              state.loopStats[loopId].totalCheckIns = Math.max(
                0,
                state.loopStats[loopId].totalCheckIns - 1
              );

              // Recalculate completion rate
              if (state.loopStats[loopId].expectedCheckIns > 0) {
                state.loopStats[loopId].completionRate = Math.round(
                  (state.loopStats[loopId].totalCheckIns /
                    state.loopStats[loopId].expectedCheckIns) *
                    100
                );
              }
            }

            state.isSubmittingCheckIn = false;
          });

          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isSubmittingCheckIn: false,
          });
          return false;
        }
      },

      fetchLoopStats: async (loopId: string) => {
        set({ isLoadingStats: true, error: null });

        try {
          const response = await fetch(`/api/loops/${loopId}/stats`);

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error("Authentication required");
            }
            throw new Error("Failed to fetch loop statistics");
          }

          const stats = await response.json();

          set((state) => {
            state.loopStats[loopId] = stats;
            state.isLoadingStats = false;
          });

          return stats;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "An error occurred",
            isLoadingStats: false,
          });
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }))
  )
);
