
import { toast as sonnerToast } from "@/components/ui/sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant = "default", duration = 3000 }: ToastProps) => {
    sonnerToast[variant === "destructive" ? "error" : "success"](`${title}${description ? '\n' + description : ''}`, {
      duration
    })
  }

  return { toast }
}
