import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardStats } from "@/components/DashboardStats";
import { UserTable } from "@/components/UserTable";

export default function Index() {
  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* Main Dashboard Container */}
      <div className="max-w-5xl mx-auto p-2 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-300 shadow-lg overflow-hidden">
          {/* Header */}
          <DashboardHeader />

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row gap-2 p-2 sm:p-3">
            {/* Sidebar */}
            <div className="lg:w-auto">
              <DashboardSidebar />
            </div>

            {/* Content */}
            <main className="flex-1 bg-white rounded p-2 sm:p-3">
              {/* Stats Cards */}
              <DashboardStats />

              {/* User Table */}
              <UserTable />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
