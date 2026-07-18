import type { Meta, StoryObj } from "@storybook/react"
import { MaterialIcon } from "./MaterialIcon"

const meta: Meta<typeof MaterialIcon> = {
  title: "Components/MaterialIcon",
  component: MaterialIcon,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text" },
    className: { control: "text" },
    filled: { control: "boolean" },
  },
}

export default meta
type Story = StoryObj<typeof MaterialIcon>

export const SettingsIcon: Story = {
  args: {
    name: "settings",
    filled: false,
  },
}

export const FilledSettingsIcon: Story = {
  args: {
    name: "settings",
    filled: true,
    className: "text-blue-500 text-3xl",
  },
}

export const HomeIcon: Story = {
  args: {
    name: "home",
    filled: false,
  },
}
