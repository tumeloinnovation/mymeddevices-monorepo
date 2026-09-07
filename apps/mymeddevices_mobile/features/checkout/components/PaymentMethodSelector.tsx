import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  defaultPhone?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  phone,
  onPhoneChange,
  defaultPhone,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const isMpesa = selectedMethod === "mpesa";
  const isCod = selectedMethod === "cod";

  const handleSelect = (method: string) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectMethod(method);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>Payment Method</Text>
        <View style={styles.securityBadge}>
          <Icon name="shield-check" size={12} color="#10B981" />
          <Text style={styles.securityBadgeText}>Encrypted & Verified</Text>
        </View>
      </View>

      {/* M-Pesa Option */}
      <TouchableOpacity
        style={[styles.optionCard, isMpesa && styles.optionCardActive]}
        onPress={() => handleSelect("mpesa")}
        activeOpacity={0.8}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIconBox, { backgroundColor: "rgba(16, 185, 129, 0.12)" }]}>
            <Icon name="smartphone" size={17} color="#10B981" />
          </View>
          <View style={styles.optionTextCol}>
            <View style={styles.optionTitleRow}>
              <Text style={styles.optionTitle}>M-Pesa STK Push</Text>
              <View style={styles.instantBadge}>
                <Text style={styles.instantBadgeText}>Instant</Text>
              </View>
            </View>
            <Text style={styles.optionDesc}>
              Automated PIN prompt directly to your phone
            </Text>
          </View>
          <View style={[styles.radioCircle, isMpesa && styles.radioCircleActive]}>
            {isMpesa && <View style={styles.radioDot} />}
          </View>
        </View>

        {/* Dynamic M-Pesa Phone Input / Preview */}
        {isMpesa && (
          <View style={styles.mpesaDetailsBox}>
            <View style={styles.mpesaDetailsHeader}>
              <Text style={styles.mpesaDetailsLabel}>M-Pesa STK Prompt Number</Text>
              {defaultPhone && defaultPhone !== phone && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onPhoneChange(defaultPhone);
                    setIsEditingPhone(false);
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.resetPhoneText}>Use Account Phone</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingPhone ? (
              <View style={styles.phoneInputRow}>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={onPhoneChange}
                  keyboardType="phone-pad"
                  placeholder="e.g. 0712345678"
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.savePhoneBtn}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsEditingPhone(false);
                  }}
                >
                  <Icon name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.savePhoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.phonePreviewRow}>
                <View style={styles.phoneBadge}>
                  <Icon name="phone" size={13} color="#10B981" />
                  <Text style={styles.phoneNumberText}>{phone || "Add M-Pesa phone number"}</Text>
                </View>
                <TouchableOpacity
                  style={styles.changePhoneBtn}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setIsEditingPhone(true);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="pencil" size={12} color={colors.primary} />
                  <Text style={styles.changePhoneBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.mpesaNotice}>
              <Icon name="info" size={12} color="#059669" />
              <Text style={styles.mpesaNoticeText}>
                Keep your phone unlocked. You will enter your 4-digit M-Pesa PIN.
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Cash on Delivery Option */}
      <TouchableOpacity
        style={[styles.optionCard, isCod && styles.optionCardActive]}
        onPress={() => handleSelect("cod")}
        activeOpacity={0.8}
      >
        <View style={styles.optionHeader}>
          <View style={[styles.optionIconBox, { backgroundColor: colors.primary + "14" }]}>
            <Icon name="package" size={17} color={colors.primary} />
          </View>
          <View style={styles.optionTextCol}>
            <Text style={styles.optionTitle}>Pay on Delivery</Text>
            <Text style={styles.optionDesc}>
              Pay via M-Pesa or Cash when your order is delivered to your doorstep
            </Text>
          </View>
          <View style={[styles.radioCircle, isCod && styles.radioCircleActive]}>
            {isCod && <View style={styles.radioDot} />}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
    securityBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: dark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
      paddingVertical: 2,
      paddingHorizontal: 7,
      borderRadius: 5,
    },
    securityBadgeText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#10B981",
    },
    optionCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      padding: 10,
      gap: 8,
    },
    optionCardActive: {
      borderColor: colors.primary,
      backgroundColor: dark ? "rgba(255, 111, 97, 0.05)" : "#FFF7F6",
    },
    optionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    optionIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    optionTextCol: {
      flex: 1,
      gap: 1,
    },
    optionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    optionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    instantBadge: {
      backgroundColor: "rgba(16, 185, 129, 0.14)",
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    instantBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#10B981",
    },
    optionDesc: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      lineHeight: 14,
    },
    radioCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: dark ? "#475569" : "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
    },
    radioCircleActive: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    mpesaDetailsBox: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      padding: 8,
      gap: 6,
      marginTop: 2,
    },
    mpesaDetailsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    mpesaDetailsLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    resetPhoneText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.primary,
    },
    phonePreviewRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    phoneBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    phoneNumberText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    changePhoneBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    changePhoneBtnText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
    },
    phoneInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    phoneInput: {
      flex: 1,
      height: 36,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      paddingHorizontal: 10,
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    savePhoneBtn: {
      backgroundColor: colors.primary,
      height: 36,
      paddingHorizontal: 10,
      borderRadius: 7,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    savePhoneBtnText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    mpesaNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: dark ? "rgba(16, 185, 129, 0.08)" : "#F0FDF4",
      padding: 6,
      borderRadius: 5,
    },
    mpesaNoticeText: {
      fontSize: 10,
      color: dark ? "#34D399" : "#059669",
      flex: 1,
      lineHeight: 13,
    },
  });

export default PaymentMethodSelector;
