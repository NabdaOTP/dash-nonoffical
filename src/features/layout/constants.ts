import {
  Gift,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Package,
  Server,
  type LucideIcon
} from "lucide-react";
 
export interface NavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
}
 
export const navItems: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { path: "/instances", icon: Server, labelKey: "nav.instances" },
  { path: "/bundles", icon: Package, labelKey: "nav.bundles" },
  { path: "/referrals", icon: Gift, labelKey: "nav.referrals" },
  { path: "/contact", icon: Mail, labelKey: "nav.contact" },
  { path: "/faq", icon: HelpCircle, labelKey: "nav.faq" },
];