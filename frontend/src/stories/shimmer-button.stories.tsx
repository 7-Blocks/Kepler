import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { ArrowRight } from "lucide-react";

const meta: Meta<typeof ShimmerButton> = {
  title: "UI/Shimmer Button",
  component: ShimmerButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ShimmerButton is an animated button component featuring a customizable shimmer effect. It supports custom colors, border radius, animation speed, and all standard HTML button props.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    shimmerColor: {
      control: "color",
      description: "Color of the shimmer animation.",
    },
    background: {
      control: "color",
      description: "Background color of the button.",
    },
    shimmerDuration: {
      control: "text",
      description: "Duration of the shimmer animation (e.g. '3s').",
    },
    shimmerSize: {
      control: "text",
      description: "Thickness of the shimmer border.",
    },
    borderRadius: {
      control: "text",
      description: "Border radius of the button.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the button.",
    },
    onClick: {
      action: "clicked",
    },
  },
};

export default meta;

type Story = StoryObj<typeof ShimmerButton>;

const baseArgs = {
  children: "Get Started",
};

export const Default: Story = {
  args: {
    ...baseArgs,
  },
};

export const BlueShimmer: Story = {
  args: {
    ...baseArgs,
    shimmerColor: "#38BDF8",
    background: "#1E3A8A",
  },
};

export const PurpleShimmer: Story = {
  args: {
    ...baseArgs,
    shimmerColor: "#A855F7",
    background: "#312E81",
  },
};

export const Rounded: Story = {
  args: {
    ...baseArgs,
    borderRadius: "16px",
  },
};

export const FastAnimation: Story = {
  args: {
    ...baseArgs,
    shimmerDuration: "1.5s",
  },
};

export const Disabled: Story = {
  args: {
    ...baseArgs,
    disabled: true,
  },
};

export const WithIcon: Story = {
  render: (args) => (
    <ShimmerButton {...args}>
      <span className="flex items-center gap-2">
        Get Started
        <ArrowRight size={18} />
      </span>
    </ShimmerButton>
  ),
};

export const CallToAction: Story = {
  render: (args) => (
    <ShimmerButton
      {...args}
      className="px-8 py-4 text-lg font-semibold"
    >
      Launch Mission 🚀
    </ShimmerButton>
  ),
};