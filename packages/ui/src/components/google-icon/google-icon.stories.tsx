import type { Meta, StoryObj } from '@storybook/react';
import { GoogleIcon } from '../../../components/GoogleIcon';

const meta: Meta<typeof GoogleIcon> = {
  title: 'Components/GoogleIcon',
  component: GoogleIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Google brand icon component with customizable size.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'range', min: 16, max: 64, step: 4 },
      description: 'Size of the icon in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 20,
  },
};

export const Small: Story = {
  args: {
    size: 16,
  },
};

export const Medium: Story = {
  args: {
    size: 24,
  },
};

export const Large: Story = {
  args: {
    size: 32,
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 48,
  },
};