import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/core/providers/ThemeProvider/ThemeProvider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          success:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#388e3c] group-[.toaster]:to-[#4caf50] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          error:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#c62828] group-[.toaster]:to-[#d32f2f] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          info: "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#1976d2] group-[.toaster]:to-[#2196f3] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          warning:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#f57c00] group-[.toaster]:to-[#ff9800] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#f1f5f9]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
