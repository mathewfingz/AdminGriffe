import { Search, ChevronDown, Filter, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const users = [
  { name: "Floyd Miles", email: "tanya.hill@example.com", city: "Omsk", date: "7/11/19" },
  { name: "Kristin Watson", email: "curtis.weaver@example.com", city: "Naltchik", date: "4/4/18" },
  { name: "Annette Black", email: "deanna.curtis@example.com", city: "Khabarovsk", date: "3/4/16" },
  { name: "Wade Warren", email: "felicia.reid@example.com", city: "Mannheim", date: "4/21/12" },
  { name: "Esther Howard", email: "dolores.chambers@example.com", city: "Cincinnati (OH)", date: "12/4/17" },
  { name: "Cameron Williamson", email: "michael.mitc@example.com", city: "Sterlitamak", date: "8/30/14" },
  { name: "Albert Flores", email: "sara.cruz@example.com", city: "Lomas de Zamora", date: "8/15/17" },
  { name: "Robert Fox", email: "kenzi.lawson@example.com", city: "Greensboro (NC)", date: "5/30/14" },
  { name: "Jenny Wilson", email: "jackson.graham@example.com", city: "Lübeck", date: "5/27/15" },
  { name: "Ralph Edwards", email: "willie.jennings@example.com", city: "Vladikavkaz (Osetinskaya ASSR)", date: "1/31/14" },
  { name: "Cody Fisher", email: "michelle.rivera@example.com", city: "Krasnodar", date: "5/19/12" },
  { name: "Brooklyn Simmons", email: "georgia.young@example.com", city: "Rubtsovsk", date: "7/18/17" },
  { name: "Theresa Webb", email: "debbie.baker@example.com", city: "Herne", date: "8/16/13" },
  { name: "Darrell Steward", email: "nathan.roberts@example.com", city: "Bochum", date: "10/6/13" },
  { name: "Ronald Richards", email: "nevaeh.simmons@example.com", city: "Mönchengladbach", date: "9/18/16" },
  { name: "Jerome Bell", email: "bill.sanders@example.com", city: "Baton Rouge (LA)", date: "1/15/12" },
];

export function UserTable() {
  return (
    <div className="bg-white rounded border border-gray-200 overflow-hidden">
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-gray-200 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-dashboard-text">user list</span>
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs text-dashboard-text-muted">
            1240 user
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border">
            <Search className="w-2 h-2 text-dashboard-text-muted" />
            <input
              placeholder="Search user"
              className="text-xs bg-transparent border-none outline-none text-dashboard-text-muted placeholder:text-dashboard-text-muted w-20 sm:w-24"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-xs text-dashboard-text-muted">
            <ChevronDown className="w-3 h-3" />
            <span className="hidden sm:inline">Sorting By</span>
            <span className="sm:hidden">Sort</span>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 px-2 py-1 border border-gray-300 text-xs text-dashboard-text-muted">
            <Filter className="w-3 h-3" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </div>
        </div>
      </div>
      
      {/* Table Content - Responsive horizontal scroll */}
      <div className="overflow-x-auto">
        {/* Table Column Headers */}
        <div className="flex justify-between items-center px-3 py-2 border-b border-gray-200 bg-gray-50 min-w-max">
          <div className="w-32 text-xs text-gray-500 pl-12">User Name</div>
          <div className="w-48 text-xs text-gray-500">Email Address</div>
          <div className="w-32 text-xs text-gray-500">City</div>
          <div className="w-24 text-xs text-gray-500 text-center">Account Created date</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {users.map((user, index) => (
            <div key={index} className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 min-w-max">
              <div className="w-32 flex items-center gap-2">
                <Plus className="w-3 h-3 text-gray-400 border border-gray-300 rounded" />
                <span className="text-xs text-dashboard-text">{user.name}</span>
              </div>
              <div className="w-48 text-xs text-dashboard-text">{user.email}</div>
              <div className="w-32 text-xs text-dashboard-text">{user.city}</div>
              <div className="w-24 text-xs text-dashboard-text text-center">{user.date}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-center py-3">
        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 bg-white hover:bg-gray-50">
            <ChevronLeft className="w-3 h-3" />
            Previous
          </button>
          <button className="px-3 py-1.5 text-xs text-gray-500 bg-white border-x border-gray-300 hover:bg-gray-50">
            1
          </button>
          <button className="px-3 py-1.5 text-xs text-dashboard-text bg-gray-200 border-x border-gray-300">
            2
          </button>
          <button className="px-3 py-1.5 text-xs text-gray-500 bg-white border-x border-gray-300 hover:bg-gray-50">
            3
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 bg-white hover:bg-gray-50">
            Next
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
