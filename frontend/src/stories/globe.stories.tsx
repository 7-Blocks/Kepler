import type { Meta, StoryObj } from "@storybook/react-vite";
import { Globe } from "@/components/ui/globe";
import type { COBEOptions } from "cobe";

const meta: Meta<typeof Globe> = {
  title: "UI/Globe",
  component: Globe,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Interactive 3D globe powered by COBE. Supports custom globe configuration and pointer interaction.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Globe>;

const Wrapper = (args: React.ComponentProps<typeof Globe>) => (
  <div className="relative h-[500px] w-[500px] rounded-xl bg-[#05070C] overflow-hidden">
    <Globe {...args} />
  </div>
);

export const Default: Story = {
  render: Wrapper,
};

export const BlueGlow: Story = {
  render: Wrapper,
  args: {
    config: {
      markerColor: [76 / 255, 214 / 255, 240 / 255],
      glowColor: [0.3, 0.8, 1],
    } as Partial<COBEOptions> as COBEOptions,
  },
};

export const OrangeMarkers: Story = {
  render: Wrapper,
  args: {
    config: {
      markerColor: [1, 0.45, 0],
    } as Partial<COBEOptions> as COBEOptions,
  },
};