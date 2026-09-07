import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, StatusBar as RNStatusBar, Platform } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";

export const OfflineNetworkBanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnectedAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;

      if (!online) {
        setIsConnected(false);
        setWasOffline(true);
        RNStatusBar.setBarStyle("light-content", true);
        if (Platform.OS === "android") {
          RNStatusBar.setBackgroundColor("#DC2626", true);
        }
      } else {
        if (wasOffline) {
          setIsConnected(true);
          // Show restored message briefly then fade out
          Animated.sequence([
            Animated.timing(reconnectedAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
            Animated.timing(reconnectedAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => setWasOffline(false));
        } else {
          setIsConnected(true);
        }
      }
    });

    return () => unsubscribe();
  }, [wasOffline, reconnectedAnim]);

  // If online and not animating a "reconnected" toast, render null (no banner)
  if (isConnected && !wasOffline) {
    return null;
  }

  const isOfflineState = !isConnected;

  return (
    <>
      {isOfflineState && <ExpoStatusBar style="light" animated />}
      <View
        pointerEvents="none"
        style={[
          styles.container,
          { paddingTop: Math.max(insets.top, 8) + 4 },
          isOfflineState ? styles.offlineBg : styles.onlineBg,
        ]}
      >
        <View style={styles.contentRow}>
          <Icon
            name={isOfflineState ? "wifi-off" : "wifi"}
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.bannerText}>
            {isOfflineState
              ? "You are offline"
              : "Back online"}
          </Text>
        </View>
      </View>
    </>
  );
};

export default React.memo(OfflineNetworkBanner);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    paddingBottom: 6,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 6,
  },
  offlineBg: {
    backgroundColor: "#DC2626", // Medical urgent red
  },
  onlineBg: {
    backgroundColor: "#059669", // Emerald green
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});
