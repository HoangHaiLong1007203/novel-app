import React, { Suspense } from "react";
import ClientRanking from "./ClientRanking";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Đang tải...</div>}>
      <ClientRanking />
    </Suspense>
  );
}
