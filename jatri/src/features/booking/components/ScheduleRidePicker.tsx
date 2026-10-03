"use client";

import { Clock, Calendar } from "lucide-react";

interface ScheduleRidePickerProps {
  bookingMode: "now" | "schedule";
  onModeChange: (mode: "now" | "schedule") => void;
  scheduledTime: string;
  onTimeChange: (time: string) => void;
  minScheduledTime: string;
}

export default function ScheduleRidePicker({
  bookingMode,
  onModeChange,
  scheduledTime,
  onTimeChange,
  minScheduledTime,
}: ScheduleRidePickerProps) {
  return (
    <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-2.5 mb-3">
      <div className="flex bg-zinc-200/70 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => onModeChange("now")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            bookingMode === "now"
              ? "bg-white text-zinc-900 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Clock size={13} />
          <span>Ride Now</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("schedule")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            bookingMode === "schedule"
              ? "bg-amber-500 text-zinc-950 font-black shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Calendar size={13} />
          <span>Schedule Later</span>
        </button>
      </div>

      {bookingMode === "schedule" && (
        <div className="mt-2.5 pt-2 border-t border-zinc-200/80 px-1 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
            Pickup Date & Time (Min 25 min ahead)
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            min={minScheduledTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-zinc-300 rounded-xl px-3 py-2 text-zinc-900 outline-none focus:border-zinc-900"
          />
        </div>
      )}
    </div>
  );
}
