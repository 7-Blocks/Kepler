import type { Meta, StoryObj } from "@storybook/react"
import { ShimmerButton } from "./shimmer-button"

const meta: Meta<typeof ShimmerButton> = {
  title: "Components/UI/ShimmerButton",
  component: ShimmerButton,
  tags: ["autodocs"],
  argTypes: {
    shimmerColor: { control: "color" },
    shimmerSize: { control: "text" },
    borderRadius: { control: "text" },
    shimmerDuration: { control: "text" },
    background: { control: "text" },
  },
}

export default meta
type Story = StoryObj<typeof ShimmerButton>

export const Default: Story = {
  args: {
    children: "Shimmer Button",
  },
}

export const CustomColor: Story = {
  args: {
    shimmerColor: "#ff0055",
    children: "Pink Shimmer",
  },
}

export const FastAndBold: Story = {
  args: {
    shimmerColor: "#00ffff",
    shimmerSize: "0.15em",
    shimmerDuration: "1.5s",
    children: "Fast & Bold",
  },
}

export const CustomBorderRadius: Story = {
  args: {
    borderRadius: "8px",
    children: "Square Shimmer",
  },
}
