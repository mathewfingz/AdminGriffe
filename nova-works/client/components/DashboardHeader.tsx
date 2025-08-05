import { Bell } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 bg-white border-b border-gray-200">
      <img
        loading="lazy"
        srcSet="https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901"
        className="ml-5 min-h-5 min-w-5 max-w-40 w-full object-cover object-center overflow-hidden"
        style={{ aspectRatio: '3.72' }}
        alt="Logo"
      />
      <div className="flex-1 flex justify-center">
        <h1 className="text-xs sm:text-sm font-medium text-dashboard-text">User management</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="p-1">
          <Bell className="w-3.5 h-3.5 text-dashboard-text-muted" />
        </button>

        <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 rounded bg-gray-50">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/d119618de33f622c0576087a0efd402f6deac859?width=49"
            alt="Profile"
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
          />
          <span className="text-xs text-dashboard-text hidden sm:inline">Edvard salvator</span>
        </div>
      </div>
    </header>
  );
}
