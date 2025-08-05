import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '../../../components/Label';

const meta: Meta<typeof Label> = {
  title: 'Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A label component for form fields with optional required indicator.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
      description: 'Whether the field is required (shows asterisk)',
    },
    children: {
      control: 'text',
      description: 'The label text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Email Address',
  },
};

export const Required: Story = {
  args: {
    children: 'Password',
    required: true,
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a very long label text that might wrap to multiple lines',
  },
};

export const WithHtmlFor: Story = {
  args: {
    children: 'Username',
    htmlFor: 'username-input',
  },
};