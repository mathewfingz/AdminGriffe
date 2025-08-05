import { GripVertical, X } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string;
  secondaryValue?: string;
  chartType?: "line" | "bar" | "empty";
  showDateFilters?: boolean;
}

const timeLabels = ["12:00 am", "4:00 am", "8:00 am", "12:00 pm", "4:00pm", "8:00 pm"];
const yAxisLabels = ["0", "5", "10"];

export default function AnalyticsCard({
  title,
  value,
  secondaryValue,
  chartType = "line",
  showDateFilters = true
}: AnalyticsCardProps) {
  return (
    <div className="w-full max-w-[545px] bg-white rounded-[20px] border border-[#E8E8ED] shadow-[0_4px_8px_0_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="flex items-center gap-1 h-[43px] px-5 rounded-t-lg">
        <GripVertical className="w-6 h-6 text-[#9095A1]" strokeWidth={2} />
        <div className="flex-1 text-sm font-bold text-black underline">{title}</div>
        <X className="w-6 h-6 text-[#9095A1]" strokeWidth={2} />
      </div>

      {/* Value Display */}
      <div className="flex items-center h-[53px] px-5">
        <div className="text-[30px] font-bold leading-[19px]">
          <span className="text-black">{value} </span>
          {secondaryValue && <span className="text-[#70707B]">{secondaryValue}</span>}
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full max-w-[521px] h-[310px] mx-auto relative bg-white overflow-hidden">
        {chartType === "line" && (
          <>
            {/* Chart Grid Lines */}
            <svg className="absolute left-[61px] top-[23px] w-[460px] h-[1px]" viewBox="0 0 460 2">
              <path d="M0 1L467 1" stroke="#EEEEEF" strokeWidth="1"/>
            </svg>
            <svg className="absolute left-[61px] top-[147px] w-[460px] h-[1px]" viewBox="0 0 460 3">
              <path d="M0 2L460 1" stroke="#EEEEEF" strokeWidth="1"/>
            </svg>
            <svg className="absolute left-[61px] top-[272px] w-[460px] h-[1px]" viewBox="0 0 460 3">
              <path d="M0 2L230 1.5L460 1" stroke="#129AD7" strokeWidth="1" strokeDasharray="2 2"/>
            </svg>

            {/* Y-axis labels */}
            <div className="absolute left-[31px] top-[12px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">10</div>
            <div className="absolute left-[31px] top-[137px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">5</div>
            <div className="absolute left-[31px] top-[262px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">0</div>

            {/* X-axis labels */}
            <div className="absolute left-[31px] top-[280px] w-[459px] h-[22px] flex justify-between">
              {timeLabels.map((label, index) => (
                <div key={index} className="w-[60px] text-center text-[13px] font-bold text-[#A9A9AF]">
                  {label}
                </div>
              ))}
            </div>

            {/* Chart Line */}
            <svg className="absolute left-[61px] top-[273px] w-[142px] h-[1px]" viewBox="0 0 142 4">
              <path d="M0 2L142 2" stroke="#129AD7" strokeWidth="3"/>
            </svg>
          </>
        )}

        {chartType === "empty" && (
          <>
            {/* Y-axis labels */}
            <div className="absolute left-[31px] top-[12px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">10</div>
            <div className="absolute left-[31px] top-[137px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">5</div>
            <div className="absolute left-[31px] top-[262px] w-[22px] h-[22px] text-center text-[13px] font-bold text-[#A9A9AF]">0</div>

            {/* X-axis labels */}
            <div className="absolute left-[31px] top-[280px] w-[459px] h-[22px] flex justify-between">
              {timeLabels.map((label, index) => (
                <div key={index} className="w-[60px] text-center text-[13px] font-bold text-[#A9A9AF]">
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Date Filters */}
      {showDateFilters && (
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-5 h-auto sm:h-16 p-5">
          <div className="flex items-center justify-between w-full sm:w-[141px] h-9 px-2 rounded bg-[#F6F6F7]">
            <svg className="w-5 h-[1px]" viewBox="0 0 20 4">
              <path d="M0 2L20 2" stroke="#129AD7" strokeWidth="3"/>
            </svg>
            <div className="text-center text-sm sm:text-base font-bold text-[#70707B]">24 May 2024</div>
          </div>
          <div className="flex items-center justify-between w-full sm:w-[141px] h-9 px-2 rounded bg-[#F6F6F7]">
            <svg className="w-5 h-[1px]" viewBox="0 0 20 2">
              <path d="M0 1L10 1L20 1" stroke="#129AD7" strokeWidth="1" strokeDasharray="2 2"/>
            </svg>
            <div className="text-center text-sm sm:text-base font-bold text-[#70707B]">23 May 2024</div>
          </div>
        </div>
      )}
    </div>
  );
}
