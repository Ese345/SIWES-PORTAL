import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      children,
      dismissible = false,
      onDismiss,
      ...props
    },
    ref
  ) => {
    const variants = {
      info: {
        container: "bg-blue-50 border-blue-200 text-blue-800",
        icon: <Info className="h-5 w-5 text-blue-500" />,
        iconBg: "bg-blue-100",
      },
      success: {
        container: "bg-green-50 border-green-200 text-green-800",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        iconBg: "bg-green-100",
      },
      warning: {
        container: "bg-yellow-50 border-yellow-200 text-yellow-800",
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
        iconBg: "bg-yellow-100",
      },
      error: {
        container: "bg-red-50 border-red-200 text-red-800",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        iconBg: "bg-red-100",
      },
    };

    const variantStyles = variants[variant];

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-lg border p-4",
          variantStyles.container,
          className
        )}
        {...props}
      >
        <div className="flex">
          <div className="flex-shrink-0">{variantStyles.icon}</div>
          <div className="ml-3 flex-1">
            {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
            <div className="text-sm">{children}</div>
          </div>
          {dismissible && onDismiss && (
            <div className="ml-auto pl-3">
              <button
                className="inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-600"
                onClick={onDismiss}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
