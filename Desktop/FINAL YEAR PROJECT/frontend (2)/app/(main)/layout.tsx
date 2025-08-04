import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, SideContent } from "@/components/ui/app-sidebar";

export const adminNavData: SideContent[] = [
  // Dashboard
  {
    title: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
    disabled: false,
  },

  // User Management
  {
    title: "Users",
    href: "/admin/users",
    icon: "Users",
    disabled: false,
  },

  // Assignment Management
  {
    title: "Assignments",
    href: "/admin/assignments",
    icon: "UserCheck",
    disabled: false,
  },

  {
    title: "ITF Forms",
    href: "/admin/forms/upload",
    icon: "Award",
    disabled: false,
  },
  // Communication
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: "Bell",
    disabled: false,
  },

  // Reports & Analytics
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: "BarChart3",
    disabled: false,
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar
        options={{
          contents: adminNavData,
        }}
      />
      <SidebarInset>
        <main>
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
