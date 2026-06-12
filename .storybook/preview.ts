import type { Preview } from "@storybook/react"
import "../packages/shared-admin/src/lib/utils" // Initialize tailwind
import "../packages/shared-ui/tailwind.config" // Initialize shared-ui tailwind

const preview: Preview = {
  parameters: {
    controls: {
      matchSortAndColor: true,
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0a0a0a" },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
