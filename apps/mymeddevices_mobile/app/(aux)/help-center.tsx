import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { useTheme } from "@react-navigation/native";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { openSocialMedia, openWhatsApp } from "@/utils/externalLinks";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Ordering & Payment" | "Quality & Safety" | "Delivery & Tracking" | "Warranty & Returns";
}

const FAQS: FAQItem[] = [
  {
    id: "1",
    category: "Ordering & Payment",
    question: "How do I pay with M-Pesa?",
    answer:
      "When placing your order, enter your Safaricom M-Pesa phone number (e.g., 07XX XXX XXX). You will immediately see an M-Pesa PIN prompt on your phone screen. Enter your PIN to complete payment safely and instantly.",
  },
  {
    id: "2",
    category: "Quality & Safety",
    question: "Are all medical devices genuine and approved?",
    answer:
      "Yes, 100%. Every item in our store is genuine, safe, and certified under Kenya Pharmacy and Poisons Board (PPB) standards. We test and inspect all items before packaging.",
  },
  {
    id: "3",
    category: "Delivery & Tracking",
    question: "How fast is delivery to my home or town in Kenya?",
    answer:
      "For Nairobi and nearby areas, we deliver same-day or next-day directly to your doorstep. For other counties across Kenya (e.g. Mombasa, Kisumu, Nakuru, Eldoret), delivery takes 24 to 48 hours right to your town or doorstep.",
  },
  {
    id: "4",
    category: "Warranty & Returns",
    question: "What if my item arrives damaged or faulty?",
    answer:
      "All devices come with a 1 to 3-year official warranty. If an item arrives damaged, faulty, or does not work properly, you can request an easy exchange or return within 14 days of delivery.",
  },
];

const HelpCenter: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  const [expandedFaq, setExpandedFaq] = useState<string | null>("1");

  useEffect(() => {
    navigation.setOptions({
      title: "Help Center & FAQs",
      headerBackTitle: "Back",
    });
  }, [navigation]);

  const handleWhatsApp = async () => {
    await openWhatsApp("Hello MyMedDevices Customer Care 👋 I need assistance with an order or product.");
  };

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Customer Support Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIconBox, { backgroundColor: colors.primary + "16" }]}>
            <Icon name="headset" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Customer Support</Text>
            <Text style={styles.heroSubtitle}>Device Advice, Ordering Help & Delivery Updates</Text>
          </View>
        </View>

        <Text style={styles.heroDesc}>
          Have a question about which device to choose, how to use your equipment, or tracking your delivery? We are here to help.
        </Text>

        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Icon name="whatsapp" size={20} color="#FFFFFF" />
          <Text style={styles.whatsappText}>Chat With Us on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Frequently Asked Questions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      </View>

      <View style={styles.faqList}>
        {FAQS.map((faq) => {
          const isExpanded = expandedFaq === faq.id;

          return (
            <View
              key={faq.id}
              style={[
                styles.faqCard,
                { backgroundColor: colors.card, borderColor: isExpanded ? colors.primary : colors.border },
              ]}
            >
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqTitleWrap}>
                  <Text style={styles.faqCategoryBadge}>{faq.category}</Text>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                </View>
                <Icon
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={isExpanded ? colors.primary : colors.textSecondary || colors.text}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary || colors.text }]}>
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Social & Contact Channels */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Follow Our Channels</Text>
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity
          onPress={() => openSocialMedia("whatsapp")}
          style={[styles.socialPill, { backgroundColor: "#25D36614", borderColor: "#25D36640" }]}
          activeOpacity={0.7}
        >
          <Icon name="whatsapp" size={18} color="#25D366" />
          <Text style={[styles.socialLabel, { color: "#25D366" }]}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openSocialMedia("facebook")}
          style={[styles.socialPill, { backgroundColor: "#1877F214", borderColor: "#1877F240" }]}
          activeOpacity={0.7}
        >
          <Icon name="facebook" size={18} color="#1877F2" />
          <Text style={[styles.socialLabel, { color: "#1877F2" }]}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openSocialMedia("instagram")}
          style={[styles.socialPill, { backgroundColor: "#E1306C14", borderColor: "#E1306C40" }]}
          activeOpacity={0.7}
        >
          <Icon name="instagram" size={18} color="#E1306C" />
          <Text style={[styles.socialLabel, { color: "#E1306C" }]}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openSocialMedia("linkedin")}
          style={[styles.socialPill, { backgroundColor: "#0A66C214", borderColor: "#0A66C240" }]}
          activeOpacity={0.7}
        >
          <Icon name="linkedin" size={18} color="#0A66C2" />
          <Text style={[styles.socialLabel, { color: "#0A66C2" }]}>LinkedIn</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HelpCenter;

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
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SIZES.spacingMD,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    heroIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    heroTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    heroSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    heroDesc: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      lineHeight: 18,
      marginBottom: 14,
    },
    whatsappButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#25D366",
      borderRadius: SIZES.radius_medium,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    whatsappText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 13,
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
    faqList: {
      gap: 10,
    },
    faqCard: {
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    faqQuestionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      gap: 10,
    },
    faqTitleWrap: {
      flex: 1,
      gap: 4,
    },
    faqCategoryBadge: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    faqQuestion: {
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    faqAnswerContainer: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    faqAnswer: {
      fontSize: 12,
      lineHeight: 18,
    },
    socialRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    socialPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
    },
    socialLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
  });
