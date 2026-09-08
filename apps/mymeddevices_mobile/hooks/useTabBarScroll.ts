import { useCallback, useRef } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import useAppStore from "@/stores/useAppStore";

interface UseTabBarScrollOptions {
  threshold?: number;
  minScrollY?: number;
}

export function useTabBarScroll(options?: UseTabBarScrollOptions) {
  const { threshold = 16, minScrollY = 30 } = options || {};
  const setTabBarVisible = useAppStore((s) => s.setTabBarVisible);
  const lastScrollY = useRef(0);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      // Always show at top of page
      if (currentY <= minScrollY) {
        setTabBarVisible(true);
        lastScrollY.current = currentY;
        return;
      }

      if (diff > threshold) {
        // Scrolling down
        setTabBarVisible(false);
        lastScrollY.current = currentY;
      } else if (diff < -threshold) {
        // Scrolling up
        setTabBarVisible(true);
        lastScrollY.current = currentY;
      }
    },
    [minScrollY, setTabBarVisible, threshold]
  );

  return { onScroll, scrollEventThrottle: 16 };
}
