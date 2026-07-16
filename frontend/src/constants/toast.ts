import type { ToasterProps } from "sonner";

export const toastOptions: ToasterProps["toastOptions"] = {
  className:
    "!glass-panel !bg-surface-container/90 !rounded-md !text-md !font-bold !text-primary-container !border-1",
  classNames: {
    toast: "!text-primary-container !border-border-panel",
    success: "!text-status-success !border-status-success",
    warning: "!text-status-warning !border-status-warning",
    error: "!text-status-emergency !border-status-emergency",
  },
};