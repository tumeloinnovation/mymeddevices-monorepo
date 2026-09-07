import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { toast } from "sonner-native";
import Icon from "@/components/common/Icon";
import { CheckoutCustomer } from "@/types/checkout";

interface CustomerInfoSectionProps {
  customer: CheckoutCustomer;
  setCustomer: (customer: CheckoutCustomer) => void;
  onNext: () => void;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  customer,
  setCustomer,
  onNext,
}) => {
  const { colors, dark } = useTheme();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email || "");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleNext = () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim() });
    onNext();
  };

  return (
    <View style={styles.customerSection}>
      {/* Full Name */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Full Name / Facility Contact
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: dark ? colors.background : "#FFFFFF",
              borderColor: focusedField === "name" ? colors.primary : colors.border,
            },
          ]}
        >
          <Icon
            name="user"
            size={18}
            color={focusedField === "name" ? colors.primary : colors.textSecondary || "#94A3B8"}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={name}
            onChangeText={setName}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            placeholder="e.g. Dr. Jane Wanjiku"
            placeholderTextColor={colors.textSecondary || colors.text + "70"}
          />
        </View>
      </View>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Phone Number (for M-Pesa & Delivery Updates)
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: dark ? colors.background : "#FFFFFF",
              borderColor: focusedField === "phone" ? colors.primary : colors.border,
            },
          ]}
        >
          <Icon
            name="phone"
            size={18}
            color={focusedField === "phone" ? colors.primary : colors.textSecondary || "#94A3B8"}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
            placeholder="07XX XXX XXX"
            placeholderTextColor={colors.textSecondary || colors.text + "70"}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Email Address */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Email Address (for Order Receipt)
        </Text>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: dark ? colors.background : "#FFFFFF",
              borderColor: focusedField === "email" ? colors.primary : colors.border,
            },
          ]}
        >
          <Icon
            name="mail"
            size={18}
            color={focusedField === "email" ? colors.primary : colors.textSecondary || "#94A3B8"}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            placeholder="jane.w@example.com"
            placeholderTextColor={colors.textSecondary || colors.text + "70"}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextButtonText}>
          Continue to Review & Payment
        </Text>
        <Icon name="chevron-right" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  customerSection: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "500",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default CustomerInfoSection;
