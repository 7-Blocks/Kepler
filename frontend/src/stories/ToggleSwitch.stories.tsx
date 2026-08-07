import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

const meta: Meta<typeof ToggleSwitch> = {
  title: "UI/Toggle Switch",
  component: ToggleSwitch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Accessible on/off switch used by the Orbit Layer Manager panel to toggle globe visibility layers.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ToggleSwitch>;

const Interactive = (args: React.ComponentProps<typeof ToggleSwitch>) => {
  const [checked, setChecked] = useState(args.checked);
  return (
    <div className="bg-bg-deep-space p-6">
      <ToggleSwitch {...args} checked={checked} onChange={setChecked} />
    </div>
  );
};

export const On: Story = {
  render: Interactive,
  args: {
    checked: true,
    label: "Active Satellites",
  },
};

export const Off: Story = {
  render: Interactive,
  args: {
    checked: false,
    label: "Active Satellites",
  },
};

export const Disabled: Story = {
  render: Interactive,
  args: {
    checked: true,
    label: "Active Satellites",
    disabled: true,
  },
};
