import type { Meta, StoryObj } from "@storybook/react"
import { FullPageLoading, LoadingSpinner, TableLoading, CardLoading, Skeleton } from "./page-loading"

const meta = {
  title: "Components/Loading",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Spinner: Story = {
  render: () => <LoadingSpinner size="lg" />,
}

export const FullPage: Story = {
  render: () => <FullPageLoading message="Loading dashboard..." />,
}

export const Inline: Story = {
  render: () => <LoadingSpinner size="sm" />,
}

export const Table: Story = {
  render: () => <TableLoading rowCount={5} />,
}

export const Cards: Story = {
  render: () => <CardLoading count={3} />,
}

export const SkeletonComponent: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
}
