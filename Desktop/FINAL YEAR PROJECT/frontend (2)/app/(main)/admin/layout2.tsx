"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Role } from "@/types";
import { redirect, usePathname } from "next/navigation";
import { APP_ROUTES } from "@/constants";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Shield,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: APP_ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    name: "User Management",
    href: APP_ROUTES.ADMIN_USERS,
    icon: Users,
  },
  {
    name: "Analytics",
    href: APP_ROUTES.ADMIN_ANALYTICS,
    icon: BarChart3,
  },
  {
    name: "Notifications",
    href: APP_ROUTES.ADMIN_NOTIFICATIONS_CREATE,
    icon: Bell,
  },
  {
    name: "Forms",
    href: APP_ROUTES.ADMIN_FORMS_UPLOAD,
    icon: FileText,
  },
  {
    name: "Settings",
    href: "#",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!user || user.role !== Role.Admin) {
    redirect(APP_ROUTES.DASHBOARD);
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-64"
        } bg-white shadow-sm transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  SIWES Portal
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </div>
        </div>{" "}
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            // Improved matching logic
            let isActive = false;

            if (pathname === item.href) {
              // Exact match - this item is active
              isActive = true;
            } else if (item.href === APP_ROUTES.ADMIN_DASHBOARD) {
              // Dashboard should only be active on exact match (/admin)
              isActive = false;
            } else if (pathname.startsWith(item.href + "/")) {
              // Sub-route match for non-dashboard items
              isActive = true;
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* User Profile & Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
            title={sidebarCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
        {/* Collapse Toggle */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {" "}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {(() => {
                  // Check for exact matches first
                  for (const item of navigation) {
                    if (pathname === item.href) {
                      return item.name;
                    }
                  }

                  // Check for sub-route matches (excluding dashboard)
                  for (const item of navigation) {
                    if (
                      item.href !== APP_ROUTES.ADMIN_DASHBOARD &&
                      pathname.startsWith(item.href + "/")
                    ) {
                      return item.name;
                    }
                  }

                  // Special cases for specific routes
                  if (pathname.startsWith("/admin/users")) {
                    return "User Management";
                  }
                  if (pathname.startsWith("/admin/analytics")) {
                    return "Analytics";
                  }
                  if (pathname.startsWith("/admin/notifications")) {
                    return "Notifications";
                  }
                  if (pathname.startsWith("/admin/forms")) {
                    return "Forms";
                  }

                  return "Admin Panel";
                })()}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Welcome back, {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
