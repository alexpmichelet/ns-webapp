'use client'

import { toast as sonnerToast } from 'sonner'

export type ToastOptions = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'info' | 'warning'
}

export function useToast() {
  const toast = (opts: ToastOptions) => {
    const { title, description, variant } = opts
    switch (variant) {
      case 'destructive':
        sonnerToast.error(title ?? description ?? '')
        break
      case 'success':
        sonnerToast.success(title ?? description ?? '')
        break
      case 'info':
        sonnerToast.info(title ?? description ?? '')
        break
      case 'warning':
        sonnerToast.warning(title ?? description ?? '')
        break
      default:
        sonnerToast(title ?? description ?? '')
    }
  }

  return { toast }
}
