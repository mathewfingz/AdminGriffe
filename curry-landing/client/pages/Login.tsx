import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[20px] shadow-[40px_40px_60px_0_rgba(228,230,234,0.74)] p-12 text-center">
          <h1 className="font-poppins font-bold text-2xl text-design-foreground-high mb-4">
            Login Page
          </h1>
          <p className="font-poppins text-design-foreground-default mb-6">
            This is a placeholder page. Continue prompting to add login functionality.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-design-primary text-white px-6 py-3 rounded-lg font-poppins font-semibold hover:bg-blue-600 transition-colors"
          >
            Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
