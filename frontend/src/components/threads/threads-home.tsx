"use client";

import { apiGet, createBrowserApiClient } from "@/lib/api-client";
import { category, ThreadSummary } from "@/types/threads";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function ThreadsHomePage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const apiClient = useMemo(() => createBrowserApiClient(getToken), [getToken]);

  const [categories, setCategories] = useState<category[]>([]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setIsLoading(true);

        const [extractCategories, extractThreads] = await Promise.all([
          apiGet<category[]>(apiClient, "/api/threads/categories"),
          apiGet<ThreadSummary[]>(apiClient, "/api/threads/threads"),
        ]);

        if (isMounted) return;

        // console.log(extractCategories, extractThreads);
        setCategories(extractCategories);
        setThreads(extractThreads);
      } catch (err) {
        console.log(err);
        //homework hanlde error state incase of error and render
        if (err instanceof Error) {
          setError(err);
        }
      }
    }
    load();
  }, [apiClient]);

  if (error) {
    return <p>{error.message}</p>;
  }

  return <div className=""></div>;
}

export default ThreadsHomePage;
