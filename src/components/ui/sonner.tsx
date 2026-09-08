"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-elevated font-sans",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "!border-success/30",
          error: "!border-destructive/30",
        },
      }}
    />
  );
}
