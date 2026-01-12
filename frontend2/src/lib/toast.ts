import { toast as sonnerToast } from "sonner";

export type ToastOptions = Parameters<typeof sonnerToast>[1];
type SonnerMessage = Parameters<typeof sonnerToast>[0];

function createToast() {
  const fn = ((message: SonnerMessage, options?: ToastOptions) =>
    sonnerToast(message, { duration: 1000, ...options })) as typeof sonnerToast;

  fn.success = (message: SonnerMessage, options?: ToastOptions) =>
    sonnerToast.success(message, { duration: 1000, ...options });
  fn.error = (message: SonnerMessage, options?: ToastOptions) =>
    sonnerToast.error(message, { duration: 1000, ...options });
  fn.loading = (message: SonnerMessage, options?: ToastOptions) =>
    sonnerToast(message, { duration: 1000, ...options });

  return fn as typeof sonnerToast & {
    success: (m: string, o?: ToastOptions) => string | number;
    error: (m: string, o?: ToastOptions) => string | number;
    loading: (m: string, o?: ToastOptions) => string | number;
  };
}

export const toast = createToast();
export default toast;
