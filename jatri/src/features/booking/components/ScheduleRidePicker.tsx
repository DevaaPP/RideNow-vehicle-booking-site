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
    <div className="bg-[#FAF7F0] dark:bg-[#0B2822] border border-[#DED7CA] dark:border-[#1E3E34] rounded-[10px] p-2 mb-3 shadow-xs">
      <div className="flex bg-[#EFE9DC] dark:bg-[#061A16] p-1 rounded-[8px] gap-1">
        <button
          type="button"
          onClick={() => onModeChange("now")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            bookingMode === "now"
              ? "bg-white dark:bg-[#10352C] text-[#123D32] dark:text-[#F7F5ED] shadow-xs"
              : "text-[#696B64] dark:text-[#B9C8BF] hover:text-[#10251C] dark:hover:text-white"
          }`}
        >
          <Clock size={13} className={bookingMode === "now" ? "text-[#046A38]" : ""} />
          <span>Ride Now</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("schedule")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
            bookingMode === "schedule"
              ? "bg-[#046A38] text-white font-bold shadow-xs"
              : "text-[#696B64] dark:text-[#B9C8BF] hover:text-[#10251C] dark:hover:text-white"
          }`}
        >
          <Calendar size={13} />
          <span>Schedule Later</span>
        </button>
      </div>

      {bookingMode === "schedule" && (
        <div className="mt-2.5 pt-2 border-t border-[#DED7CA] dark:border-[#1E3E34] px-1 space-y-1">
          <label className="text-[10px] font-bold text-[#696B64] dark:text-[#B9C8BF] uppercase tracking-wider block">
            Pickup Date & Time (Min 25 min ahead)
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            min={minScheduledTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full text-xs font-bold bg-white dark:bg-[#061A16] border border-[#DED7CA] dark:border-[#1E3E34] rounded-[8px] px-3 py-2 text-[#10251C] dark:text-[#F7F5ED] outline-none focus:border-[#046A38]"
          />
        </div>
      )}
    </div>
  );
}
