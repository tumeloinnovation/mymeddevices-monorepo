import type { Meta, StoryObj } from "@storybook/react"
import { Label } from "./ui/label"
import { Input } from "./ui/input"

const meta = {
  title: "Components/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Label htmlFor="email">Email</Label>,
}

export const WithInput: Story = {
  render: () => (
    <div className="grid gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="Email" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Label htmlFor="disabled" disabled>
      Disabled Label
    </Label>
  ),
}
