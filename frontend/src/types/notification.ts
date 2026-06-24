export type NotificationType = "reply_on_thread" | "like_on_thread";

export type Notification = {
  id: number;
  type: NotificationType | string;
  threadId: number;
  createdAt: string;
  readAt: string | null;
  actor: {
    displayName: string | null;
    handle: string | null;
  };
  thread: {
    title: string;
  };
};
