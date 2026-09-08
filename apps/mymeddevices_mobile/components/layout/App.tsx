import React from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { Stack, useSegments } from "expo-router";
import { DarkTheme, LightTheme } from "@/styles/colors";
import { Toaster } from "sonner-native";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider as RNThemeProvider, DefaultTheme as RNDefaultTheme } from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePushNotifications } from "@/services/notification.service";
import { updateAuthReferrer } from "@/features/auth/utils/backNavigation";
import OfflineNetworkBanner from "@/components/common/OfflineNetworkBanner";

const App = () => {
  usePushNotifications();
  const segments = useSegments();

  // Remember the last non-auth screen so auth screens can offer a
  // content-aware back label ("Back to Checkout", "Back to Home", ...).
  React.useEffect(() => {
    updateAuthReferrer(segments);
  }, [segments]);
  const insets = useSafeAreaInsets();
  const { theme } = React.useContext(ThemeContext);


  const appTheme = theme === "dark" ? DarkTheme : LightTheme;

  const navTheme = {
    dark: appTheme.dark,
    colors: appTheme.colors,
    fonts: RNDefaultTheme.fonts,
  };

  React.useEffect(() => {
    const updateSystemUI = async () => {
      await SystemUI.setBackgroundColorAsync(appTheme.colors.card);
    };

    updateSystemUI();
  }, [appTheme.colors.background, theme]);

  return (
    <RNThemeProvider value={navTheme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerBackTitle: "Back",
            headerStyle: {
              backgroundColor: appTheme.colors.card,
            },

            headerTintColor: appTheme.colors.text,
            statusBarStyle: theme === "dark" ? "light" : "dark",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerShown: true,
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(shop)" options={{ headerShown: false }} />
          <Stack.Screen name="checkout" options={{ headerShown: true, title: "Checkout" }} />
          <Stack.Screen name="order-tracking" options={{ headerShown: true, title: "Track Order" }} />
          <Stack.Screen name="order-history" options={{ headerShown: false }} />
          <Stack.Screen name="product-view" options={{ headerShown: true, title: "Product Details" }} />
          <Stack.Screen name="products-category" options={{ headerShown: true, title: "Products" }} />
          <Stack.Screen name="guest-order-history" options={{ headerShown: true, title: "Order Lookup" }} />
          <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications" }} />
          <Stack.Screen name="notifications-settings" options={{ headerShown: true, title: "Notification Settings" }} />
          <Stack.Screen name="compare" options={{ headerShown: true, title: "Compare" }} />
          <Stack.Screen name="wishlist" options={{ headerShown: true, title: "Wishlist" }} />
          <Stack.Screen name="questions" options={{ headerShown: true, title: "FAQ & Inquiries" }} />
          <Stack.Screen name="terms-n-conditions" options={{ headerShown: true, title: "Terms & Conditions" }} />
          <Stack.Screen name="(aux)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
      <OfflineNetworkBanner />
      <Toaster
        position="top-center"
        offset={insets.top + 10}
        theme={theme === "dark" ? "dark" : "light"}
        richColors
        toastOptions={{
          titleStyle: {
            fontSize: 13,
            lineHeight: 18,
            fontWeight: "700",
          },
          descriptionStyle: {
            fontSize: 12,
            lineHeight: 16,
            marginTop: 2,
          },
          style: {
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
          },
        }}
      />
    </RNThemeProvider>
  );
};

export default App;
