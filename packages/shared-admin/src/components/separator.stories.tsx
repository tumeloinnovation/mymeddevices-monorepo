import type { Meta, StoryObj } from "@storybook/react"
import { Separator } from "./ui/separator"

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div>
      <div className="text-sm">Content above</div>
      <Separator className="my-4" />
      <div className="text-sm">Content below</div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="text-sm">Left content</div>
      <Separator orientation="vertical" />
      <div className="text-sm">Right content</div>
    </div>
  ),
}
