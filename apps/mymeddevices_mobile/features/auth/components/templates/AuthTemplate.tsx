import React, { useEffect, useState, useMemo, ReactNode } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import StepDots from "@/components/common/StepDots";
import { Colors } from "@/types/app";
import {
  useResponsiveDimensions,
  ResponsiveDimensions,
} from "@/hooks/useResponsiveDimensions";

const LOGO = require("@/assets/images/landscape_logo.png");

interface AuthTemplateProps {
  children: ReactNode;
  onBack?: () => void;
  /** Content-aware label shown next to the back chevron (e.g. "Back to Checkout"). */
  backLabel?: string;
  totalSteps?: number;
  currentStep?: number;
  footerContent?: ReactNode;
}

export const AuthTemplate: React.FC<AuthTemplateProps> = ({
  children,
  onBack,
  backLabel,
  totalSteps,
  currentStep,
  footerContent,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsiveDimensions();
  const styles = createStyles(colors, responsive, insets);

  const [mountAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);

  const mountStyle = useMemo(
    () => ({
      opacity: mountAnim,
      transform: [
        {
          translateY: mountAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    }),
    [mountAnim]
  );

  return (
    <View style={styles.container}>
      {/* Pinned Top Navigation Bar */}
      <Animated.View style={[styles.topBarContainer, mountStyle]}>
        <View style={styles.topBar}>
          {onBack ? (
            <TouchableOpacity
              style={[
                styles.backButton,
                backLabel ? styles.backButtonWithLabel : null,
              ]}
              onPress={onBack}
              activeOpacity={0.6}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={backLabel || "Go back"}
            >
              <Icon
                name="chevron-left"
                size={22}
                color={colors.text}
              />
              {backLabel ? (
                <CustomText
                  style={styles.backLabelText}
                  numberOfLines={1}
                >
                  {backLabel}
                </CustomText>
              ) : null}
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}

          {totalSteps && currentStep ? (
            <View
              style={styles.stepDotsLayer}
              pointerEvents="none"
            >
              <StepDots totalSteps={totalSteps} currentStep={currentStep} />
            </View>
          ) : null}

          {/* Balance spacer for centered step dots */}
          <View style={styles.headerSpacer} />
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingBottom: insets.bottom + responsive.getSpacing(36),
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Branding Logo */}
              <Animated.View style={[styles.brandingContainer, mountStyle]}>
                <Image
                  source={LOGO}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="MyMedDevices"
                />
              </Animated.View>

              {/* Screen specific step / form content */}
              {children}

              {/* Footer content */}
              {footerContent && (
                <Animated.View style={[styles.footerContainer, mountStyle]}>
                  {footerContent}
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AuthTemplate;

const createStyles = (
  colors: Colors,
  responsive: ResponsiveDimensions,
  insets: { top: number; bottom: number }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBarContainer: {
      paddingTop: insets.top + responsive.getSpacing(8),
      paddingHorizontal: responsive.horizontalPadding,
      paddingBottom: responsive.getSpacing(8),
      backgroundColor: colors.background,
      zIndex: 10,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 40,
      maxWidth: responsive.containerMaxWidth,
      width: "100%",
      alignSelf: "center",
      position: "relative",
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    backButton: {
      minWidth: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      zIndex: 2,
    },
    backButtonWithLabel: {
      flexDirection: "row",
      maxWidth: "72%",
      gap: 4,
      paddingLeft: 12,
      paddingRight: 16,
    },
    backLabelText: {
      flexShrink: 1,
      color: colors.text,
      fontSize: responsive.getFontSize(14),
      fontWeight: "600",
    },
    stepDotsLayer: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: responsive.horizontalPadding,
      paddingTop: responsive.getSpacing(8),
    },
    content: {
      flex: 1,
      maxWidth: responsive.containerMaxWidth,
      width: "100%",
      alignSelf: "center",
    },
    brandingContainer: {
      alignItems: "center",
      marginBottom: responsive.getSpacing(24),
    },
    logo: {
      width: 180,
      height: 48,
    },
    footerContainer: {
      marginTop: "auto",
      paddingTop: responsive.getSpacing(20),
    },
  });
