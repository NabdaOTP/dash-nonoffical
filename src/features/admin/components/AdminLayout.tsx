"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/auth-context";
import {
  ChevronLeft, ChevronRight,
  CreditCard,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Server,
  Settings,
  Shield,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const adminNavItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/instances", icon: Server, label: "Instances" },
  { path: "/admin/invoices", icon: Receipt, label: "Invoices" },
  { path: "/admin/plans", icon: CreditCard, label: "Plans" },
  { path: "/admin/subscriptions", icon: FileText, label: "Subscriptions" },
  { path: "/admin/bundles", icon: Package, label: "Bundles" },
  { path: "/admin/referral", icon: Gift, label: "Referrals" },
  { path: "/admin/proxies", icon: Settings, label: "Proxies" },
  { path: "/admin/protection", icon: Shield, label: "Protection" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!isLoading && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`
      flex flex-col border-r border-sidebar-border bg-sidebar h-full
      ${mobile ? "w-64" : collapsed ? "w-16" : "w-64"}
      transition-all duration-300
    `}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="h-12 w-12 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Nabda OTP Logo"
            width={50}
            height={50}
          />
        </div>
        {(!collapsed || mobile) && (
          <div>
            <h1 className="font-bold text-lg text-foreground">Nabda OTP</h1>
            <p className="text-xs text-red-600 font-bold">(Admin Panel)</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive = pathname.endsWith(item.path) ||
            (item.path !== "/admin" && pathname.includes(item.path + "/"));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              {(!collapsed || mobile) && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      {!mobile && (
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost" size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                User Dashboard
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-red-500 font-semibold">ADMIN</p>
            </div>
            <Button
              variant="ghost" size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}