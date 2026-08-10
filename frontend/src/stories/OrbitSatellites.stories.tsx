import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrbitSatellites } from "@/components/ui/OrbitSatellites";

const meta: Meta<typeof OrbitSatellites> = {
  title: "UI/Orbit Satellites",
  component: OrbitSatellites,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Animated orbiting satellite rings with rotating icons. Designed to be used as a decorative overlay around the Globe component.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof OrbitSatellites>;

const Wrapper = (args: React.ComponentProps<typeof OrbitSatellites>) => (
  <div className="relative h-[800px] w-[800px] overflow-hidden rounded-xl bg-[#05070C] flex items-center justify-center">
    <OrbitSatellites {...args} />
  </div>
);

export const Default: Story = {
  render: Wrapper,
};

export const Large: Story = {
  render: Wrapper,
  args: {
    className: "scale-125",
  },
};

export const Small: Story = {
  render: Wrapper,
  args: {
    className: "scale-75",
  },
};