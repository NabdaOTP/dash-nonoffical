"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
// import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/features/auth/context/auth-context";
import Image from "next/image";
import { navItems } from "../constants";
import { LanguageSwitcher } from "./language-switcher";
import WhatsAppFloat from "./whatsapp-float";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const handleLogout = () => setShowLogoutConfirm(true);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.push("/login");
  };

  // Redirect to login if not authenticated (e.g. token expired)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);


  // Page Visibility Fix 
  // This solves the "tab freezing / inactivity" issue
  const handlePageBecomeVisible = useCallback(() => {
    if (document.visibilityState === "visible") {
      // Soft refresh the current route (best for Next.js App Router)
      router.refresh();
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handlePageBecomeVisible);
    window.addEventListener("focus", handlePageBecomeVisible); // Extra safety

    return () => {
      document.removeEventListener("visibilitychange", handlePageBecomeVisible);
      window.removeEventListener("focus", handlePageBecomeVisible);
    };
  }, [handlePageBecomeVisible]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ${collapsed ? "w-16" : "w-64"
            }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
            <a
              href="https://www.nabdaotp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Nabda OTP Logo"
                  width={50}
                  height={50}
                />
              </div>
              {!collapsed && (
                <span className="font-bold text-lg text-foreground tracking-tight">
                  Nabda OTP
                </span>
              )}
            </a>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`}
                  />
                  {!collapsed && <span>{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="p-2 border-t border-sidebar-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full justify-center text-muted-foreground cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="md:hidden flex items-center gap-2">
              <a
                href="https://www.nabdaotp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <div className="h-12 w-12 flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="Nabda OTP Logo"
                    width={50}
                    height={50}
                  />
                </div>
                <span className="font-bold text-lg text-foreground">
                  Nabda OTP
                </span>
              </a>
            </div>
            <div className="hidden md:block" />

            <div className="flex items-center gap-2">
              {/* <ThemeToggle /> */}
              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-foreground">
                      {user?.name || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                  <DropdownMenuItem
                    className="text-muted-foreground cursor-pointer"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {tAuth("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-15">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <WhatsAppFloat />

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-destructive" />
              {tAuth("logoutDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {tAuth("logoutDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              {tAuth("logoutDialog.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmLogout}>
              {tAuth("logoutDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}
