// PRD: CreateLoop, TrackStreaks
import { ILoop } from "@/models/Loop";
import { formatDistanceToNow } from "date-fns";
import { useCheckInStore } from "@/store";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface LoopCardProps {
  loop: ILoop;
}

// Helper function to format frequency display
function formatFrequency(frequency: string | string[]): string {
  if (typeof frequency === "string") {
    // Handle predefined frequency options
    switch (frequency) {
      case "daily":
        return "Every day";
      case "weekdays":
        return "Weekdays";
      case "3x/week":
        return "3 times per week";
      default:
        return frequency;
    }
  } else if (Array.isArray(frequency)) {
    // Format custom frequency (days array)
    return frequency
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(", ");
  }
  return "Custom";
}

// Get status based on current streak
function getLoopStatus(currentStreak: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (currentStreak > 0) {
    return {
      label: "Active",
      color: "bg-green-100 text-green-800",
      emoji: "🟩",
    };
  } else {
    return {
      label: "Not started",
      color: "bg-gray-100 text-gray-800",
      emoji: "⬜",
    };
  }
}

export default function LoopCard({ loop }: LoopCardProps) {
  const { submitCheckIn, isSubmittingCheckIn, error } = useCheckInStore();
  const [checkInStatus, setCheckInStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const router = useRouter();

  // Determine loop status
  const status = getLoopStatus(loop.currentStreak || 0);

  // Handle check-in
  const handleCheckIn = async () => {
    try {
      setCheckInStatus("idle");

      // Optimistic UI update
      const optimisticStatus = {
        label: "Active",
        color: "bg-green-100 text-green-800",
        emoji: "🟩",
      };

      // Submit check-in to the API
      const result = await submitCheckIn(loop._id.toString());
      if (result) {
        setCheckInStatus("success");
        // Show success feedback briefly
        setTimeout(() => setCheckInStatus("idle"), 2000);
      } else {
        setCheckInStatus("error");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      setCheckInStatus("error");
    }
  };

  // Navigate to loop detail/stats page
  const handleViewStats = () => {
    router.push(`/loops/${loop._id}`);
  };

  return (
    <div className="border rounded-lg p-5 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-3xl">{loop.iconEmoji || "📝"}</div>
          <h3 className="text-lg font-medium line-clamp-1">{loop.title}</h3>
        </div>

        {/* Status badge */}
        <div className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
          {status.emoji} {status.label}
        </div>
      </div>

      <div className="mt-3 text-sm text-muted-foreground space-y-1">
        <p>
          <strong>Frequency:</strong> {formatFrequency(loop.frequency)}
        </p>
        <p>
          <strong>Started:</strong>{" "}
          {formatDistanceToNow(new Date(loop.startDate), { addSuffix: true })}
        </p>
        <p>
          <strong>Visibility:</strong>{" "}
          {loop.visibility.charAt(0).toUpperCase() + loop.visibility.slice(1)}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <div className="text-sm">
          <p>
            <strong>Current streak:</strong> {loop.currentStreak || 0} days
          </p>
          <p>
            <strong>Longest streak:</strong> {loop.longestStreak || 0} days
          </p>
        </div>

        {/* Check-in button */}
        <div className="flex gap-2">
          <button
            onClick={handleViewStats}
            className="px-3 py-1 border rounded-md text-sm hover:bg-secondary"
          >
            Stats
          </button>
          <button
            onClick={handleCheckIn}
            disabled={isSubmittingCheckIn}
            className={`px-3 py-1 rounded-md text-sm transition-all ${
              checkInStatus === "success"
                ? "bg-green-600 text-white"
                : checkInStatus === "error"
                  ? "bg-red-600 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isSubmittingCheckIn
              ? "Saving..."
              : checkInStatus === "success"
                ? "Done ✓"
                : checkInStatus === "error"
                  ? "Error!"
                  : "Mark Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
