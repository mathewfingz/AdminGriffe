import Sidebar from "@/components/Sidebar";
import AnalyticsCard from "@/components/AnalyticsCard";

export default function Index() {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar - Hidden on mobile/tablet */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-0">
        {/* Header */}
        <div className="flex items-center h-[88px]">
          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#303030] leading-[19px]">Analytics</h1>
        </div>

        {/* Analytics Cards Grid */}
        <div className="space-y-5">
          {/* First Row */}
          <div className="flex flex-col lg:flex-row justify-center gap-5">
            <AnalyticsCard
              title="Average units ordered"
              value="0"
              secondaryValue="-"
              chartType="line"
            />
            <AnalyticsCard
              title="Total sales"
              value="$0.00"
              secondaryValue="-"
              chartType="line"
            />
          </div>

          {/* Second Row */}
          <div className="flex flex-col lg:flex-row justify-center gap-5">
            <AnalyticsCard
              title="Sales by channel"
              value="0"
              secondaryValue="-"
              chartType="empty"
            />
            <AnalyticsCard
              title="Online store sessions"
              value="0"
              secondaryValue="-"
              chartType="empty"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
