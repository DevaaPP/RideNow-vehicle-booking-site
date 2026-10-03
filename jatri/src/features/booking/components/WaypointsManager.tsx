"use client";

import { Plus, X, MapPin } from "lucide-react";

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
  maxStops?: number;
}

export default function WaypointsManager({
  stops,
  onAddStop,
  onRemoveStop,
  onStopChange,
  onSelectStopPlace,
  maxStops = 2,
}: WaypointsManagerProps) {
  return (
    <div className="space-y-2">
      {stops.map((stop, idx) => (
        <div key={stop.id} className="relative">
          <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-200/80 rounded-2xl px-3 py-2">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
              {idx + 1}
            </div>
            <input
              type="text"
              placeholder={`Stop ${idx + 1} address...`}
              value={stop.address}
              onChange={(e) => onStopChange(stop.id, e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-zinc-900 placeholder-zinc-400 font-medium"
            />
            <button
              type="button"
              onClick={() => onRemoveStop(stop.id)}
              className="w-6 h-6 rounded-full hover:bg-blue-200/60 text-blue-700 flex items-center justify-center flex-shrink-0"
            >
              <X size={13} />
            </button>
          </div>

          {/* Autocomplete dropdown for this stop */}
          {stop.results && stop.results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-48 overflow-y-auto">
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

      {stops.length < maxStops && (
        <button
          type="button"
          onClick={onAddStop}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition"
        >
          <Plus size={13} />
          <span>Add Stop (max {maxStops})</span>
        </button>
      )}
    </div>
  );
}
