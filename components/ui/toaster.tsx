"use client"

import {
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

// Minimal Toaster to avoid missing hook dependency. If you need actionable
// toasts, wire in your own toast state and map here.
export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
