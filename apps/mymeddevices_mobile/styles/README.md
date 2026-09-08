# Styling Guide: Theme-Aware `createStyles` Factory Pattern

To ensure consistent support for dark mode and responsive styling across the application, all React Native components must follow the **Theme Factory** styling pattern.

## The Standard Pattern

1. **Define a `createStyles` function** outside the component (or at the bottom of the file) taking `colors: Colors` (from `@/types/app`) and optional layout parameters (e.g. `bottomInset`, `responsive`):

```tsx
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";

export const MyComponent = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={styles.container} />;
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
  });
```

## Guidelines

- **No Static `StyleSheet.create` for Colors**: Never hardcode colors or use module-level static style definitions containing colors, as they will not update when switching between Light and Dark themes.
- **Theme Tokens Only**: Use `colors.<token>` (`primary`, `secondary`, `background`, `card`, `text`, `textSecondary`, `border`, `error`, `success`, `warning`, `info`, etc.) instead of hardcoded hex/named colors like `#fff`, `#000`, `red`, etc.
- **Typography & Sizing**: Use `SIZES` from `@/styles/sizes` and typography helpers from `@/components/common/CustomText` rather than hardcoding arbitrary font weights and sizes where applicable.
