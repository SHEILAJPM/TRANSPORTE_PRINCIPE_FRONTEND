"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "primary" | "warning" | "success";
  hint?: string;
  delay?: number;
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function StatCard({ label, value, icon: Icon, tone = "default", hint, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="transition-shadow hover:shadow-elevated">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", TONE_STYLES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
