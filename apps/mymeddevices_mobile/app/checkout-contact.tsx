import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { useCheckoutStore } from "@/features/checkout/stores/useCheckoutStore";
import { useAuth } from "@/context/AuthContext";

export const CheckoutContactScreen = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const { customer, setCustomer } = useCheckoutStore();
  const { isAuthenticated, user: authUser, customer: authCustomer } = useAuth();

  const [name, setName] = useState(customer.name || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(customer.email || "");

  const [focusedField, setFocusedField] = useState<"name" | "phone" | "email" | null>(null);

  const phoneInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Recipient & Contact",
      headerBackTitle: "Checkout",
    });
  }, [navigation]);

  // Clean and parse initial phone number
  useEffect(() => {
    const raw = customer.phone || "";
    if (raw) {
      const clean = raw.replace(/^(\+?254|0)/, "").replace(/\D/g, "");
      setPhone(clean);
    }
  }, [customer.phone]);

  // Automatic autofill if logged in and fields are empty
  useEffect(() => {
    if (isAuthenticated) {
      if (!name) {
        const autoName =
          `${authCustomer?.first_name || authUser?.first_name || ""} ${authCustomer?.last_name || authUser?.last_name || ""}`.trim() ||
          authUser?.display_name ||
          "";
        if (autoName) setName(autoName);
      }

      if (!phone) {
        const rawPhone =
          authCustomer?.billing?.phone ||
          authCustomer?.shipping?.phone ||
          authUser?.phone ||
          "";
        if (rawPhone) {
          const cleanPhone = rawPhone.replace(/^(\+?254|0)/, "").replace(/\D/g, "");
          setPhone(cleanPhone);
        }
      }

      if (!email) {
        const autoEmail = authCustomer?.email || authUser?.email || "";
        if (autoEmail) setEmail(autoEmail);
      }
    }
  }, [isAuthenticated, authCustomer, authUser]);

  // Validation states
  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = phone.trim().length >= 9 && phone.trim().length <= 10;
  const isEmailValid = !email.trim() || (email.includes("@") && email.includes("."));
  const canSave = isNameValid && isPhoneValid && isEmailValid;

  const handlePhoneChange = (text: string) => {
    // Strip non-digits and handle user typing 07... or 254...
    let clean = text.replace(/\D/g, "");
    if (clean.startsWith("254")) {
      clean = clean.slice(3);
    } else if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    setPhone(clean.slice(0, 9));
  };

  const handleSave = () => {
    if (!isNameValid) {
      toast.error("Please enter recipient name");
      return;
    }
    if (!isPhoneValid) {
      toast.error("Please enter a valid 9-digit Kenyan phone number");
      return;
    }
    if (!isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }

    const formattedKenyanPhone = `+254${phone.trim()}`;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCustomer({
      name: name.trim(),
      phone: formattedKenyanPhone,
      email: email.trim() || undefined,
    });

    toast.success("Contact details updated");
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 20}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Input Card */}
          <View style={styles.card}>
            {/* 1. Recipient Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Recipient / Facility Contact</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "name" && styles.inputWrapperFocused,
                ]}
              >
                <Icon name="user" size={15} color={focusedField === "name" ? colors.primary : colors.textSecondary || "#94A3B8"} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Sarah Wanjiku (or Sunshine Clinic)"
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                />
                {isNameValid && (
                  <View style={styles.checkCircle}>
                    <Icon name="check" size={11} color="#10B981" />
                  </View>
                )}
              </View>
            </View>

            {/* 2. Kenyan M-Pesa Phone with +254 Prefix Pill */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>M-Pesa Mobile Number</Text>
                <Text style={styles.labelBadge}>Required for STK</Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "phone" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.prefixPill}>
                  <Text style={styles.flagEmoji}>🇰🇪</Text>
                  <Text style={styles.prefixText}>+254</Text>
                </View>

                <TextInput
                  ref={phoneInputRef}
                  style={[styles.input, styles.phoneInput]}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="7XX XXX XXX"
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  keyboardType="phone-pad"
                  maxLength={9}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                />

                {isPhoneValid && (
                  <View style={styles.checkCircle}>
                    <Icon name="check" size={11} color="#10B981" />
                  </View>
                )}
              </View>
              <Text style={styles.helperText}>
                M-Pesa PIN prompt and delivery tracking SMS will be sent to this number.
              </Text>
            </View>

            {/* 3. Email Address (for Receipt & Warranty) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email Address</Text>
                <Text style={styles.optionalBadge}>Receipt & Warranty</Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                ]}
              >
                <Icon name="mail" size={15} color={focusedField === "email" ? colors.primary : colors.textSecondary || "#94A3B8"} />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. sarah.wanjiku@gmail.com"
                  placeholderTextColor={colors.textSecondary || "#94A3B8"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
                {email.trim().length > 0 && isEmailValid && (
                  <View style={styles.checkCircle}>
                    <Icon name="check" size={11} color="#10B981" />
                  </View>
                )}
              </View>
            </View>

            {/* Trust & Data Privacy Seal */}
            <View style={styles.privacyRow}>
              <Icon name="shield-check" size={12} color="#10B981" />
              <Text style={styles.privacyText}>
                Contact details are strictly protected under Kenya Data Protection Act.
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Docked Action Button */}
      <View style={styles.dockedBar}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.88}
        >
          <Text style={styles.saveButtonText}>
            {canSave ? "Confirm Contact Details" : "Enter Name & Phone"}
          </Text>
          <Icon name="check" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CheckoutContactScreen;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
    },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: Math.max(bottomInset, 16) + 80,
    },
    card: {
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      gap: 12,
    },
    inputGroup: {
      gap: 5,
    },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    label: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    labelBadge: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.primary,
    },
    optionalBadge: {
      fontSize: 9,
      fontWeight: "600",
      color: colors.textSecondary || "#94A3B8",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingHorizontal: 10,
      height: 40,
      gap: 8,
    },
    inputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: dark ? "rgba(255, 111, 97, 0.04)" : "#FFF7F6",
    },
    prefixPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 6,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: dark ? "#334155" : "#CBD5E1",
    },
    flagEmoji: {
      fontSize: 14,
    },
    prefixText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 13,
      height: "100%",
      paddingVertical: 0,
    },
    phoneInput: {
      letterSpacing: 0.5,
      fontWeight: "600",
    },
    checkCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    helperText: {
      fontSize: 10,
      color: colors.textSecondary || "#64748B",
      lineHeight: 14,
      marginTop: 1,
    },
    privacyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: dark ? "rgba(16, 185, 129, 0.08)" : "#F0FDF4",
      padding: 8,
      borderRadius: 6,
      marginTop: 2,
    },
    privacyText: {
      fontSize: 10,
      color: dark ? "#34D399" : "#059669",
      flex: 1,
      lineHeight: 13,
    },
    dockedBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderTopWidth: 1,
      borderTopColor: dark ? "#334155" : "#E2E8F0",
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: Math.max(bottomInset, 10),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 6,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      height: 42,
      borderRadius: 10,
      gap: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    saveButtonDisabled: {
      opacity: 0.45,
      backgroundColor: dark ? "#334155" : "#CBD5E1",
      shadowOpacity: 0,
    },
    saveButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
