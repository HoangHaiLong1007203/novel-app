"use client";
import { useState } from "react";
import LoginPage from "./(auth)/login/page";
import { redirect } from "next/navigation";

export default function RootPage() {
  const [open, setOpen] = useState(false);
  redirect("/home");
}
