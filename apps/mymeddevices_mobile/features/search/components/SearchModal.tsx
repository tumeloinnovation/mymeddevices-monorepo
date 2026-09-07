import { useTheme } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";

import SearchContent from "./SearchContent";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const ANIMATION_DURATION = 260;

const SearchModal: React.FC<SearchModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();

  const [mounted, setMounted] = useState(visible);
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [contentScale] = useState(() => new Animated.Value(1.04));
  const [contentOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 1.04,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, backdropOpacity, contentOpacity, contentScale]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.background,
            opacity: backdropOpacity,
            paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
          ]}
          pointerEvents="box-none"
        >
          <SearchContent onClose={onClose} autoFocus />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SearchModal;
