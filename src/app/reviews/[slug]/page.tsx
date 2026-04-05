import { Suspense } from "react";
import { ReviewPageClient } from "./ReviewPageClient";

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
          Loading review…
        </div>
      }
    >
      <ReviewPageClient />
    </Suspense>
  );
}
