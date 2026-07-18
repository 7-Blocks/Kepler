import React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { MagicCard } from "./magic-card"

const meta: Meta<typeof MagicCard> = {
  title: "Components/UI/MagicCard",
  component: MagicCard,
  tags: ["autodocs"],
  argTypes: {
    gradientSize: { control: "number" },
    gradientColor: { control: "color" },
    gradientOpacity: { control: "number" },
    gradientFrom: { control: "color" },
    gradientTo: { control: "color" },
    mode: {
      control: "radio",
      options: ["gradient", "orb"],
    },
  },
}

export default meta
type Story = StoryObj<typeof MagicCard>

export const GradientMode: Story = {
  args: {
    mode: "gradient",
    gradientSize: 200,
    gradientFrom: "#9E7AFF",
    gradientTo: "#FE8BBB",
    children: (
      <div className="flex h-[200px] w-[350px] flex-col items-center justify-center p-6 text-white">
        <h3 className="text-lg font-bold">Gradient Mode</h3>
        <p className="mt-2 text-center text-sm text-gray-400">
          Move your mouse over the card to see the glowing border effect.
        </p>
      </div>
    ),
  },
}

export const OrbMode: Story = {
  args: {
    mode: "orb",
    glowFrom: "#ee4f27",
    glowTo: "#6b21ef",
    glowSize: 400,
    glowOpacity: 0.8,
    children: (
      <div className="flex h-[200px] w-[350px] flex-col items-center justify-center p-6 text-white">
        <h3 className="text-lg font-bold">Orb Mode</h3>
        <p className="mt-2 text-center text-sm text-gray-400">
          A soft radial orb tracks the cursor smoothly with spring physics.
        </p>
      </div>
    ),
  },
}

export const CyanGlow: Story = {
  args: {
    mode: "gradient",
    gradientFrom: "#00f2fe",
    gradientTo: "#4facfe",
    children: (
      <div className="flex h-[200px] w-[350px] flex-col items-center justify-center p-6 text-white">
        <h3 className="text-lg font-bold">Cyan & Blue</h3>
        <p className="mt-2 text-center text-sm text-gray-400">
          Custom glowing border using Cool Cyan colors.
        </p>
      </div>
    ),
  },
}
