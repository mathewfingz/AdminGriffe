import { Users, TrendingDown, TrendingUp, BarChart3 } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
  icon: React.ReactNode;
}

function StatCard({ title, value, change, changeType, icon }: StatCardProps) {
  return (
    <div className="bg-dashboard-card p-3 rounded border border-gray-100 flex-1">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-dashboard-text">{title}</span>
        <div className="p-1 bg-gray-50 rounded">
          <div className="w-2 h-2 text-dashboard-text-muted">
            {icon}
          </div>
        </div>
      </div>
      
      <div className="mb-2">
        <span className="text-sm font-medium text-dashboard-text">{value}</span>
      </div>
      
      <div className="flex items-center gap-1">
        <span className={`text-xs font-semibold ${
          changeType === "positive" ? "text-dashboard-success" : "text-dashboard-danger"
        }`}>
          {change}
        </span>
        <span className="text-xs text-gray-600">compared to last month</span>
      </div>
      
      {/* Chart visualization placeholder */}
      <div className="mt-2 flex items-end justify-end h-8">
        {changeType === "positive" ? (
          <BarChart3 className="w-8 h-6 text-gray-400" />
        ) : (
          <TrendingDown className="w-8 h-6 text-gray-400" />
        )}
      </div>
    </div>
  );
}

export function DashboardStats() {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
      <StatCard
        title="Active users"
        value="1250"
        change="-10%"
        changeType="negative"
        icon={<Users className="w-full h-full" />}
      />
      <StatCard
        title="New Users"
        value="24"
        change="+5%"
        changeType="positive"
        icon={<Users className="w-full h-full" />}
      />
      <StatCard
        title="Total Users"
        value="1301"
        change="+40%"
        changeType="positive"
        icon={<Users className="w-full h-full" />}
      />
    </div>
  );
}
