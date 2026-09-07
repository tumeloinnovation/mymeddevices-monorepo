import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import CustomText from "@/components/common/CustomText";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";
import { CheckoutMode } from "@/types/checkout";

const { height } = Dimensions.get("window");

interface AuthGateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMode: (mode: CheckoutMode) => void;
}

export default function AuthGateModal({
  visible,
  onClose,
  onSelectMode,
}: AuthGateModalProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const benefits = [
    {
      icon: "zap",
      title: "Faster Checkout",
      description: "Save your details for quicker orders",
    },
    {
      icon: "receipt",
      title: "Order History",
      description: "Track all your orders in one place",
    },
    {
      icon: "map-pin",
      title: "Saved Addresses",
      description: "Store multiple delivery addresses",
    },
    {
      icon: "heart",
      title: "Wishlist",
      description: "Save items for later purchase",
    },
  ];

  const handleLogin = () => {
    onSelectMode("returning");
    onClose();
    router.push("/(auth)/login?returnTo=checkout");
  };

  const handleRegister = () => {
    onSelectMode("new_account");
    onClose();
    router.push("/(auth)/register?returnTo=checkout");
  };

  const handleGuestCheckout = () => {
    onSelectMode("guest");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.container}>
          <View style={styles.header}>
            <CustomText variant="h3" style={styles.headerTitle}>
              Sign in for a better experience
            </CustomText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.benefitsContainer}>
              {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View
                    style={[
                      styles.benefitIcon,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Icon
                      name={benefit.icon}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.benefitText}>
                    <CustomText variant="body" style={styles.benefitTitle}>
                      {benefit.title}
                    </CustomText>
                    <CustomText variant="caption" style={styles.benefitDescription}>
                      {benefit.description}
                    </CustomText>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleLogin}
              >
                <CustomText variant="body" style={styles.primaryButtonText}>
                  Sign In
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRegister}
              >
                <CustomText variant="body" style={styles.secondaryButtonText}>
                  Create Account
                </CustomText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuestCheckout}
              >
                <CustomText variant="body" style={styles.guestButtonText}>
                  Continue as Guest
                </CustomText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: SIZES.radiusXL,
      borderTopRightRadius: SIZES.radiusXL,
      maxHeight: height * 0.8,
      paddingBottom: 34,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: SIZES.paddingLG,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flex: 1,
    },
    closeButton: {
      padding: SIZES.paddingSM,
    },
    content: {
      padding: SIZES.paddingLG,
    },
    benefitsContainer: {
      marginBottom: SIZES.paddingXL,
    },
    benefitItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SIZES.paddingLG,
    },
    benefitIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SIZES.paddingMD,
    },
    benefitText: {
      flex: 1,
    },
    benefitTitle: {
      fontWeight: "600",
      marginBottom: 2,
    },
    benefitDescription: {
      color: colors.text + "CC",
    },
    actions: {
      gap: SIZES.paddingMD,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      padding: SIZES.paddingMD,
      borderRadius: SIZES.radius,
      alignItems: "center",
    },
    primaryButtonText: {
      color: "#fff",
      fontWeight: "bold",
    },
    secondaryButton: {
      backgroundColor: colors.card,
      padding: SIZES.paddingMD,
      borderRadius: SIZES.radius,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: "600",
    },
    guestButton: {
      padding: SIZES.paddingMD,
      alignItems: "center",
      marginBottom: SIZES.paddingXL,
    },
    guestButtonText: {
      color: colors.text + "CC",
    },
  });
