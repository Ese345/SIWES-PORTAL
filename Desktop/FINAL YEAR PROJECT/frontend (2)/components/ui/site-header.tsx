import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import React from "react";

export default function SiteHeader({
  children,
  description,
  className = "",
  heading = "Admin Dashboard",
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  heading?: string;
  description?: string;
}) {
  return (
    <div className={`w-full flex flex-col ${className}`}>
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex-1">
            <h1 className="text-xl font-sans font-semibold">{heading}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex-1" />
          {/* Action Button can be added here if needed */}
          {action && <div className="flex items-center">{action}</div>}
        </div>
      </header>

      <section className="p-6 space-y-6">{children}</section>
    </div>
  );
}
