import React from "react";
import { useCallStore } from "../store/useCallStore";
import Avatar from "./Avatar";
import { Phone, PhoneOff, Mic, MicOff, ShieldCheck } from "lucide-react";

const CallOverlay = () => {
  const {
    isCalling,
    isIncomingCall,
    isCallAccepted,
    remoteUser,
    acceptCall,
    rejectCall,
    endCall,
    remoteStream
  } = useCallStore();

  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!isCalling && !isIncomingCall && !isCallAccepted) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white fade-in">
      {/* Hidden audio element to play remote stream */}
      <audio ref={audioRef} autoPlay />

      {/* User Info */}
      <div className="flex flex-col items-center gap-6 mb-16 text-center">
        <div className="relative">
          <div className="size-36 rounded-full p-1 bg-indigo-500/20 ring-4 ring-indigo-500/10">
             <Avatar src={remoteUser?.profilePic} name={remoteUser?.name} size="size-full" />
          </div>
          {(isCalling || isCallAccepted) && (
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-10"></div>
          )}
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight">{remoteUser?.name || "Member"}</h2>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em]">
            {isIncomingCall ? "Incoming Audio Call" : isCallAccepted ? "Connection Established" : "Initiating Call..."}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-10 mt-auto mb-24">
        {isIncomingCall ? (
          <>
            <button
              onClick={rejectCall}
              className="btn btn-circle btn-lg size-20 bg-red-500 hover:bg-red-600 border-none text-white shadow-2xl shadow-red-500/30 active:scale-90 transition-transform"
            >
              <PhoneOff className="size-8" />
            </button>
            <button
              onClick={acceptCall}
              className="btn btn-circle btn-lg size-20 bg-emerald-500 hover:bg-emerald-600 border-none text-white shadow-2xl shadow-emerald-500/30 active:scale-90 transition-transform"
            >
              <Phone className="size-8" />
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-circle btn-lg size-16 bg-slate-800 border-none text-white/50 hover:text-white"
            >
              <Mic className="size-6" />
            </button>
            <button
              onClick={endCall}
              className="btn btn-circle btn-lg size-20 bg-red-500 hover:bg-red-600 border-none text-white shadow-2xl shadow-red-500/30 active:scale-90 transition-transform"
            >
              <PhoneOff className="size-8" />
            </button>
            <button
              className="btn btn-circle btn-lg size-16 bg-slate-800 border-none text-white/50 hover:text-white"
            >
              <MicOff className="size-6" />
            </button>
          </>
        )}
      </div>

      {/* Pulsing Status Text */}
      {isCallAccepted && (
        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
          <ShieldCheck className="size-3" /> Secure End-to-End Encrypted
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
