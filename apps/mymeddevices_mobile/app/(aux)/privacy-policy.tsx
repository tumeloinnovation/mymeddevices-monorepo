import React, { useEffect } from "react";
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useNavigation, router } from "expo-router";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWhatsApp } from "@/utils/externalLinks";

const PrivacyPolicyPage = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Privacy & Data Protection",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={styles.heroCard}>
        <View style={[styles.iconBox, { backgroundColor: "#10B98118" }]}>
          <Icon name="shield-check" size={28} color="#10B981" />
        </View>
        <Text style={styles.heroTitle}>Data Protection & Privacy Policy</Text>
        <Text style={styles.heroSubtitle}>
          Compliant with the Kenya Data Protection Act (Cap 411C) and healthcare patient privacy standards.
        </Text>
      </View>

      {/* Principles Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>1. Core Data Principles</Text>
        <Text style={styles.paragraph}>
          We collect and process your personal and delivery details strictly under the following safeguards:
        </Text>
        <View style={styles.bulletList}>
          {[
            "Lawful, fair, and transparent data processing.",
            "Used solely for order processing, payment verification, and delivery.",
            "Minimal data collection limited to fulfilling your order.",
            "Strict non-disclosure to unauthorized third parties.",
            "Secure, encrypted payment processing via Safaricom M-Pesa.",
          ].map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Scope Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          To process your orders, deliveries, and warranty coverage, we collect:
        </Text>
        <View style={styles.bulletList}>
          {[
            "Contact details: Full name, phone number, and email address.",
            "Delivery address: Estate, building, landmark, and County across Kenya.",
            "Payment reference: M-Pesa transaction codes (we never store PINs).",
          ].map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rights Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>3. Your Data Subject Rights</Text>
        <Text style={styles.paragraph}>
          Under Kenyan Law, you retain full rights to request access to your data, demand correction of inaccurate records, or request deletion of your account.
        </Text>
      </View>

      {/* Contact & Inquiries */}
      <View style={styles.contactCard}>
        <View style={styles.contactHeader}>
          <Icon name="phone" size={18} color="#2563EB" />
          <Text style={styles.contactTitle}>Data Protection Officer Inquiries</Text>
        </View>
        <Text style={styles.contactBody}>
          For data inquiries or consent withdrawal, contact our compliance desk at support@mymeddevices.com or chat directly with our team.
        </Text>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => openWhatsApp("Hello MyMedDevices, I have an inquiry regarding data privacy.")}
          activeOpacity={0.8}
        >
          <Icon name="whatsapp" size={16} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>Contact Data Protection Officer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default PrivacyPolicyPage;

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: SIZES.spacingMD,
      gap: 14,
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
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 2,
    },
    paragraph: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary || colors.text,
      opacity: 0.85,
    },
    bulletList: {
      gap: 8,
      marginTop: 4,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 6,
    },
    bulletText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary || colors.text,
      opacity: 0.85,
    },
    contactCard: {
      backgroundColor: "#2563EB10",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: "#2563EB30",
      padding: 16,
      gap: 8,
    },
    contactHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    contactTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    contactBody: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 17,
      opacity: 0.8,
    },
    whatsappBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#2563EB",
      paddingVertical: 11,
      borderRadius: SIZES.radius_medium,
      marginTop: 6,
    },
    whatsappBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
