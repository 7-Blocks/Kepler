import type { Meta, StoryObj } from "@storybook/react-vite";
import { TechLogo } from "@/components/ui/TechLogo";

const meta: Meta<typeof TechLogo> = {
  title: "UI/TechLogo",
  component: TechLogo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "TechLogo displays a technology logo using the Simple Icons CDN. If the logo cannot be loaded or no slug is provided, it automatically falls back to the technology's initials.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
      description: "Technology name used for alt text and initials.",
    },
    slug: {
      control: "text",
      description: "Simple Icons slug used to fetch the logo.",
    },
    colorHex: {
      control: "text",
      description: "Hex color used for the Simple Icons logo.",
    },
    accentClass: {
      control: "text",
      description: "Tailwind classes applied to the logo container.",
    },
  },
};

export default meta;

type Story = StoryObj<typeof TechLogo>;

const baseArgs = {
  accentClass: "border-slate-300 bg-slate-100",
};

export const ReactLogo: Story = {
  args: {
    ...baseArgs,
    name: "React",
    slug: "react",
    colorHex: "61DAFB",
  },
};

export const TypeScriptLogo: Story = {
  args: {
    ...baseArgs,
    name: "TypeScript",
    slug: "typescript",
    colorHex: "3178C6",
  },
};

export const TailwindCSSLogo: Story = {
  args: {
    ...baseArgs,
    name: "Tailwind CSS",
    slug: "tailwindcss",
    colorHex: "06B6D4",
  },
};

export const FallbackInitials: Story = {
  args: {
    ...baseArgs,
    name: "Orbital Guardian",
    slug: "",
    colorHex: "000000",
  },
};

export const InvalidSlug: Story = {
  args: {
    ...baseArgs,
    name: "Unknown Framework",
    slug: "this-does-not-exist",
    colorHex: "000000",
  },
};

export const TechnologyGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6">
      <TechLogo
        name="React"
        slug="react"
        colorHex="61DAFB"
        accentClass="border-sky-300 bg-sky-50"
      />

      <TechLogo
        name="TypeScript"
        slug="typescript"
        colorHex="3178C6"
        accentClass="border-blue-300 bg-blue-50"
      />

      <TechLogo
        name="Tailwind CSS"
        slug="tailwindcss"
        colorHex="06B6D4"
        accentClass="border-cyan-300 bg-cyan-50"
      />

      <TechLogo
        name="Vite"
        slug="vite"
        colorHex="646CFF"
        accentClass="border-violet-300 bg-violet-50"
      />

      <TechLogo
        name="Cesium"
        slug="cesium"
        colorHex="6CADDF"
        accentClass="border-indigo-300 bg-indigo-50"
      />

      <TechLogo
        name="Orbital Guardian"
        slug=""
        colorHex="000000"
        accentClass="border-slate-300 bg-slate-100"
      />
    </div>
  ),
};