import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

export const useCallStore = create((set, get) => ({
  isCalling: false,
  isIncomingCall: false,
  isCallAccepted: false,
  remoteUser: null, // { id, name, profilePic }

  localStream: null,
  remoteStream: null,
  peerConnection: null,

  initCall: async (remoteUser) => {
    const { socket, authUser } = useAuthStore.getState();
    if (!socket || !authUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, isCalling: true, remoteUser });

      const pc = createPeerConnection(remoteUser.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        to: remoteUser.id,
        offer,
        from: authUser._id,
        fromName: authUser.fullName,
        fromPic: authUser.profilePic
      });

      set({ peerConnection: pc });
    } catch (err) {
      console.error("Failed to get local stream", err);
      toast.error("Could not access microphone");
      get().endCall();
    }
  },

  handleIncomingCall: (data) => {
    set({
      isIncomingCall: true,
      remoteUser: { id: data.from, name: data.fromName, profilePic: data.fromPic },
      offer: data.offer
    });
    // Play ringtone logic here if needed
  },

  acceptCall: async () => {
    const { socket, authUser } = useAuthStore.getState();
    const { offer, remoteUser } = get();
    if (!socket || !offer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, isCallAccepted: true, isIncomingCall: false });

      const pc = createPeerConnection(remoteUser.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer-call", { to: remoteUser.id, answer });
      set({ peerConnection: pc });
    } catch (err) {
      console.error("Failed to accept call", err);
      get().endCall();
    }
  },

  rejectCall: () => {
    const { socket } = useAuthStore.getState();
    const { remoteUser } = get();
    if (socket && remoteUser) {
      socket.emit("reject-call", { to: remoteUser.id });
    }
    get().resetState();
  },

  endCall: () => {
    const { socket } = useAuthStore.getState();
    const { remoteUser, localStream, peerConnection } = get();

    if (socket && remoteUser) {
      socket.emit("hang-up", { to: remoteUser.id });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    get().resetState();
  },

  resetState: () => {
    set({
      isCalling: false,
      isIncomingCall: false,
      isCallAccepted: false,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      offer: null
    });
  },

  setupSocketListeners: () => {
    const { socket } = useAuthStore.getState();
    if (!socket) return;

    socket.on("incoming-call", (data) => {
      get().handleIncomingCall(data);
    });

    socket.on("call-answered", async ({ answer }) => {
      const { peerConnection } = get();
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        set({ isCallAccepted: true });
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      const { peerConnection } = get();
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    socket.on("call-rejected", () => {
      toast.error("Call rejected");
      get().endCall();
    });

    socket.on("call-ended", () => {
      toast("Call ended");
      get().endCall();
    });
  }
}));

const createPeerConnection = (remoteUserId) => {
  const { socket } = useAuthStore.getState();
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { to: remoteUserId, candidate: event.candidate });
    }
  };

  pc.ontrack = (event) => {
    useCallStore.setState({ remoteStream: event.streams[0] });
  };

  return pc;
};
