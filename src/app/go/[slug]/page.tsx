import { Suspense } from "react";
import { GoRedirect } from "./GoRedirect";

export default function GoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-[var(--text-secondary)]">
          Loading…
        </div>
      }
    >
      <GoRedirect />
    </Suspense>
  );
}
