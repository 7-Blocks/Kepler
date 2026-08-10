import type { Meta, StoryObj } from "@storybook/react-vite";
import { Particles } from "@/components/ui/particles";

const meta: Meta<typeof Particles> = {
  title: "UI/Particles",
  component: Particles,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Animated particle background with configurable density, color, size, and movement.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    quantity: {
      control: { type: "number" },
    },
    color: {
      control: "color",
    },
    size: {
      control: { type: "number" },
    },
    staticity: {
      control: { type: "number" },
    },
    ease: {
      control: { type: "number" },
    },
    vx: {
      control: { type: "number" },
    },
    vy: {
      control: { type: "number" },
    },
    refresh: {
      control: "boolean",
    },
  },
};

export default meta;

type Story = StoryObj<typeof Particles>;

const Template = (args: React.ComponentProps<typeof Particles>) => (
  <div className="relative h-[500px] w-full overflow-hidden rounded-xl bg-[#05070C]">
    <Particles {...args} />
  </div>
);

export const Default: Story = {
  render: Template,
  args: {
    quantity: 100,
    color: "#ffffff",
  },
};

export const Dense: Story = {
  render: Template,
  args: {
    quantity: 250,
    color: "#ffffff",
  },
};

export const Sparse: Story = {
  render: Template,
  args: {
    quantity: 40,
    color: "#ffffff",
  },
};

export const CyanParticles: Story = {
  render: Template,
  args: {
    quantity: 120,
    color: "#4CD6F0",
  },
};

export const LargeParticles: Story = {
  render: Template,
  args: {
    quantity: 80,
    size: 2,
    color: "#9D7BFF",
  },
};

export const MovingParticles: Story = {
  render: Template,
  args: {
    quantity: 120,
    vx: 0.2,
    vy: 0.1,
    color: "#4CD6F0",
  },
};