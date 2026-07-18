"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { category, ThreadSummary } from "@/types/threads";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Button } from "../ui/button";
import { Plus, Search, MessageSquare, Tag, User, Calendar } from "lucide-react";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";

function ThreadsHomePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<category[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debounceSearch, setDebounceSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "all",
  );

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const [extractCategories, extractThreads] = await Promise.all([
          apiGet<category[]>(apiClient, "/api/threads/categories"),
          apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads", {
            params: {
              category:
                activeCategory && activeCategory !== "all"
                  ? activeCategory
                  : undefined,
              q: search || undefined,
            },
          }),
        ]);

        if (!isMounted) return;

        setCategories(extractCategories);
        setThreads(extractThreads);
      } catch (err) {
        console.error(err);
        if (err instanceof Error) {
          setError(err);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [apiClient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debounceSearch.length > 0 && debounceSearch.length < 2) return;
    applyFilters(activeCategory, debounceSearch);
  }, [debounceSearch]);

  async function applyFilters(category: string, searchVal: string) {
    const params = new URLSearchParams();

    if (category && category !== "all") {
      params.set("category", category);
    }

    if (searchVal.trim()) {
      params.set("q", searchVal.trim());
    }

    router.push(`/${params.toString() ? `?${params.toString()}` : ""}`);
    setIsLoading(true);
    setError(null);

    try {
      const threadAfterSearchAndFilter = await apiGet<ThreadSummary[]>(
        apiClient,
        "/api/threads/threads",
        {
          params: {
            category: category && category !== "all" ? category : undefined,
            q: searchVal || undefined,
          },
        },
      );
      setThreads(threadAfterSearchAndFilter);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (error && !isLoading && threads.length === 0 && categories.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error.message}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        <Card className="sticky top-24 border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Categories
              </CardTitle>
              <Link href="/threads/new">
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <button
              onClick={() => {
                setActiveCategory("all");
                applyFilters("all", search);
              }}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeCategory === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              All categories
            </button>

            {isLoading && categories.length === 0 && (
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            )}

            {categories.map((cat) => (
              <button
                onClick={() => {
                  setActiveCategory(cat.slug);
                  applyFilters(cat.slug, search);
                }}
                key={cat.slug}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  activeCategory === cat.slug
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {cat.name}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-5">
        {/* Header Card */}
        <Card className="border-border/60 bg-card shadow-sm">
          <CardHeader className="pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Latest Posts
            </h1>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10 bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyFilters(activeCategory, search);
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => applyFilters(activeCategory, search)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
                <Link href="/threads/new" className="hidden sm:block">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </Link>
              </div>
            </div>
            <Link href="/threads/new" className="block sm:hidden">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Threads List */}
        <div className="space-y-3">
          {isLoading && threads.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/60">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-5 w-3/4 rounded" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="mt-2 h-4 w-2/3 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && threads.length === 0 && (
            <Card className="border-dashed border-2 border-border/60 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-lg font-medium text-muted-foreground">
                  No posts yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Be the first to start a conversation!
                </p>
                <Link href="/threads/new" className="mt-4">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Post
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            threads.map((thread) => (
              <Card
                key={thread.id}
                className="group cursor-pointer border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
              >
                <Link href={`/threads/${thread.id}`} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <Badge
                            variant="secondary"
                            className="bg-secondary/70 text-xs font-medium hover:bg-secondary"
                          >
                            {thread.category.name}
                          </Badge>
                          {thread?.author?.handle && (
                            <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                              <User className="h-3 w-3" />@
                              {thread.author.handle}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                            <Calendar className="h-3 w-3" />
                            {new Date(thread.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        <CardTitle className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {thread.title}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-5 pt-0">
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/80">
                      {thread.excerpt}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ThreadsHomePage;
