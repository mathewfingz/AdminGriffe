import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Label } from '../../../components/Label';
import { GoogleIcon } from '../../../components/GoogleIcon';

// Form Example Component
const FormExample = () => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
      <form className="space-y-4">
        <div>
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="mt-1"
          />
        </div>
        
        <div className="space-y-3 pt-4">
          <Button className="w-full">
            Sign In
          </Button>
          
          <Button variant="google" className="w-full">
            <GoogleIcon size={20} className="mr-2" />
            Continue with Google
          </Button>
        </div>
      </form>
    </div>
  );
};

const meta: Meta<typeof FormExample> = {
  title: 'Examples/Login Form',
  component: FormExample,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A complete login form example showcasing multiple UI components working together.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithError: Story = {
  render: () => (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
      
      <form className="space-y-4">
        <div>
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="mt-1"
            error
            defaultValue="invalid-email"
          />
          <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
        </div>
        
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="mt-1"
          />
        </div>
        
        <div className="space-y-3 pt-4">
          <Button className="w-full">
            Sign In
          </Button>
          
          <Button variant="google" className="w-full">
            <GoogleIcon size={20} className="mr-2" />
            Continue with Google
          </Button>
        </div>
      </form>
    </div>
  ),
};