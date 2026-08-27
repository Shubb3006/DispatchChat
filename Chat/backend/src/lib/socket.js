import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSockMap[userId];
} 

const userSockMap = {}; //{userId:socketId}
io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSockMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSockMap)); // it used to send eventts to all connected users

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete userSockMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSockMap)); // it used to send eventts to all connected users
  });

  socket.on("typing",({senderId,receiverId,isTyping})=>{
    const receiverSocketId=userSockMap[receiverId];
    if(receiverSocketId)
      io.to(receiverSocketId).emit("typing",{senderId,isTyping})
  })

  // --- Voice Calling Signaling ---
  socket.on("call-user", ({ to, offer, from, fromName, fromPic }) => {
    const receiverSocketId = userSockMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incoming-call", { from, offer, fromName, fromPic });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const receiverSocketId = userSockMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-answered", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const receiverSocketId = userSockMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("reject-call", ({ to }) => {
    const receiverSocketId = userSockMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-rejected");
    }
  });

  socket.on("hang-up", ({ to }) => {
    const receiverSocketId = userSockMap[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-ended");
    }
  });
});

export { io, app, server };
