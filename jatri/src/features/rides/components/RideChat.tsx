"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCheck, Clock, ChevronDown, Sparkles, X } from "lucide-react";
import axios from "axios";
import { getSocket } from "@/lib/socket";

interface Message {
  id: string;
  text: string;
  sender: "user" | "driver";
  createdAt: Date | string;
  status?: "sent" | "delivered" | "read";
}

interface RideChatProps {
  currentRole: "user" | "driver";
  driverName?: string;
  userName?: string;
  rideId: string;
}

const QUICK_REPLIES = ["On my way!", "5 mins away", "At the gate", "Please wait", "Almost there"];

const AI_SUGGESTIONS = [
  "I'm stuck in traffic, will be 10 mins late.",
  "Please share your exact location.",
  "I've arrived at the pickup point.",
  "Can you come to the main gate?",
];

export default function RideChat({
  currentRole,
  rideId,
  driverName = "Driver",
  userName = "Passenger",
}: RideChatProps) {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showAI, setShowAI]           = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!rideId) return;
    const socket = getSocket();

    // 1. Join booking room on socket server
    socket.emit("join-booking", rideId);

    // 2. Fetch all historical messages for this ride
    axios
      .post(`/api/chat/get-all`, { rideId })
      .then(res => {
        if (res.data?.messages) {
          setMessages(res.data.messages.map((m: any) => ({
            id: m._id || m.id,
            text: m.text,
            sender: m.sender,
            createdAt: m.createdAt,
            status: "delivered",
          })));
        }
      })
      .catch(err => console.error("Error fetching chat messages:", err));

    // 3. Listen for real-time incoming messages
    const handleIncomingMessage = (message: any) => {
      const msgRideId = String(message.rideId || message.bookingId || "");
      if (msgRideId === String(rideId)) {
        setMessages(prev => {
          const msgId = message._id || message.id;
          if (msgId && prev.some(m => m.id === msgId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: msgId || `msg_${Date.now()}_${Math.random()}`,
              text: message.text,
              sender: message.sender,
              createdAt: message.createdAt || new Date(),
              status: "delivered",
            },
          ];
        });
      }
    };

    socket.on("chat-message", handleIncomingMessage);

    return () => {
      socket.off("chat-message", handleIncomingMessage);
    };
  }, [rideId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !rideId) return;
    const socket = getSocket();

    try {
      const res = await axios.post("/api/chat/send", {
        rideId,
        text,
        sender: currentRole,
      });

      const message = res.data?.message;
      if (message) {
        socket.emit("chat-message", {
          ...message,
          rideId,
        });

        setMessages(prev => {
          const msgId = message._id || message.id;
          if (msgId && prev.some(m => m.id === msgId)) {
            return prev;
          }
          return [
            ...prev,
            {
              id: msgId || `msg_${Date.now()}`,
              text: message.text,
              sender: message.sender,
              createdAt: message.createdAt || new Date(),
              status: "sent",
            },
          ];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
   
    setInput("");
    setShowAI(false);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 80);
  };

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const formatTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateInput: Date | string) => {
    const date      = new Date(dateInput);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString())     return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const grouped = messages.reduce((acc, msg) => {
    const d = formatDate(msg.createdAt);
    if (!acc[d]) acc[d] = [];
    acc[d].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  const otherName    = currentRole === "user" ? driverName : userName;
  const otherInitial = otherName.charAt(0).toUpperCase();
  const myInitial    = (currentRole === "user" ? userName : driverName).charAt(0).toUpperCase();

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] overflow-hidden border border-[#DED7CA] dark:border-[#34443A]">

      {/* ── HEADER ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-[#FAF7F0] dark:bg-[#17211B] border-b border-[#DED7CA] dark:border-[#34443A]">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] flex items-center justify-center text-white text-xs font-bold">
            {otherInitial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#17211B]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#10251C] dark:text-[#F3F1E8] leading-none">{otherName}</p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Active now</p>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F7F1E5] dark:bg-[#101713]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
            <div className="w-12 h-12 rounded-[10px] bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] flex items-center justify-center">
              <Send size={18} className="text-[#696B64] dark:text-[#929D93]" />
            </div>
            <p className="text-sm text-[#10251C] dark:text-[#F3F1E8] font-bold">No messages yet</p>
            <p className="text-xs text-[#696B64] dark:text-[#929D93]">Start the conversation below</p>
          </div>
        )}

        {Object.entries(grouped).map(([date, dateMessages]) => (
          <div key={date} className="space-y-2">

            {/* Date separator */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[#DED7CA] dark:bg-[#34443A]" />
              <span className="text-[10px] text-[#696B64] dark:text-[#929D93] font-semibold uppercase tracking-widest">
                {date}
              </span>
              <div className="flex-1 h-px bg-[#DED7CA] dark:bg-[#34443A]" />
            </div>

            {dateMessages.map((msg, idx) => {
              const isMine = msg.sender === currentRole;
              const isLast = idx === dateMessages.length - 1 ||
                dateMessages[idx + 1]?.sender !== msg.sender;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {/* Their avatar */}
                  {!isMine && (
                    <div className="w-6 flex-shrink-0 self-end mb-0.5">
                      {isLast ? (
                        <div className="w-6 h-6 rounded-[6px] bg-[#123D32] dark:bg-[#28664D] flex items-center justify-center text-white text-[9px] font-bold">
                          {otherInitial}
                        </div>
                      ) : <div className="w-6" />}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[72%] px-3.5 py-2.5 text-sm leading-relaxed rounded-[12px] shadow-xs ${
                    isMine
                      ? "bg-[#123D32] dark:bg-[#28664D] text-white rounded-br-[2px]"
                      : "bg-[#FAF7F0] dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] text-[#10251C] dark:text-[#F3F1E8] rounded-bl-[2px]"
                  }`}>
                    <p className="break-words">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMine ? "text-white/70" : "text-[#696B64] dark:text-[#929D93]"
                    }`}>
                      <span>{formatTime(msg.createdAt)}</span>
                      {isMine && (
                        <>
                          {msg.status === "sent"      && <Clock size={9} />}
                          {msg.status === "delivered" && <CheckCheck size={10} className="text-white/70" />}
                          {msg.status === "read"      && <CheckCheck size={10} className="text-emerald-300" />}
                        </>
                      )}
                    </div>
                  </div>

                  {/* My avatar */}
                  {isMine && (
                    <div className="w-6 flex-shrink-0 self-end mb-0.5">
                      {isLast ? (
                        <div className="w-6 h-6 rounded-[6px] bg-[#E5EBDD] dark:bg-[#1D3428] flex items-center justify-center text-[#123D32] dark:text-[#D7AC62] text-[9px] font-bold">
                          {myInitial}
                        </div>
                      ) : <div className="w-6" />}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div className="w-6 h-6 rounded-[6px] bg-[#123D32] dark:bg-[#28664D] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                {otherInitial}
              </div>
              <div className="bg-[#FAF7F0] dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] rounded-[12px] rounded-bl-[2px] px-4 py-3 shadow-xs">
                <div className="flex gap-1 items-center h-3">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="block w-1.5 h-1.5 bg-[#696B64] dark:bg-[#929D93] rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />

        {/* Scroll to bottom */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="sticky bottom-2 ml-auto flex items-center justify-center w-7 h-7 bg-[#123D32] dark:bg-[#28664D] text-white rounded-full shadow-lg transition-colors cursor-pointer"
            >
              <ChevronDown size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI SUGGESTIONS PANEL ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 overflow-hidden border-t border-[#DED7CA] dark:border-[#34443A] bg-[#FAF7F0] dark:bg-[#17211B]"
          >
            <div className="px-4 pt-3 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#123D32] dark:text-[#D7AC62]" />
                  <span className="text-[11px] font-bold text-[#10251C] dark:text-[#F3F1E8] uppercase tracking-wider">
                    Quick Suggestions
                  </span>
                </div>
                <button onClick={() => setShowAI(false)} className="text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8] cursor-pointer">
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {AI_SUGGESTIONS.map(s => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setInput(s); setShowAI(false); }}
                    className="text-left text-xs text-[#10251C] dark:text-[#F3F1E8] bg-white dark:bg-[#1E2B23] hover:bg-[#E5EBDD] dark:hover:bg-[#25362C] border border-[#DED7CA] dark:border-[#34443A] px-3 py-2 rounded-[8px] transition-all cursor-pointer font-medium"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QUICK REPLIES ── */}
      <div
        className="flex-shrink-0 flex gap-2 px-4 pt-3 pb-2 bg-[#FAF7F0] dark:bg-[#17211B] border-t border-[#DED7CA] dark:border-[#34443A] overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {QUICK_REPLIES.map(reply => (
          <button
            key={reply}
            onClick={() => sendMessage(reply)}
            className="flex-shrink-0 text-[11px] font-bold text-[#10251C] dark:text-[#F3F1E8] bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] hover:bg-[#E5EBDD] dark:hover:bg-[#25362C] active:scale-95 px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* ── INPUT ── */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 bg-[#FAF7F0] dark:bg-[#17211B]">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] rounded-[10px] pl-3 pr-1.5 py-1.5">

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAI(v => !v)}
            className={`flex-shrink-0 w-8 h-8 rounded-[6px] flex items-center justify-center transition-all cursor-pointer ${
              showAI
                ? "bg-[#123D32] dark:bg-[#28664D] text-white"
                : "bg-[#FAF7F0] dark:bg-[#17211B] text-[#123D32] dark:text-[#D7AC62] hover:bg-[#E5EBDD] dark:hover:bg-[#25362C] border border-[#DED7CA] dark:border-[#34443A]"
            }`}
          >
            <Sparkles size={14} />
          </motion.button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Message…"
            className="flex-1 bg-transparent text-sm text-[#10251C] dark:text-[#F3F1E8] placeholder:text-[#696B64] dark:placeholder:text-[#929D93] focus:outline-none py-1.5 min-w-0"
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className={`flex-shrink-0 w-8 h-8 rounded-[6px] flex items-center justify-center transition-all cursor-pointer ${
              input.trim()
                ? "bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-white"
                : "bg-transparent text-[#696B64] dark:text-[#929D93] opacity-40 cursor-not-allowed"
            }`}
          >
            <Send size={14} />
          </motion.button>
        </div>
      </div>

    </div>
  );
}