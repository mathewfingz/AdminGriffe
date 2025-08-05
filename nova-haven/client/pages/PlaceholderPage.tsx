import Sidebar from "@/components/Sidebar";

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-10 py-0">
        {/* Header */}
        <div className="flex items-center h-[88px]">
          <h1 className="text-2xl sm:text-[32px] font-extrabold text-[#303030] leading-[19px]">{title}</h1>
        </div>
        
        {/* Placeholder Content */}
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-4">Coming Soon</h2>
            <p className="text-gray-500 max-w-md">
              This {title.toLowerCase()} page is a placeholder. Continue prompting to add content and functionality to this section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
