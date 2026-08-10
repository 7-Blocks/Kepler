import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayerManagerPanel } from "@/components/OrbitLayers/LayerManagerPanel";

const meta: Meta<typeof LayerManagerPanel> = {
  title: "Globe/Layer Manager Panel",
  component: LayerManagerPanel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Floating panel docked over the 3D globe, letting users toggle orbit-region and object-category visibility layers in real time.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof LayerManagerPanel>;

const Wrapper = (args: React.ComponentProps<typeof LayerManagerPanel>) => (
  <div className="relative h-[420px] w-[320px] bg-[#05070C] flex items-end justify-end p-4">
    <LayerManagerPanel {...args} />
  </div>
);

export const Default: Story = {
  render: Wrapper,
  args: {
    onClose: () => {},
    regimeCounts: { LEO: 4200, MEO: 180, GEO: 560, HEO: 40 },
    categoryCounts: {
      NAVIGATION: 420,
      WEATHER: 180,
      MILITARY: 260,
      SPACE_DEBRIS: 1200,
      ROCKET_BODY: 340,
      OTHER: 2140,
    },
  },
};
