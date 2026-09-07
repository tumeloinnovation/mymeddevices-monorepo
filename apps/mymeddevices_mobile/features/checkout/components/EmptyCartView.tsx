import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

const EmptyCartView: React.FC = () => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Visual Icon Badge */}
        <View style={styles.iconCircle}>
          <Icon name="shopping-cart" size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>Your Cart is Empty</Text>
        <Text style={styles.subtitle}>
          You haven't added any medical devices or health care essentials to your cart yet.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.navigate("/(shop)")}
            activeOpacity={0.85}
          >
            <Icon name="search" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Start Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.navigate("/wishlist")}
            activeOpacity={0.85}
          >
            <Icon name="heart" size={18} color={colors.text} />
            <Text style={styles.secondaryButtonText}>View Saved Items</Text>
          </TouchableOpacity>
        </View>

        {/* Healthcare Assurance Highlights */}
        <View style={styles.assurancesCard}>
          <View style={styles.assuranceItem}>
            <View style={[styles.assuranceIcon, { backgroundColor: colors.primary + "15" }]}>
              <Icon name="shield-check" size={16} color={colors.primary} />
            </View>
            <View style={styles.assuranceTextCol}>
              <Text style={styles.assuranceTitle}>100% Genuine & Approved</Text>
              <Text style={styles.assuranceDesc}>Tested and certified health devices</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.assuranceItem}>
            <View style={[styles.assuranceIcon, { backgroundColor: "#10B98115" }]}>
              <Icon name="truck" size={16} color="#10B981" />
            </View>
            <View style={styles.assuranceTextCol}>
              <Text style={styles.assuranceTitle}>Fast Countrywide Delivery</Text>
              <Text style={styles.assuranceDesc}>Doorstep delivery across all 47 counties</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.assuranceItem}>
            <View style={[styles.assuranceIcon, { backgroundColor: "#8B5CF615" }]}>
              <Icon name="credit-card" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.assuranceTextCol}>
              <Text style={styles.assuranceTitle}>Pay with Lipa na M-Pesa</Text>
              <Text style={styles.assuranceDesc}>Instant and safe payment via your phone</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default EmptyCartView;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: SIZES.spacingLG,
      paddingBottom: Math.max(bottomInset, 16) + 84,
    },
    content: {
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
    },
    iconCircle: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      borderWidth: 1.5,
      borderColor: colors.primary + "25",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 20,
      opacity: 0.75,
      marginBottom: 26,
      paddingHorizontal: 12,
    },
    buttonGroup: {
      width: "100%",
      gap: 10,
      marginBottom: 30,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: SIZES.radius_medium,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryButton: {
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 13,
      paddingHorizontal: 20,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
    },
    assurancesCard: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    assuranceItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    assuranceIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    assuranceTextCol: {
      flex: 1,
    },
    assuranceTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    assuranceDesc: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.6,
    },
  });
