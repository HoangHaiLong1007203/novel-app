"use client";
import { useState } from "react";
import LoginPage from "./(auth)/login/page";
export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen items-center justify-center">
      <LoginPage/>
    </div>
  );
}
