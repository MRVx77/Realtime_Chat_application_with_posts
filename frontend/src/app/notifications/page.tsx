"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNotificationCount } from "@/hooks/use-notification-count";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Notification } from "@/types/notification";
import { useAuth } from "@clerk/nextjs";
import { Inbox, MessageCircle, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatText(n: Notification) {
  const actor =
    n.actor.handle !== null && n.actor.handle !== ""
      ? `@${n.actor.handle}`
      : (n.actor.displayName ?? "Someone");

  if (n.type === "reply_on_thread") {
    return `${actor} commented on your thread`;
  }
  if (n.type === "like_on_thread") {
    return `${actor} like your thread`;
  }

  return `${actor} interacted on your thread`;
}

function NotificationPage() {
  const { getToken } = useAuth();
  const router = useRouter();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const { decrementUnread } = useNotificationCount();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);

        const data = await apiGet<Notification[]>(
          apiClient,
          "/api/notifications",
        );

        if (!isMounted) return;

        setNotifications(data);
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  async function openNoti(n: Notification) {
    try {
      if (!n.readAt) {
        await apiClient.post(`/api/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((noti) =>
            noti.id === n.id ? { ...n, readAt: new Date().toISOString() } : n,
          ),
        );
        decrementUnread();
      }
    } catch (error) {
      console.log(error);
    }

    router.push(`/threads/${n.threadId}`);
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  async function readAllNotification() {
    if (unreadCount === 0) return;
    try {
      setIsLoading(true);

      await apiClient.post(`/api/notifications/read-all`);

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readAt: new Date().toISOString(),
        })),
      );

      decrementUnread(unreadCount);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-6 py-8 px-4">
      <div className="flex justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <Inbox className="h-7 w-7 text-primary" />
          Notifications
        </h1>
        <Button onClick={() => readAllNotification()} disabled={isLoading}>
          Read all
        </Button>
      </div>

      <Card className="border-border/70 bg-card">
        {isLoading && (
          <CardContent className="py-10 text-center">
            <p className="text-lg text-muted-foreground">
              Loading notifications...
            </p>
          </CardContent>
        )}
        {!isLoading && notifications.length === 0 && (
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No new notifications...
            </p>
          </CardContent>
        )}

        {!isLoading && notifications.length > 0 && (
          <CardContent className="divide-y divide-border/70">
            {notifications.map((n) => {
              const text = formatText(n);
              const icon =
                n.type === "reply_on_thread" ? (
                  <MessageCircle className="h-4 w-4 text-chart-2" />
                ) : (
                  <ThumbsUp className="h-4 w-4 text-primary" />
                );

              const isUnread = !n.readAt;

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNoti(n)}
                  className={`flex w-full items-start gap-4 px-3 py-4 text-left transition-colors duration-200 ${
                    isUnread
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-primary/20"
                  }`}
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                    {icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {text}
                      </p>
                      <span
                        className={`shrink-0 text-xs ${
                          isUnread
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(n.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {n.thread.title}
                    </p>
                    {isUnread && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          className="border-primary/30 bg-primary/10 text-[12px text-primary]"
                          variant="outline"
                        >
                          New
                        </Badge>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default NotificationPage;
