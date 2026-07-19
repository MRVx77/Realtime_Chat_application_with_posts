import ThreadsHomePage from "@/components/threads/threads-home";
import { Suspense } from "react";

export default function ThreadsPages() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Suspense fallback={null}>
        <ThreadsHomePage />
      </Suspense>
    </div>
  );
}
