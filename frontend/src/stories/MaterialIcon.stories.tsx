import type { Meta, StoryObj } from "@storybook/react-vite";
import { MaterialIcon } from "@/components/MaterialIcon";

const meta: Meta<typeof MaterialIcon> = {
  title: "UI/MaterialIcon",
  component: MaterialIcon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "MaterialIcon renders Google Material Symbols with support for outlined and filled styles. The icon appearance can be customized using the icon name, CSS classes, and the filled prop.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "Name of the Material Symbol to display.",
    },
    filled: {
      control: "boolean",
      description: "Renders the filled version of the icon.",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for styling the icon.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof MaterialIcon>;

export const Default: Story = {
  args: {
    name: "rocket_launch",
  },
};

export const Filled: Story = {
  args: {
    name: "rocket_launch",
    filled: true,
  },
};

export const Large: Story = {
  args: {
    name: "public",
    className: "text-6xl",
  },
};

export const Colored: Story = {
  args: {
    name: "favorite",
    filled: true,
    className: "text-5xl text-red-500",
  },
};

export const Dashboard: Story = {
  render: () => (
    <div className="flex gap-8 text-5xl">
      <MaterialIcon name="rocket_launch" />
      <MaterialIcon name="public" />
      <MaterialIcon name="satellite_alt" />
      <MaterialIcon name="radar" />
      <MaterialIcon name="shield" />
      <MaterialIcon name="analytics" />
    </div>
  ),
};

export const FilledVsOutlined: Story = {
  render: () => (
    <div className="flex gap-10 text-5xl">
      <div className="flex flex-col items-center gap-2">
        <MaterialIcon name="star" />
        <span className="text-sm">Outlined</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <MaterialIcon name="star" filled />
        <span className="text-sm">Filled</span>
      </div>
    </div>
  ),
};