"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  User as UserIcon,
  Bell,
  LogOut,
  Menu,
  X,
  Building,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { APP_ROUTES, ROLE_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { Role, User } from "@/types";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const studentNavigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: APP_ROUTES.STUDENT_DASHBOARD,
      icon: Home,
    },
    {
      name: "My Logbook",
      href: APP_ROUTES.STUDENT_LOGBOOK,
      icon: BookOpen,
    },
    {
      name: "Profile",
      href: APP_ROUTES.STUDENT_PROFILE,
      icon: UserIcon,
    },
    {
      name: "Notifications",
      href: APP_ROUTES.STUDENT_NOTIFICATIONS,
      icon: Bell,
    },
  ];

  useEffect(() => {
    // Only redirect if not loading and no user
    if (!isLoading && !user) {
      router.push(APP_ROUTES.AUTH.LOGIN);
      return;
    }

    // Redirect if user is not a student
    if (!isLoading && user && user.role !== Role.Student) {
      router.push(APP_ROUTES.DASHBOARD);
      return;
    }
  }, [router, user, isLoading]);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user or wrong role (redirect will happen)
  if (!user || user.role !== Role.Student) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push(APP_ROUTES.AUTH.LOGIN);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 flex z-40 md:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent
            navigationItems={studentNavigationItems}
            pathname={pathname}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent
            navigationItems={studentNavigationItems}
            pathname={pathname}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="flex items-center h-16">
                    <h1 className="text-lg font-semibold text-gray-900">
                      Student Portal
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.name}
                </span>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-9xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  navigationItems,
  pathname,
  user,
  onLogout,
}: {
  navigationItems: NavigationItem[];
  pathname: string;
  user: User;
  onLogout: () => void;
}) {
  // Function to determine if a navigation item is active
  const isItemActive = (item: NavigationItem) => {
    // For exact match (Dashboard)
    if (item.href === APP_ROUTES.STUDENT_DASHBOARD) {
      return pathname === item.href;
    }

    // For logbook routes - match the base route and all sub-routes
    if (item.href === APP_ROUTES.STUDENT_LOGBOOK) {
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }

    // For profile routes
    if (item.href === APP_ROUTES.STUDENT_PROFILE) {
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }

    // For notifications
    if (item.href === APP_ROUTES.NOTIFICATIONS) {
      return pathname === item.href || pathname.startsWith(item.href + "/");
    }

    // Default fallback
    return pathname === item.href;
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
        <Building className="h-8 w-8 text-white" />
        <span className="ml-2 text-white text-lg font-semibold">
          SIWES Portal
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = isItemActive(item);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ROLE_CONFIG[user?.role]?.label}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
