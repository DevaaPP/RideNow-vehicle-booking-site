import React from "react";

export function RideCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-none border border-zinc-200 overflow-hidden shadow-xs animate-pulse"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-zinc-50 border-b border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-zinc-200 rounded-none" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-zinc-200 rounded-none" />
                <div className="h-3 w-20 bg-zinc-200 rounded-none" />
              </div>
            </div>
            <div className="h-6 w-20 bg-zinc-200 rounded-none" />
          </div>

          {/* Route Section */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex gap-3">
              <div className="flex flex-col items-center pt-1 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-none bg-zinc-400" />
                <div className="w-0.5 h-8 bg-zinc-200 my-1" />
                <div className="w-2.5 h-2.5 rounded-none bg-zinc-300" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-1.5">
                  <div className="h-2.5 w-14 bg-zinc-200 rounded-none" />
                  <div className="h-3.5 w-3/4 bg-zinc-200 rounded-none" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 w-14 bg-zinc-200 rounded-none" />
                  <div className="h-3.5 w-2/3 bg-zinc-200 rounded-none" />
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div className="h-4 w-24 bg-zinc-200 rounded-none" />
              <div className="h-6 w-16 bg-zinc-200 rounded-none" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RideCardSkeleton;
