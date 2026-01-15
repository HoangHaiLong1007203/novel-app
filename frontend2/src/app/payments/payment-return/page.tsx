import React, { Suspense } from "react";
import PaymentReturnClient from "./PaymentReturnClient";
import { Skeleton } from "@/components/ui";

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-3xl px-4 py-10"><Skeleton className="h-8 w-48" /></div>}>
      <PaymentReturnClient />
    </Suspense>
  );
}
