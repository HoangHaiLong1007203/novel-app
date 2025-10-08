"use client";

export default function Footer() {
  return (
    <footer className="border-t py-6 mt-8 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} <span className="font-medium text-foreground">Novel</span>.  
        All rights reserved.
      </p>
    </footer>
  );
}
