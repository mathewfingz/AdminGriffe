import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Index() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('balamia@gmail.com');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Form Container */}
        <div className="bg-white rounded-[20px] shadow-[40px_40px_60px_0_rgba(228,230,234,0.74)] p-12">
          {/* Title */}
          <div className="mb-8 flex flex-col">
            <img
              loading="lazy"
              srcSet="https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fba13dea2100e443594be28096ef0e240%2F32c0fc8ad84747b1ad73c52cc874a901"
              className="w-full mt-5 min-h-5 min-w-5 overflow-hidden object-cover object-center"
              style={{ aspectRatio: "3.72" }}
              alt="Welcome"
            />
            <h1 className="font-poppins font-bold text-[28px] leading-[28px] text-design-foreground-high mx-auto">
              Bienvenid@!
            </h1>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 mb-8">
            {/* Email Field */}
            <div className="space-y-3">
              <label className="block font-poppins font-normal text-base text-design-foreground-default capitalize">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 py-3 font-poppins text-sm text-design-foreground-default bg-white border-[3px] border-design-primary-light rounded-lg focus:outline-none focus:border-design-primary transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-poppins font-normal text-base text-design-foreground-default capitalize">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="font-poppins font-normal text-base text-design-primary capitalize hover:underline"
                >
                  Forgot？
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 py-3 pr-12 font-poppins text-sm text-design-foreground-low placeholder-design-foreground-low bg-white border border-design-outline-default rounded-lg focus:outline-none focus:border-design-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-design-foreground-low hover:text-design-foreground-default transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-6">
            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full h-12 bg-design-primary hover:bg-blue-600 text-design-surface font-poppins font-bold text-base rounded-lg transition-colors duration-200"
            >
              Create account
            </button>

            {/* Continue with Google Button */}
            <button
              type="button"
              className="w-full h-12 bg-design-primary-light hover:bg-blue-100 text-design-primary font-poppins font-bold text-base rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_503_243)">
                  <path d="M20.3051 10.2305C20.3051 9.55068 20.25 8.86724 20.1324 8.19849H10.7001V12.0493H16.1015C15.8774 13.2913 15.1572 14.3899 14.1026 15.0881V17.5867H17.3251C19.2175 15.845 20.3051 13.2729 20.3051 10.2305Z" fill="#4285F4"/>
                  <path d="M10.6999 20.0008C13.397 20.0008 15.6714 19.1152 17.3286 17.5867L14.1061 15.088C13.2096 15.698 12.0521 16.0434 10.7036 16.0434C8.09474 16.0434 5.88272 14.2833 5.08904 11.917H1.76367V14.4928C3.46127 17.8696 6.91892 20.0008 10.6999 20.0008Z" fill="#34A853"/>
                  <path d="M5.08552 11.917C4.66664 10.675 4.66664 9.3302 5.08552 8.08824V5.51245H1.76382C0.345489 8.3381 0.345489 11.6671 1.76382 14.4928L5.08552 11.917Z" fill="#FBBC04"/>
                  <path d="M10.6999 3.95805C12.1256 3.936 13.5035 4.47247 14.536 5.45722L17.3911 2.60218C15.5833 0.904587 13.1838 -0.0287217 10.6999 0.000673888C6.91892 0.000673888 3.46126 2.13185 1.76367 5.51234L5.08537 8.08813C5.87537 5.71811 8.09106 3.95805 10.6999 3.95805Z" fill="#EA4335"/>
                </g>
                <defs>
                  <clipPath id="clip0_503_243">
                    <rect width="20" height="20" fill="white" transform="translate(0.5)"/>
                  </clipPath>
                </defs>
              </svg>
              Continue with Google
            </button>

            {/* Login Link */}
            <div className="flex items-center justify-center gap-2 text-center">
              <span className="font-poppins font-normal text-base text-design-foreground-low capitalize">
                Already have an account ?
              </span>
              <Link 
                to="/login" 
                className="font-poppins font-normal text-base text-design-primary capitalize hover:underline"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
