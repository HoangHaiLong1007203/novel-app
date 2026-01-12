"use client";

import React, { createContext, useContext, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmFn = (opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm: ConfirmFn = (options = {}) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(false); setOpen(v); }}>
        <DialogContent title={opts.title ?? "Xác nhận"}>
          <DialogHeader>
            <DialogTitle>{opts.title ?? "Xác nhận"}</DialogTitle>
          </DialogHeader>

          {opts.description && <div className="text-sm text-muted-foreground mb-4">{opts.description}</div>}

          <DialogFooter>
            <Button variant="ghost" onClick={() => handleClose(false)}>{opts.cancelText ?? "Hủy"}</Button>
            <Button variant={opts.destructive ? "destructive" : "default"} onClick={() => handleClose(true)}>
              {opts.confirmText ?? "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider");
  return ctx;
}
