
import 'react-native-get-random-values'
import { GestureHandlerRootView } from "react-native-gesture-handler";

import React from "react";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { SafeAreaProvider } from "react-native-safe-area-context";

import App from "@/components/layout/App";
import { ThemeProvider } from "@/context/ThemeContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { persistOptions, queryClient } from "@/services/reactQueryClient";

// SplashScreen.preventAutoHideAsync();

// LogBox.ignoreAllLogs();

const RootLayout = () => {
  React.useEffect(() => {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
      });
    });
  }, []);

  // SplashScreen.hideAsync();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
          >
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
};

export default RootLayout;
