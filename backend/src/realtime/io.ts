import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { getUserFromClerk } from "../modules/users/user.service.js";

let io: Server | null = null;

const onlineUsers = new Map<number, Set<string>>();

function addOnlineUser(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId);

  if (!Number.isFinite(userId) || userId <= 0) return;

  const existing = onlineUsers.get(userId);

  if (existing) {
    existing.add(socketId);
  } else {
    onlineUsers.set(userId, new Set([socketId]));
  }
}

function removeOnlineUser(rawUserId: unknown, socketId: string) {
  const userId = Number(rawUserId);

  if (!Number.isFinite(userId) || userId <= 0) return;

  const existing = onlineUsers.get(userId);

  if (!existing) return;

  existing.delete(socketId);

  if (existing.size === 0) {
    onlineUsers.delete(userId);
  }
}

function getOnlineUsersIds(): number[] {
  return Array.from(onlineUsers.keys());
}

function broadCastPresence() {
  io?.emit("presence:update", {
    onlineUsers: getOnlineUsersIds(),
  });
}

export function initIo(httpServer: HttpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", async (socket) => {
    console.log(`[io connection] -----> ${socket.id}`);
    try {
      const clerkUserId = socket.handshake.auth?.userId;
      if (!clerkUserId || typeof clerkUserId !== "string") {
        console.log(`[missing clerk user id] -----> ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      const profile = await getUserFromClerk(clerkUserId);
      const rawLocalUserId = profile.user.id;
      const localUserId = Number(rawLocalUserId);

      if (!Number.isFinite(localUserId) || localUserId <= 0) {
        console.log(`[invalid user id] -----> ${socket.id}`);
        socket.disconnect(true);
        return;
      }

      (socket.data as { userId: number }) = {
        userId: localUserId,
      };

      //join notification room
      const notiRoom = `notifications:user:${localUserId}`;
      socket.join(notiRoom);

      addOnlineUser(localUserId, socket.id);
      broadCastPresence();
    } catch (error) {
      console.log(`[error while connecting] -----> ${error}`);
      socket.disconnect(true);
    }
  });
}

export function getIo() {
  return io;
}
