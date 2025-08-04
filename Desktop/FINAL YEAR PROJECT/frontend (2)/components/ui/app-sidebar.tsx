/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarHeader,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  Award,
  GraduationCap,
  Building2,
  School,
  Shield,
  Download,
  Upload,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Database,
  Mail,
  BookOpen,
  Archive,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  HelpCircle,
} from "lucide-react";
import { APP_ROUTES } from "@/constants";
import { useAuth } from "@/contexts/auth-context";

export interface SideContent {
  title?: string;
  href?: string;
  icon: string; // Changed to string
  disabled: boolean;
}

interface appSidebar {
  isLoading?: boolean;
  contents?: SideContent[] | [];
}

// Icon mapping object
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Settings,
  Award,
  GraduationCap,
  Building2,
  School,
  Shield,
  Download,
  Upload,
  MessageSquare,
  ClipboardList,
  TrendingUp,
  Database,
  Mail,
  BookOpen,
  Archive,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  HelpCircle,
};

export function AppSidebar({ options }: { options: appSidebar }) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b">
        <div className="p-2  border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                SIWES Portal
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {options.isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuSkeleton />
                    </SidebarMenuItem>
                  ))
                : options.contents?.map((item) => {
                    const IconComponent = iconMap[item.icon] || Users; // Fallback icon
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
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          size={"default"}
                          asChild
                          isActive={isActive}
                        >
                          <a href={item.href}>
                            <IconComponent />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-2 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            {user?.name || "Admin"} ({user?.role || "Administrator"})
          </p>
          <p className="text-xs text-gray-500">
            {user?.email || "admin@example.com"}
          </p>
        </div>
        <div className="p-2 border-t border-gray-200">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size={"default"}
                asChild
                onClick={handleLogout}
              >
                <div className="flex items-center gap-2">
                  <Lock />
                  <span>Logout</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        <div className="p-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} SIWES Portal. All rights reserved.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
