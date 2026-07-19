"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

type UseSocketResult = {
  socket: Socket | null;
  connected: boolean;
};

export function useSocket(): UseSocketResult {
  const { userId, isLoaded } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      setConnected(false);

      setSocket((prev) => {
        if (prev) {
          prev.disconnect();
        }

        return null;
      });
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    console.log(`[Socket], ${baseUrl}, ${userId}`);

    const socketInstance: Socket = io(baseUrl, {
      auth: { userId }, //bakend read userid from this
      withCredentials: true,
      transports: ["websocket"],
    });

    setSocket(socketInstance);

    const handleConnect = () => {
      setConnected(true);
      console.log(`[Socket], ${socketInstance.id}`);
    };

    const handleDisConnected = (reason: any) => {
      setConnected(false);
      console.log(`[Socket], ${socketInstance.id}, ${reason}`);
    };

    const handleConnectedError = (err: any) => {
      console.error(err);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisConnected);
    socketInstance.on("connect_error", handleConnectedError);

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisConnected);
      socketInstance.off("connect_error", handleConnectedError);

      socketInstance.disconnect();
      setConnected(false);
      setSocket(null);
    };
  }, [userId, isLoaded]);

  return { socket, connected };
}
