import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  FileText, 
  MessageSquare, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isLogout?: boolean;
}

function SidebarItem({ icon, label, isActive, isLogout }: SidebarItemProps) {
  return (
    <button
      className={cn(
        "flex items-center justify-between w-full lg:w-auto min-w-max px-2 py-1 rounded text-xs transition-colors flex-shrink-0",
        isActive
          ? "bg-primary text-white"
          : isLogout
          ? "border border-dashboard-border text-dashboard-text-muted"
          : "bg-gray-100 text-primary hover:bg-gray-200"
      )}
    >
      <span className="font-normal">{label}</span>
      <div className="w-3 h-3 flex items-center justify-center">
        {icon}
      </div>
    </button>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="w-full lg:w-32 bg-white p-2 flex lg:flex-col justify-between rounded border-r lg:border-r-gray-200 border-b lg:border-b-0 border-gray-200">
      <div className="flex lg:flex-col lg:space-y-1.5 space-x-1.5 lg:space-x-0 overflow-x-auto lg:overflow-x-visible">
        <SidebarItem
          icon={<Home className="w-3 h-3" />}
          label="Dashboard"
        />
        <SidebarItem
          icon={<Users className="w-3 h-3" />}
          label="Users"
          isActive
        />
        <SidebarItem
          icon={<ShoppingCart className="w-3 h-3" />}
          label="Orders"
        />
        <SidebarItem
          icon={<Package className="w-3 h-3" />}
          label="Products"
        />
        <SidebarItem
          icon={<BarChart3 className="w-3 h-3" />}
          label="Analysis"
        />
        <SidebarItem
          icon={<FileText className="w-3 h-3" />}
          label="blogs"
        />
        <SidebarItem
          icon={<MessageSquare className="w-3 h-3" />}
          label="Tickets"
        />
      </div>

      <div className="hidden lg:block">
        <SidebarItem
          icon={<LogOut className="w-3 h-3" />}
          label="Logout"
          isLogout
        />
      </div>
    </aside>
  );
}
