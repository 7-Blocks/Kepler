import type { Meta, StoryObj } from "@storybook/react"
import { TechLogo } from "./TechLogo"

const meta: Meta<typeof TechLogo> = {
  title: "Components/UI/TechLogo",
  component: TechLogo,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text" },
    slug: { control: "text" },
    colorHex: { control: "text" },
    accentClass: { control: "text" },
  },
}

export default meta
type Story = StoryObj<typeof TechLogo>

export const ReactLogo: Story = {
  args: {
    name: "React",
    slug: "react",
    colorHex: "61DAFB",
    accentClass: "border-cyan-500/20 text-cyan-400 bg-cyan-950/20",
  },
}

export const TypeScriptLogo: Story = {
  args: {
    name: "TypeScript",
    slug: "typescript",
    colorHex: "3178C6",
    accentClass: "border-blue-500/20 text-blue-400 bg-blue-950/20",
  },
}

export const FailFallback: Story = {
  args: {
    name: "Non Existent Tech",
    slug: "nonexistenttechslug",
    colorHex: "ff0000",
    accentClass: "border-red-500/20 text-red-400 bg-red-950/20",
  },
}
