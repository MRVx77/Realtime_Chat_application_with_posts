"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { Comment, MeResponse, ThreadDetails } from "@/types/threads";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, MessageCircle, ThumbsUp, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";

export default function ThreadsDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { getToken, userId } = useAuth();

  const [isDeletingThread, setIsDeletingThread] = useState(false);

  const [thread, setThread] = useState<ThreadDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [myHandle, setMyHandle] = useState<string | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentBeingDeletedId, setCommentBeingDeletedId] = useState<
    number | null
  >(null);

  const [islike, setIsLike] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isTogglineLike, setisTogglineLike] = useState(false);

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);
  const isThreadAuthor =
    !!myHandle && !!thread?.author?.handle && myHandle === thread.author.handle;

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);

      try {
        const [extractThreadDetails, extractCommentsList] = await Promise.all([
          apiGet<ThreadDetails>(apiClient, `/api/threads/threads/${id}`),
          apiGet<Comment[]>(apiClient, `/api/threads/threads/${id}/replies`),
        ]);

        if (!isMounted) return;

        // console.log(extractThreadDetails, userId, "extractThreadDetails");

        setThread(extractThreadDetails);
        setLikeCount(extractThreadDetails?.likeCount);
        setIsLike(extractThreadDetails?.viewerLikePost);
        setComments(extractCommentsList);

        if (userId) {
          try {
            const me = await apiGet<MeResponse>(apiClient, "/api/me");
            if (!isMounted) return;
            setMyHandle(me?.handle ?? null);
          } catch {
            if (!isMounted) return;
            setMyHandle(null);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    if (Number.isFinite(id)) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [apiClient, id, userId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <p className="text-lg text-muted-foreground">Loading the Post...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-10">
        <p className="text-lg text-muted-foreground">
          Thread Does not exists anymore...
        </p>
      </div>
    );
  }

  async function handleAddComment() {
    const trimmedComment = newComment.trim();

    if (trimmedComment.length < 2) return;
    if (!userId) {
      toast.error("Login in to add comment.", {
        description: "please login to add a comment!!!",
      });
      return;
    }

    try {
      setIsPostingComment(true);

      const res = await apiClient.post(`/api/threads/threads/${id}/replies`, {
        body: trimmedComment,
      });
      const created: Comment = res.data.data;
      console.log(created);
      setComments((prev) => [...prev, created]);
      setNewComment("");
      toast.success("Comment added successfully!!", {
        description: "Your commment has been posted",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsPostingComment(false);
    }
  }

  async function handleDeleteComment(CommentId: number) {
    const confirmed = window.confirm("Delete this comment?... Are you sure ?");

    if (!confirmed) return;
    if (!userId) {
      toast.error("Login in to add comment.", {
        description: "please login to add a comment!!!",
      });
      return;
    }

    try {
      setCommentBeingDeletedId(CommentId);
      await apiClient.delete(`/api/threads/replies/${CommentId}`);
      setComments((prev) => prev.filter((cmt) => cmt.id !== CommentId));
      toast.success("Comment deleted", {
        description: "This comment has been deleted",
      });
    } catch (error) {
      console.log(error);
    } finally {
      setCommentBeingDeletedId(null);
    }
  }

  async function handleToggleLike() {
    if (!thread) return;

    if (!userId) {
      toast.error("Login in to add comment.", {
        description: "please login to add a comment!!!",
      });
      return;
    }

    try {
      setisTogglineLike(true);
      if (islike) {
        await apiClient.delete(`/api/threads/threads/${id}/like`);
        setIsLike(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        toast.success("Like removed", {
          description: "Your like has been removed",
        });
      } else {
        await apiClient.post(`/api/threads/threads/${id}/like`);
        setIsLike(true);
        setLikeCount((prev) => prev + 1);
        toast.success("Like post", {
          description: "Your like has been added",
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setisTogglineLike(false);
    }
  }

  async function handleDeleteThread() {
    const confirm = window.confirm("Sure You want to delete this Post?...");

    if (!confirm) return;

    if (!userId) {
      toast.error("You must be logged in.", {
        description: "Please login to continue...",
      });
      return;
    }

    try {
      setIsDeletingThread(true);

      await apiClient.delete(`/api/threads/threads/${id}`);
      toast.success("Thread deleted!", {
        description: "Your thread has been deleted.",
      });
      router.push("/");
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete thread", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsDeletingThread(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap6 px-4 py-8">
      <Button
        variant={"ghost"}
        onClick={() => router.push("/")}
        className="w-fit rounded-full border border-border/70 bg-card/70 px-3 text-sm font-medium text-muted-foreground"
      >
        <ArrowLeft className="mr-2 w-4 h-4" />
        Back to threads
      </Button>

      <Card className="border-border/70 bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant={"outline"}
                  className="border-border/70 bg-secondary/70 text-[12px]"
                >
                  {thread?.category.name}
                </Badge>
                {thread?.author.handle && (
                  <span className="font-bold text-muted-foreground">
                    By @{thread?.author.handle}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {new Date(thread.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {thread?.title}
              </h1>
            </div>
            {/* actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 md:flex-col md:items-stretch">
              {userId && (
                <Button
                  size="sm"
                  variant={islike ? "default" : "outline"}
                  disabled={isTogglineLike}
                  onClick={handleToggleLike}
                  className={
                    islike
                      ? "bg-primary text-primary-foreground hover:bg-primary/95"
                      : "border-border/70 bg-card hover:bg-accent/60"
                  }
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {isTogglineLike
                    ? "..."
                    : likeCount > 0
                      ? `${likeCount}`
                      : "Like"}
                </Button>
              )}
              {isThreadAuthor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteThread}
                  disabled={isDeletingThread}
                  className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeletingThread ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {thread.body}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-primary" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No Comments yet.
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isCommentAuthor =
                  !!comment.author?.handle &&
                  !!myHandle &&
                  comment.author?.handle === myHandle;

                return (
                  <div
                    className="rounded-lg border border-border/80 bg-background/70 p-5"
                    key={comment?.id}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        {comment.author?.handle && (
                          <span className="text-sm font-medium text-foreground">
                            @{comment.author?.handle}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </div>

                      {isCommentAuthor && (
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={commentBeingDeletedId === comment.id}
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {comment.body}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* actual comment form */}
          <div className="space-y-3 border-t border-border pt-6">
            <label className="block text-sm font-semibold text-foreground">
              Add your reply
            </label>
            <Textarea
              value={newComment}
              onChange={(event) => setNewComment(event.target.value)}
              rows={5}
              placeholder="Enter your comment..."
              disabled={!userId || isPostingComment}
              className="border-border bg-background/70 text-sm"
            />
            <Button
              onClick={handleAddComment}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isPostingComment || !newComment.trim() || !userId}
            >
              {isPostingComment ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
