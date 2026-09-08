import React, { useLayoutEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation } from "expo-router";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUserStore } from "@/features/user/stores/useUserStore";
import { openWhatsApp } from "@/utils/externalLinks";

const TermsAndConditions = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { setIsGuestOpen } = useUserStore();
  const styles = createStyles(colors, insets.bottom);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Terms & Conditions",
      headerBackTitle: "Back",
    });
    return navigation.addListener("beforeRemove", () => {
      setIsGuestOpen(true);
    });
  }, [navigation, setIsGuestOpen]);

  const clauses = [
    {
      title: "1. Eligibility & Store Account",
      body: "To order from MyMedDevices, you must be at least 18 years of age or ordering on behalf of a household, caregiver, clinic, or healthcare facility in Kenya.",
    },
    {
      title: "2. Genuine & Certified Products",
      body: "All medical devices, monitors, and health items in our store are 100% genuine and meet Pharmacy and Poisons Board (PPB) safety standards.",
    },
    {
      title: "3. Lipa na M-PESA Payments",
      body: "Payments are processed instantly and securely via Safaricom Lipa na M-PESA. You will receive an M-Pesa prompt directly on your phone to enter your PIN. Order status is updated immediately upon payment.",
    },
    {
      title: "4. Fast Countrywide Delivery",
      body: "Orders are packed and dispatched quickly. We offer same-day or next-day delivery in Nairobi, and reliable 24–48 hour delivery across all other 47 counties in Kenya.",
    },
    {
      title: "5. Warranty, Returns & Exchanges",
      body: "All equipment includes an official 1 to 3-year warranty. If your item arrives defective or damaged, you can request an easy exchange or return within 14 days of delivery. For hygiene reasons, opened sterile disposables cannot be returned.",
    },
    {
      title: "6. Customer Privacy & Support",
      body: "Your personal details and phone numbers are kept strictly private and used solely to fulfill your delivery. Our Nairobi customer care team is available to assist you anytime.",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.heroCard}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "18" }]}>
          <Icon name="receipt" size={28} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Terms & Shopping Conditions</Text>
        <Text style={styles.heroSubtitle}>
          Simple, clear terms governing your purchases, payments, and delivery across Kenya.
        </Text>
      </View>

      {/* Clauses */}
      {clauses.map((clause, idx) => (
        <View
          key={idx}
          style={[styles.clauseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.clauseTitle, { color: colors.text }]}>{clause.title}</Text>
          <Text style={[styles.clauseBody, { color: colors.textSecondary || colors.text }]}>
            {clause.body}
          </Text>
        </View>
      ))}

      {/* Contact & Support Card */}
      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Questions Regarding Your Order?</Text>
        <Text style={styles.supportBody}>
          Our customer service team is always happy to assist you with order inquiries, delivery questions, or product advice.
        </Text>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => openWhatsApp("Hello MyMedDevices, I have a question regarding shopping and delivery.")}
          activeOpacity={0.8}
        >
          <Icon name="whatsapp" size={16} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TermsAndConditions;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: SIZES.spacingMD,
      gap: 12,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 18,
      opacity: 0.8,
    },
    clauseCard: {
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      padding: 16,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    clauseTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    clauseBody: {
      fontSize: 12,
      lineHeight: 18,
      opacity: 0.8,
    },
    supportCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 6,
    },
    supportTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    supportBody: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 17,
      opacity: 0.75,
    },
    whatsappBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#25D366",
      paddingVertical: 11,
      borderRadius: SIZES.radius_medium,
      marginTop: 8,
    },
    whatsappBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
