"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";

export default function AppProviders({ children }: { children: ReactNode }) { return <ToastProvider>{children}</ToastProvider>; }
