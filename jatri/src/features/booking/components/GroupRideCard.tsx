"use client";

import { motion } from "framer-motion";
import { Users, Share2, IndianRupee, UserPlus, Loader2 } from "lucide-react";

interface GroupRideCardProps {
  isGroupRide: boolean;
  effectiveFare: number;
  fare: number;
  groupInviteCode: string | null;
  groupMembers: any[];
  splitFarePerPerson: number | null;
  inviteName: string;
  inviteEmail: string;
  inviting: boolean;
  onToggle: () => void;
  onNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onSendInvite: () => void;
}

export default function GroupRideCard({
  isGroupRide,
  effectiveFare,
  fare,
  groupInviteCode,
  groupMembers,
  splitFarePerPerson,
  inviteName,
  inviteEmail,
  inviting,
  onToggle,
  onNameChange,
  onEmailChange,
  onSendInvite,
}: GroupRideCardProps) {
  return (
    <div className="mt-6 border-t border-zinc-100 pt-6">
      <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900">Group Ride & Split Fare</h4>
            <p className="text-xs text-zinc-400 font-medium">Split ₹{effectiveFare} with friends</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 ${
            isGroupRide ? "bg-emerald-500 justify-end" : "bg-zinc-300 justify-start"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {isGroupRide && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-zinc-900 rounded-2xl p-5 text-white space-y-4"
        >
          {/* Invite Code Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Invite Code</p>
              <p className="text-lg font-black text-emerald-400 font-mono tracking-widest">
                {groupInviteCode || "GEN123"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window === "undefined") return;
                const codeStr = groupInviteCode || "GEN123";
                const joinUrl = `${window.location.origin}/group/join?code=${codeStr}`;
                navigator.clipboard.writeText(joinUrl);
                alert(`Group invite link copied!\n${joinUrl}`);
              }}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-700 transition"
            >
              <Share2 size={13} /> Copy Link
            </button>
          </div>

          {/* Dynamic Per-Person Split Banner */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
              Split Fare Per Person
            </p>
            <p className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
              <IndianRupee size={18} /> {splitFarePerPerson || fare}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Total ₹{fare} ÷{" "}
              {Math.max(1, groupMembers.filter((m: any) => m.status !== "declined").length)} members
            </p>
          </div>

          {/* Member List */}
          {groupMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Group Members</p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {groupMembers.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-zinc-800/80 px-3 py-2 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-bold text-white truncate max-w-[160px]">{m.name}</p>
                      <p className="text-[10px] text-zinc-400">{m.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          m.status === "creator"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : m.status === "accepted"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {m.status}
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">₹{m.shareAmount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Friend Input */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Invite a Friend</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Friend Name"
                value={inviteName}
                onChange={(e) => onNameChange(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-2 rounded-xl text-white outline-none"
              />
              <input
                type="email"
                placeholder="Friend Email"
                value={inviteEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs px-3 py-2 rounded-xl text-white outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onSendInvite}
              disabled={inviting || !inviteEmail || !inviteName}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              {inviting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <UserPlus size={14} /> Send Invite
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
