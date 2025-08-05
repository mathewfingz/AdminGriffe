import { 
  Home,
  List,
  Tag,
  Users,
  Camera,
  Building,
  BarChart3,
  MousePointer,
  Percent,
  Settings
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Orders", href: "/orders", icon: List },
  { name: "Products", href: "/products", icon: Tag },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Content", href: "/content", icon: Camera },
  { name: "Finances", href: "/finances", icon: Building },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Marketing", href: "/marketing", icon: MousePointer },
  { name: "Discounts", href: "/discounts", icon: Percent },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-60 max-h-screen bg-[#EBEBEB] p-2.5 flex flex-col hidden lg:flex">
      <div className="flex-1 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.href ||
            (item.name === "Dashboard" && (location.pathname === "/" || location.pathname === "/analytics"));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-2 h-7 px-2.5 rounded-lg text-sm font-bold text-black transition-colors ${
                isActive ? "bg-[#FAFAFA]" : "hover:bg-[#FAFAFA]/50"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto">
        <Link
          to="/settings"
          className="flex items-center gap-2 h-8 px-2.5 rounded-lg text-sm font-bold text-black bg-[#EBEBEB] hover:bg-[#FAFAFA]/50 transition-colors"
        >
          <Settings className="w-5 h-5" strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
