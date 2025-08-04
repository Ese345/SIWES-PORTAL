import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { APP_ROUTES } from "@/constants";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({
  items,
  className = "",
}: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs based on pathname if items not provided
  const getBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Dashboard", href: APP_ROUTES.ADMIN_DASHBOARD },
    ];

    if (segments.length > 1) {
      if (segments[1] === "users") {
        breadcrumbs.push({
          label: "User Management",
          href: APP_ROUTES.ADMIN_USERS,
        });

        if (segments.length > 2) {
          if (segments[2] === "create") {
            breadcrumbs.push({ label: "Create User" });
          } else if (segments[2] === "upload") {
            breadcrumbs.push({ label: "Bulk Upload" });
          } else {
            // Individual user pages
            breadcrumbs.push({
              label: "User Details",
              href: APP_ROUTES.ADMIN_USER_DETAIL(segments[2]),
            });

            if (segments[3] === "edit") {
              breadcrumbs.push({ label: "Edit User" });
            }
          }
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbItems = items || getBreadcrumbsFromPath();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav
      className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
    >
      <Home className="h-4 w-4" />
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={
                index === breadcrumbItems.length - 1
                  ? "text-gray-900 font-medium"
                  : ""
              }
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
