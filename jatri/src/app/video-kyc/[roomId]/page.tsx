"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
  PhoneOff,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { setUserData } from "@/redux/userSlice";
import axios from "axios";

export default function VideoKYCPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const zpRef = useRef<any>(null);
  const joinedRef = useRef(false);

  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);

  const [currentUser, setCurrentUser] = useState<any>(userData || null);

  useEffect(() => {
    axios
      .get("/api/me")
      .then((res) => {
        if (res.data) {
          setCurrentUser(res.data);
          dispatch(setUserData(res.data));
        }
      })
      .catch(() => {});
  }, [dispatch]);

  const roomId =
    typeof params?.roomId === "string"
      ? params.roomId
      : Array.isArray(params?.roomId)
      ? params.roomId[0]
      : null;

  const isAdmin = (currentUser || userData)?.role === "admin";

  const [joined, setJoined] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* ================= CAMERA PREVIEW ================= */


const handleApprove = async () => {
  try {
    setActionLoading(true);

    const res = await fetch("/api/admin/vendors/video-kyc/complete", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        action: "approve",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    zpRef.current?.destroy(); // auto end call
    router.push("/admin/dashboard");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};

const handleReject = async () => {
  if (!rejectReason.trim()) {
    alert("Rejection reason required");
    return;
  }

  try {
    setActionLoading(true);

    const res = await fetch("/api/admin/vendors/video-kyc/complete", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        action: "reject",
        reason: rejectReason,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    zpRef.current?.destroy();
    router.push("/admin/dashboard");
  } catch (err: any) {
    alert(err.message);
  } finally {
    setActionLoading(false);
  }
};

  useEffect(() => {
    if (joined) return;

    let localStream: MediaStream;

    const init = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        setStream(localStream);
        if (previewRef.current) {
          previewRef.current.srcObject = localStream;
        }
      } catch (err) {
        console.error(err);
      }
    };

    init();

    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [joined]);

  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach(
      (track) => (track.enabled = !cameraOn)
    );
    setCameraOn(!cameraOn);
  };

  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach(
      (track) => (track.enabled = !micOn)
    );
    setMicOn(!micOn);
  };

  /* Driver auto-detection: when admin approves or rejects during call */
  useEffect(() => {
    if (isAdmin || !joined) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get("/api/me");
        const me = res.data;
        if (me) {
          if (me.videoKycStatus === "approved") {
            clearInterval(interval);
            zpRef.current?.destroy();
            router.push("/partners/dashboard");
          } else if (me.videoKycStatus === "rejected") {
            clearInterval(interval);
            zpRef.current?.destroy();
            router.push("/partners/dashboard");
          }
        }
      } catch (err) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [isAdmin, joined, router]);

  /* ================= START CALL ================= */

  const startCall = async () => {
    if (!roomId || !containerRef.current) return;
    if (joinedRef.current) return;

    joinedRef.current = true;
    setLoading(true);

    try {
      // Release camera preview tracks so Zego can acquire the webcam hardware
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      const tokenRes = await axios.post("/api/zego/token", { roomId });
      const { token, appID: serverAppID, userID, userName } = tokenRes.data;

      if (!token) {
        throw new Error("Unable to obtain secure video verification session token.");
      }

      const activeUserId =
        userID || (currentUser || userData)?._id?.toString() || `user-${Date.now()}`;
      const activeUserName =
        isAdmin
          ? "Admin"
          : userName || (currentUser || userData)?.name || "Vendor";

      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
        serverAppID || Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID),
        token,
        roomId,
        activeUserId,
        activeUserName
      );

      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zpRef.current = zp;

      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: false,
        onUserJoin: (users: any[]) => {
          if (users && users.length > 0) {
            setRemoteJoined(true);
          }
        },
        onUserLeave: () => {
          setRemoteJoined(false);
        },
        onLeaveRoom: () => {
          if (isAdmin) {
            router.push("/admin/dashboard");
          } else {
            router.push("/partners/dashboard");
          }
        },
      });

      setJoined(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to start call");
      joinedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = () => {
    try {
      zpRef.current?.destroy();
    } catch (e) {}

    if (isAdmin) {
      router.push("/admin/dashboard");
    } else {
      router.push("/partners/dashboard");
    }
  };

  

 

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* HEADER */}
      <header className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 z-20">

        <div className="min-w-0">
          <p className="font-semibold tracking-wider text-sm sm:text-base truncate">
            RideNow
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400 truncate">
            {isAdmin ? "Admin Verification" : "Vendor Video KYC"}
          </p>
        </div>

        {/* HEADER ACTIONS */}
        {joined && (
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 active:scale-95 transition"
                >
                  <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  className="bg-red-600 hover:bg-red-700 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 active:scale-95 transition"
                >
                  <XCircle size={14} className="sm:w-4 sm:h-4" />
                  <span>Reject</span>
                </button>
              </>
            )}

            <button
              onClick={handleEndCall}
              className="bg-red-700 hover:bg-red-800 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 active:scale-95 transition"
            >
              <PhoneOff size={14} className="sm:w-4 sm:h-4" />
              <span>End</span>
            </button>

          </div>
        )}
      </header>

      {/* BODY */}
      <div className="flex-1 relative overflow-hidden flex flex-col">

        {joined && !remoteJoined && (
          <div className="absolute top-3 sm:top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-auto max-w-[90vw]">
            <div className="bg-black/85 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-sm px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full flex items-center gap-2 sm:gap-3 shadow-2xl justify-center truncate">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="truncate">Waiting for {isAdmin ? "driver" : "admin"} to connect...</span>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`absolute inset-0 ${
            joined ? "block" : "hidden"
          }`}
        />

        {!joined && (
          <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 overflow-y-auto">
            <div className="w-full max-w-md lg:max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">

              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 shadow-xl">
                <video
                  ref={previewRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-[240px] sm:h-[380px] object-cover"
                />

                {!cameraOn && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-2 text-gray-400">
                    <VideoOff size={36} />
                    <span className="text-xs">Camera is Off</span>
                  </div>
                )}
              </div>

              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                    Secure Video KYC
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1.5 sm:mt-2">
                    Check your camera and microphone before entering the verification room
                  </p>
                </div>

                <div className="flex justify-center lg:justify-start gap-4 sm:gap-6">
                  <button
                    onClick={toggleCamera}
                    aria-label="Toggle camera"
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition active:scale-90 ${
                      cameraOn
                        ? "bg-white text-black shadow-md"
                        : "bg-white/10 border border-white/20 text-white"
                    }`}
                  >
                    {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>

                  <button
                    onClick={toggleMic}
                    aria-label="Toggle microphone"
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition active:scale-90 ${
                      micOn
                        ? "bg-white text-black shadow-md"
                        : "bg-white/10 border border-white/20 text-white"
                    }`}
                  >
                    {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                  </button>
                </div>

                <button
                  onClick={startCall}
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-100 py-3.5 sm:py-4 rounded-xl font-bold text-sm sm:text-base shadow-lg transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      Connecting...
                    </span>
                  ) : (
                    "Join Secure Call"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      <AnimatePresence>
        {showApproveModal && (
          <Modal onClose={() => setShowApproveModal(false)}>
            <h2 className="text-lg font-semibold mb-4">
              Confirm Approval
            </h2>
            <div className="flex gap-4">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 rounded-xl py-2"
              >
                {actionLoading ? "Processing..." : "Approve"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* REJECT MODAL */}
      <AnimatePresence>
        {showRejectModal && (
          <Modal onClose={() => setShowRejectModal(false)}>
            <h2 className="text-lg font-semibold mb-4">
              Reject Vendor
            </h2>
            <textarea
              value={rejectReason}
              onChange={(e) =>
                setRejectReason(e.target.value)
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl p-3 mb-4 text-sm"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border rounded-xl py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 rounded-xl py-2"
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative bg-[#111] w-full max-w-md rounded-2xl p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400"
        >
          <X size={16} />
        </button>

        {children}
      </motion.div>
    </motion.div>
  );
}