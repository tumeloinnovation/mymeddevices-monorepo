import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

export type InfoFeeType = "vat" | "packaging" | "service" | "shipping";

interface CostBreakdownSheetProps {
  visible: boolean;
  type: InfoFeeType | null;
  onClose: () => void;
  shippingRegion?: string;
}

interface FeeDetails {
  title: string;
  subtitle: string;
  icon: any;
  amountDesc: string;
  legalBasis: string;
  bulletPoints: string[];
}

const DETAILS_MAP: Record<InfoFeeType, FeeDetails> = {
  vat: {
    title: "16% Value Added Tax (VAT)",
    subtitle: "Standard Kenya Revenue Authority (KRA) Tax",
    icon: "receipt",
    amountDesc: "Standard 16% on taxable items",
    legalBasis: "Official KRA Tax Compliance",
    bulletPoints: [
      "Applied in accordance with Kenyan tax laws on medical and health equipment.",
      "A complete tax receipt (ETR) is generated with your order confirmation.",
      "Clear, transparent pricing with no hidden charges.",
    ],
  },
  packaging: {
    title: "Safe & Protective Packaging",
    subtitle: "KES 100 per order",
    icon: "package",
    amountDesc: "Fixed KES 100.00",
    legalBasis: "Quality & Hygiene Protection Standard",
    bulletPoints: [
      "Carefully wrapped and sealed in sterile, tamper-proof packaging.",
      "Cushioned protection for electronic and delicate medical devices.",
      "Keeps your items clean, intact, and safe throughout delivery.",
    ],
  },
  service: {
    title: "Order Handling & Safety Check",
    subtitle: "KES 50 per order",
    icon: "shield-check",
    amountDesc: "Fixed KES 50.00",
    legalBasis: "PPB Certified Quality Inspection",
    bulletPoints: [
      "Pre-dispatch device inspection and quality check.",
      "Ensures all products are 100% genuine, approved, and ready to use.",
      "Covers dedicated customer support and warranty assistance.",
    ],
  },
  shipping: {
    title: "Doorstep Delivery Fee",
    subtitle: "Fast Delivery Across Kenya",
    icon: "truck",
    amountDesc: "Calculated based on your county/town",
    legalBasis: "Reliable Countrywide Delivery",
    bulletPoints: [
      "Calculated automatically based on your selected delivery county.",
      "Nairobi & environs: Same-day or next-day delivery to your door.",
      "All other counties: Safe delivery within 24 to 48 hours.",
    ],
  },
};

export const CostBreakdownSheet: React.FC<CostBreakdownSheetProps> = ({
  visible,
  type,
  onClose,
  shippingRegion,
}) => {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  if (!visible || !type) return null;

  const info = DETAILS_MAP[type];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheetContainer}>
          {/* Header handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Title & Icon Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconBox}>
              <Icon name={info.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.title}>{info.title}</Text>
              <Text style={styles.subtitle}>
                {type === "shipping" && shippingRegion
                  ? `Destination: ${shippingRegion}`
                  : info.subtitle}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="x" size={16} color={colors.textSecondary || "#94A3B8"} />
            </TouchableOpacity>
          </View>

          {/* Legal / Framework Badge */}
          <View style={styles.legalBadge}>
            <Icon name="shield-check" size={13} color="#10B981" />
            <Text style={styles.legalText}>{info.legalBasis}</Text>
          </View>

          {/* Detailed Bullet Points */}
          <View style={styles.bulletList}>
            {info.bulletPoints.map((point, index) => (
              <View key={index} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.dismissBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CostBreakdownSheet;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    backdrop: {
      flex: 1,
    },
    sheetContainer: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingTop: 8,
      paddingHorizontal: 16,
      paddingBottom: Math.max(bottomInset, 16) + 8,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 12,
    },
    handleContainer: {
      alignItems: "center",
      paddingBottom: 4,
    },
    handle: {
      width: 34,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: dark ? "#334155" : "#CBD5E1",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 9,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
    },
    titleCol: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
    },
    closeBtn: {
      padding: 4,
    },
    legalBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: dark ? "rgba(16, 185, 129, 0.08)" : "#ECFDF5",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: dark ? "#065F46" : "#A7F3D0",
    },
    legalText: {
      fontSize: 11,
      color: dark ? "#34D399" : "#065F46",
      fontWeight: "600",
      flex: 1,
    },
    bulletList: {
      gap: 8,
      paddingVertical: 2,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    bulletText: {
      fontSize: 12,
      color: colors.text,
      lineHeight: 17,
      flex: 1,
    },
    dismissBtn: {
      backgroundColor: colors.primary,
      height: 40,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    dismissBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
