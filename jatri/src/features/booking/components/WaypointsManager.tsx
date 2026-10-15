"use client";

import { Plus, X, MapPin, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

export type StopItem = {
  id: string;
  address: string;
  lat: number | null;
  lng: number | null;
  results: any[];
};

interface WaypointsManagerProps {
  stops: StopItem[];
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onStopChange: (id: string, value: string) => void;
  onSelectStopPlace: (stopId: string, place: any) => void;
  onMoveStopUp?: (stopIndex: number) => void;
  onMoveStopDown?: (stopIndex: number) => void;
  maxStops?: number;
  hideAddButton?: boolean;
}

export default function WaypointsManager({
  stops,
  onAddStop,
  onRemoveStop,
  onStopChange,
  onSelectStopPlace,
  onMoveStopUp,
  onMoveStopDown,
  maxStops = 2,
  hideAddButton = false,
}: WaypointsManagerProps) {
  return (
    <div className="space-y-2">
      {stops.map((stop, idx) => (
        <div key={stop.id} className="relative">
          <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-300 rounded-none px-3.5 py-2 min-h-[46px] focus-within:border-zinc-950 focus-within:bg-white transition-all shadow-none">
            <div className="w-5 h-5 rounded-none bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {idx + 1}
            </div>
            {(onMoveStopUp || onMoveStopDown) && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => onMoveStopUp?.(idx)}
                    title={idx === 0 ? "Move up (promote to pickup)" : "Move stop up"}
                    className="w-4 h-3 flex items-center justify-center text-zinc-600 hover:text-black transition cursor-pointer"
                  >
                    <ChevronUp size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveStopDown?.(idx)}
                    title={idx === stops.length - 1 ? "Move down (demote to drop)" : "Move stop down"}
                    className="w-4 h-3 flex items-center justify-center text-zinc-600 hover:text-black transition cursor-pointer"
                  >
                    <ChevronDown size={11} />
                  </button>
                </div>
                <GripVertical size={12} className="text-zinc-400 select-none flex-shrink-0" />
              </div>
            )}
            <input
              type="text"
              placeholder={`Stop ${idx + 1} address...`}
              value={stop.address}
              onChange={(e) => onStopChange(stop.id, e.target.value)}
              className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none text-zinc-900 placeholder-zinc-400 tracking-tight"
            />
            <button
              type="button"
              onClick={() => onRemoveStop(stop.id)}
              className="w-6 h-6 rounded-none hover:bg-zinc-200/60 text-zinc-600 hover:text-black flex items-center justify-center flex-shrink-0 transition cursor-pointer"
              title="Remove stop"
            >
              <X size={14} />
            </button>
          </div>

          {/* Autocomplete dropdown for this stop */}
          {stop.results && stop.results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-none shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto">
              {stop.results.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectStopPlace(stop.id, p)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-zinc-50 text-left border-b border-zinc-100 last:border-none"
                >
                  <MapPin size={14} className="text-zinc-400 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-zinc-800 truncate">{p.title || p.name}</p>
                    {p.subtitle && (
                      <p className="text-[10px] text-zinc-400 truncate">{p.subtitle}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {!hideAddButton && stops.length < maxStops && (
        <button
          type="button"
          onClick={onAddStop}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 px-3 py-1.5 rounded-none border border-dashed border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 transition cursor-pointer"
        >
          <Plus size={13} />
          <span>Add Stop (max {maxStops})</span>
        </button>
      )}
    </div>
  );
}
