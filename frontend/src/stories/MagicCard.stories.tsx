import type { Meta, StoryObj } from "@storybook/react-vite";
import { MagicCard } from "@/components/ui/magic-card";

const meta: Meta<typeof MagicCard> = {
  title: "UI/MagicCard",
  component: MagicCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "MagicCard is an interactive container component with animated gradient and orb glow effects that respond to pointer movement. It supports both gradient and orb modes and can wrap any custom content.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    gradientFrom: {
      control: "color",
      description: "Starting color of the gradient border.",
    },
    gradientTo: {
      control: "color",
      description: "Ending color of the gradient border.",
    },
    gradientColor: {
      control: "color",
      description: "Hover gradient overlay color.",
    },
    gradientSize: {
      control: {
        type: "range",
        min: 100,
        max: 500,
        step: 10,
      },
      description: "Size of the animated gradient.",
    },
    glowFrom: {
      control: "color",
      description: "Starting glow color (orb mode).",
    },
    glowTo: {
      control: "color",
      description: "Ending glow color (orb mode).",
    },
    glowSize: {
      control: {
        type: "range",
        min: 200,
        max: 600,
        step: 20,
      },
      description: "Diameter of the glow orb.",
    },
    glowBlur: {
      control: {
        type: "range",
        min: 10,
        max: 100,
        step: 5,
      },
      description: "Blur radius of the glow orb.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof MagicCard>;

const baseArgs = {
  className: "w-80 h-48 rounded-2xl p-6",
};

export const Default: Story = {
  args: {
    ...baseArgs,
    mode: "gradient",
    children: (
      <div className="flex h-full items-center justify-center">
        <h2 className="text-xl font-bold">Magic Card</h2>
      </div>
    ),
  },
};



export const Orb: Story = {
  args: {
    ...baseArgs,
    mode: "orb",
    glowFrom: "#8B5CF6",
    glowTo: "#EC4899",
    children: (
      <div className="flex h-full items-center justify-center text-lg font-semibold">
        Purple-Pink Orb
      </div>
    ),
  },
};

export const BlueOrb: Story = {
  args: {
    ...baseArgs,
    mode: "orb",
    glowFrom: "#06B6D4",
    glowTo: "#2563EB",
    glowSize: 320,
    glowBlur: 70,
    children: (
      <div className="flex h-full items-center justify-center text-lg font-semibold">
        Blue Orb
      </div>
    ),
  },
};

export const DashboardCard: Story = {
  args: {
    ...baseArgs,
    mode: "gradient",
    children: (
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-sm opacity-70">Active Satellites</p>
          <h2 className="text-4xl font-bold">12,348</h2>
        </div>

        <span className="text-sm text-green-500">
          ↑ 5.6% from last week
        </span>
      </div>
    ),
  },
};

export const Large: Story = {
  args: {
    mode: "gradient",
    className: "w-[500px] h-[300px] rounded-3xl p-8",
    children: (
      <div className="flex h-full items-center justify-center text-3xl font-bold">
        Large Magic Card
      </div>
    ),
  },
};