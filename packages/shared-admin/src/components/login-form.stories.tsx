import type { Meta, StoryObj } from "@storybook/react"
import { LoginForm } from "./login-form"
import { LoginBackground } from "./login-background"

const meta = {
  title: "Components/Login Form",
  component: LoginForm,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    theme: {
      control: "select",
      options: ["admin", "vendor"],
    },
    showRegisterLink: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const AdminTheme: Story = {
  args: {
    theme: "admin",
  },
}

export const VendorTheme: Story = {
  args: {
    theme: "vendor",
    showRegisterLink: true,
  },
}

export const AdminWithBackground: Story = {
  render: (args) => (
    <LoginBackground theme="admin">
      <LoginForm {...args} />
    </LoginBackground>
  ),
  args: {
    theme: "admin",
  },
}

export const VendorWithBackground: Story = {
  render: (args) => (
    <LoginBackground theme="vendor">
      <LoginForm {...args} />
    </LoginBackground>
  ),
  args: {
    theme: "vendor",
    showRegisterLink: true,
  },
}
