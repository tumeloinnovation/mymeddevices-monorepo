import React, { useEffect } from "react";
import { StyleSheet, Text, ScrollView, View, TouchableOpacity, Linking } from "react-native";
import { useNavigation } from "expo-router";
import { useTheme } from "@react-navigation/native";

import Icon, { IconName } from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openSocialMedia, openWhatsApp } from "@/utils/externalLinks";

interface ChannelItem {
  id: string;
  name: string;
  subtitle: string;
  icon: IconName;
  color: string;
  action: () => void;
}

const ConnectWithUs = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Connect With Us",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  const directContacts: ChannelItem[] = [
    {
      id: "whatsapp",
      name: "WhatsApp Support",
      subtitle: "+254 735 239 696 • Quick help & advice",
      icon: "whatsapp",
      color: "#25D366",
      action: () => openWhatsApp("Hello MyMedDevices team 👋 I need help with a product or order."),
    },
    {
      id: "phone",
      name: "Customer Service Hotline",
      subtitle: "Call: +254 735 239 696 (Mon - Sat, 8am - 6pm)",
      icon: "phone",
      color: "#2563EB",
      action: () => Linking.openURL("tel:+254735239696"),
    },
    {
      id: "email",
      name: "Email Customer Support",
      subtitle: "support@mymeddevices.com",
      icon: "receipt",
      color: "#8B5CF6",
      action: () => Linking.openURL("mailto:support@mymeddevices.com"),
    },
  ];

  const socialChannels: ChannelItem[] = [
    {
      id: "facebook",
      name: "Facebook",
      subtitle: "Official announcements & health updates",
      icon: "facebook",
      color: "#1877F2",
      action: () => openSocialMedia("facebook"),
    },
    {
      id: "instagram",
      name: "Instagram",
      subtitle: "@mymedevices • Device spotlights & reels",
      icon: "instagram",
      color: "#E1306C",
      action: () => openSocialMedia("instagram"),
    },
    {
      id: "x",
      name: "X (Twitter)",
      subtitle: "@mymeddevicesltd • Industry & regulatory news",
      icon: "x-twitter",
      color: "#000000",
      action: () => openSocialMedia("x"),
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      subtitle: "Company updates & business inquiries",
      icon: "linkedin",
      color: "#0A66C2",
      action: () => openSocialMedia("linkedin"),
    },
    {
      id: "tiktok",
      name: "TikTok",
      subtitle: "Quick device tutorials & wellness tips",
      icon: "tiktok",
      color: "#EE1D52",
      action: () => openSocialMedia("tiktok"),
    },
    {
      id: "youtube",
      name: "YouTube",
      subtitle: "@mymeddevices • In-depth product unboxings",
      icon: "youtube",
      color: "#FF0000",
      action: () => openSocialMedia("youtube"),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.heroCard}>
        <View style={[styles.heroIconBox, { backgroundColor: colors.primary + "18" }]}>
          <Icon name="chat" size={28} color={colors.primary} />
        </View>
        <Text style={styles.heroTitle}>We're Here For You</Text>
        <Text style={styles.heroSubtitle}>
          Reach out directly to our Nairobi customer care and device support team.
        </Text>
      </View>

      {/* Direct Contact Channels */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Direct Help & Contacts</Text>
      </View>

      <View style={styles.cardGroup}>
        {directContacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={[styles.channelRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={contact.action}
            activeOpacity={0.7}
          >
            <View style={[styles.channelIconBox, { backgroundColor: contact.color + "16" }]}>
              <Icon name={contact.icon} size={20} color={contact.color} />
            </View>
            <View style={styles.channelContent}>
              <Text style={[styles.channelName, { color: colors.text }]}>{contact.name}</Text>
              <Text style={[styles.channelSubtitle, { color: colors.textSecondary || colors.text }]}>
                {contact.subtitle}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Social Communities */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Official Social Channels</Text>
      </View>

      <View style={styles.cardGroup}>
        {socialChannels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={[styles.channelRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={channel.action}
            activeOpacity={0.7}
          >
            <View style={[styles.channelIconBox, { backgroundColor: channel.color + "14" }]}>
              <Icon name={channel.icon} size={20} color={channel.color} />
            </View>
            <View style={styles.channelContent}>
              <Text style={[styles.channelName, { color: colors.text }]}>{channel.name}</Text>
              <Text style={[styles.channelSubtitle, { color: colors.textSecondary || colors.text }]}>
                {channel.subtitle}
              </Text>
            </View>
            <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default ConnectWithUs;

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
    heroIconBox: {
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
    sectionHeader: {
      paddingHorizontal: 4,
      paddingTop: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      opacity: 0.75,
    },
    cardGroup: {
      gap: 10,
    },
    channelRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      padding: 13,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    channelIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    channelContent: {
      flex: 1,
      gap: 2,
    },
    channelName: {
      fontSize: 14,
      fontWeight: "700",
    },
    channelSubtitle: {
      fontSize: 11,
      lineHeight: 15,
      opacity: 0.7,
    },
  });