import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";

import Icon, { IconName } from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openWhatsApp } from "@/utils/externalLinks";

const VALUE_PROPS: { title: string; desc: string; icon: IconName; color: string }[] = [
  {
    title: "100% Genuine & Certified",
    desc: "All health devices and supplies meet Kenya PPB quality and safety standards.",
    icon: "shield-check",
    color: "#10B981",
  },
  {
    title: "Fair & Affordable Prices",
    desc: "Quality healthcare devices at the best direct prices for families and clinics.",
    icon: "hand-coins",
    color: "#3B82F6",
  },
  {
    title: "Fast Countrywide Delivery",
    desc: "Doorstep delivery across Nairobi and all 47 counties in Kenya within 24 to 48 hours.",
    icon: "truck",
    color: "#8B5CF6",
  },
  {
    title: "Dedicated Customer Care",
    desc: "Device guidance, user manuals, and warranty support whenever you need help.",
    icon: "stethoscope",
    color: "#F59E0B",
  },
];

const AboutUs = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "About MyMedDevices",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Brand Hero Card */}
      <View style={styles.heroCard}>
        <View style={[styles.brandLogoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.brandLogo}
            contentFit="contain"
          />
        </View>
        <Text style={styles.brandTitle}>MyMedDevices</Text>
        <Text style={styles.brandTagline}>
          Kenya's Trusted Online Medical & Health Store
        </Text>
        <Text style={styles.brandMission}>
          Delivering genuine home health monitors, medical equipment, and daily care essentials straight to your home or clinic across Kenya.
        </Text>
      </View>

      {/* Value Pillars Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Why Shop With Us</Text>
      </View>

      <View style={styles.valuesList}>
        {VALUE_PROPS.map((item, idx) => (
          <View
            key={idx}
            style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.valueIconBox, { backgroundColor: item.color + "14" }]}>
              <Icon name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.valueContent}>
              <Text style={[styles.valueTitle, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.valueDesc, { color: colors.textSecondary || colors.text }]}>
                {item.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Regulatory & Safety Commitment */}
      <View style={styles.regulatoryCard}>
        <View style={styles.regulatoryHeader}>
          <Icon name="badge-check" size={20} color="#10B981" />
          <Text style={styles.regulatoryTitle}>Quality & Safety Guaranteed</Text>
        </View>
        <Text style={styles.regulatoryText}>
          All health monitors, diagnostic tools, and care supplies on MyMedDevices are thoroughly inspected, certified, and approved for safe home and clinic use.
        </Text>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(aux)/help-center")}
          activeOpacity={0.8}
        >
          <Icon name="help" size={16} color="#FFFFFF" />
          <Text style={styles.contactBtnText}>Help & FAQs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => openWhatsApp("Hello, I need help finding a medical device on MyMedDevices.")}
          activeOpacity={0.8}
        >
          <Icon name="whatsapp" size={16} color="#FFFFFF" />
          <Text style={styles.whatsappBtnText}>Chat on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AboutUs;

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
      padding: 24,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    brandLogoBox: {
      width: 76,
      height: 76,
      borderRadius: 20,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    brandLogo: {
      width: 64,
      height: 64,
    },
    brandTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 4,
    },
    brandTagline: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      textAlign: "center",
      marginBottom: 10,
    },
    brandMission: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 19,
      opacity: 0.8,
    },
    sectionHeader: {
      paddingHorizontal: 4,
      paddingTop: 6,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      opacity: 0.75,
    },
    valuesList: {
      gap: 10,
    },
    valueCard: {
      flexDirection: "row",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      padding: 14,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    valueIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    valueContent: {
      flex: 1,
      gap: 3,
    },
    valueTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    valueDesc: {
      fontSize: 12,
      lineHeight: 17,
      opacity: 0.75,
    },
    regulatoryCard: {
      backgroundColor: "#10B98110",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: "#10B98130",
      padding: 16,
    },
    regulatoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    regulatoryTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    regulatoryText: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 18,
      opacity: 0.8,
    },
    ctaRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    contactBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
    },
    contactBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
    whatsappBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#25D366",
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
    },
    whatsappBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
