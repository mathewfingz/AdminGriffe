import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Index() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("balamia@gmail.com");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Navy Background with Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Navy background with gradient */}
        <div className="absolute inset-0 bg-griffe-navy">
          {/* SVG Background Effects */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 720 900" fill="none">
            <defs>
              <filter id="filter0_f" x="-550" y="215" width="1479" height="1479" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="275" result="effect1_foregroundBlur"/>
              </filter>
              <filter id="filter1_f" x="35" y="-686" width="1479" height="1479" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="275" result="effect1_foregroundBlur"/>
              </filter>
              <clipPath id="clip0">
                <rect width="720" height="900" fill="white"/>
              </clipPath>
            </defs>
            <g clipPath="url(#clip0)">
              <g filter="url(#filter0_f)">
                <circle cx="189.5" cy="954.5" r="189.5" fill="#2D55FB"/>
              </g>
              <g filter="url(#filter1_f)">
                <circle cx="774.5" cy="53.5" r="189.5" fill="#2D55FB"/>
              </g>
            </g>
          </svg>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center px-20 py-16">
          {/* GRIFFE Logo */}
          <div className="mb-20">
            <h1 className="text-white text-6xl xl:text-7xl font-bold tracking-wider font-poppins">
              GRIFFE
            </h1>
          </div>

          {/* Spanish Text */}
          <div className="max-w-lg">
            <h2 className="text-white text-4xl xl:text-5xl font-light italic leading-tight font-poppins">
              <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
                Comerciar es mas que vender, es cumplir sueños
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right Side - White Background with Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-12 py-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo for smaller screens */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-griffe-navy text-4xl font-bold tracking-wider font-poppins">
              GRIFFE
            </h1>
          </div>

          {/* Form Container */}
          <div className="space-y-8">
            {/* Title */}
            <div>
              <h2 className="text-griffe-gray-high text-3xl font-semibold font-poppins">
                Create an account
              </h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <label className="block text-griffe-gray-default text-base font-normal font-poppins capitalize">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 py-3 rounded-lg border-3 border-griffe-border-primary text-griffe-gray-default text-sm font-poppins focus:outline-none focus:border-griffe-blue transition-colors"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <label className="block text-griffe-gray-default text-base font-normal font-poppins capitalize">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 px-4 py-3 pr-12 rounded-lg border border-griffe-border-default text-griffe-gray-low text-sm font-poppins placeholder:text-griffe-gray-low focus:outline-none focus:border-griffe-blue transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-griffe-gray-low hover:text-griffe-gray-default transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-6 h-6" />
                    ) : (
                      <Eye className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-6">
              {/* Create Account Button */}
              <button className="w-full h-12 bg-griffe-blue text-griffe-white text-base font-semibold font-poppins rounded-lg hover:bg-griffe-blue/90 transition-colors">
                Create account
              </button>

              {/* Continue with Google Button */}
              <button className="w-full h-12 bg-griffe-blue-light text-griffe-blue text-base font-semibold font-poppins rounded-lg flex items-center justify-center gap-2 hover:bg-griffe-blue-light/80 transition-colors">
                <svg width="20" height="20" viewBox="0 0 21 20" fill="none">
                  <g clipPath="url(#clip0_google)">
                    <path d="M20.305 10.2305C20.305 9.55068 20.2499 8.86724 20.1323 8.19849H10.7V12.0493H16.1014C15.8773 13.2913 15.1571 14.3899 14.1025 15.0881V17.5867H17.325C19.2173 15.845 20.305 13.2729 20.305 10.2305Z" fill="#4285F4"/>
                    <path d="M10.6999 20.0008C13.397 20.0008 15.6714 19.1152 17.3286 17.5867L14.1061 15.088C13.2096 15.698 12.0521 16.0434 10.7036 16.0434C8.09474 16.0434 5.88272 14.2833 5.08904 11.917H1.76367V14.4928C3.46127 17.8696 6.91892 20.0008 10.6999 20.0008Z" fill="#34A853"/>
                    <path d="M5.0854 11.917C4.66651 10.675 4.66651 9.3302 5.0854 8.08824V5.51245H1.7637C0.345367 8.3381 0.345367 11.6671 1.7637 14.4928L5.0854 11.917Z" fill="#FBBC04"/>
                    <path d="M10.6999 3.95805C12.1256 3.936 13.5035 4.47247 14.536 5.45722L17.3911 2.60218C15.5833 0.904587 13.1838 -0.0287217 10.6999 0.000673888C6.91892 0.000673888 3.46126 2.13185 1.76367 5.51234L5.08537 8.08813C5.87537 5.71811 8.09106 3.95805 10.6999 3.95805Z" fill="#EA4335"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_google">
                      <rect width="20" height="20" fill="white" transform="translate(0.5)"/>
                    </clipPath>
                  </defs>
                </svg>
                Continue with Google
              </button>

              {/* Sign In Link */}
              <div className="flex items-center justify-center gap-2 text-base font-poppins">
                <span className="text-griffe-gray-low capitalize">
                  Already have an account ?
                </span>
                <button className="text-griffe-blue capitalize hover:underline">
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
