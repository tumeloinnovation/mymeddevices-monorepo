import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { Order } from "@/types/order";
import { Colors } from "@/types/app";
import { SIZES } from "@/styles/sizes";
import { orderApi } from "@/features/order/services/order.api";

interface RetryPaymentModalProps {
  order: Order | null;
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RetryPaymentModal: React.FC<RetryPaymentModalProps> = ({
  order,
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "cod">("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaitingPrompt, setIsWaitingPrompt] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Initialize phone number when order changes
  useEffect(() => {
    if (order) {
      const existingPhone =
        order.shipping?.phone || order.billing?.phone || "";
      setPhoneNumber(existingPhone);
    }
  }, [order]);

  // Countdown timer when waiting for M-Pesa PIN
  useEffect(() => {
    let interval: any;
    if (isWaitingPrompt && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsWaitingPrompt(false);
    }
    return () => clearInterval(interval);
  }, [isWaitingPrompt, countdown]);

  if (!order) return null;

  const totalAmount = parseFloat(order.total || "0");

  const handlePay = async () => {
    setIsProcessing(true);

    try {
      if (paymentMethod === "mpesa") {
        if (!phoneNumber.trim()) {
          toast.error("Please enter a valid M-Pesa phone number");
          setIsProcessing(false);
          return;
        }

        toast.info("Sending M-Pesa STK Push...", {
          description: `Prompting ${phoneNumber} for KES ${totalAmount.toLocaleString()}`,
        });

        await orderApi.initiatePayment({
          order: order.id,
          phone: phoneNumber.trim(),
          amount: totalAmount,
        });

        setIsWaitingPrompt(true);
        setCountdown(60);

        toast.success("STK Push sent!", {
          description: "Please enter your M-Pesa PIN on your phone to complete payment.",
        });

        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        // Cash on Delivery option
        toast.success("Payment method updated to Cash on Delivery", {
          description: "You will pay when your order is delivered.",
        });
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error("Payment initiation failed", {
        description: err?.message || "Please check your network and phone number.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = async () => {
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    setIsWaitingPrompt(false);
    onClose();
    onSuccess?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pay for Order</Text>
              <Text style={styles.headerSubtitle}>
                Order #{order.id} • KES {totalAmount.toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {isWaitingPrompt ? (
              /* Waiting for STK Prompt State */
              <View style={styles.waitingContainer}>
                <View style={styles.spinnerCircle}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>

                <Text style={styles.waitingTitle}>Check Your Phone</Text>
                <Text style={styles.waitingDesc}>
                  An M-Pesa prompt has been sent to{" "}
                  <Text style={{ fontWeight: "700", color: colors.text }}>
                    {phoneNumber}
                  </Text>
                  . Enter your M-Pesa PIN to complete payment of{" "}
                  <Text style={{ fontWeight: "700", color: colors.primary }}>
                    KES {totalAmount.toLocaleString()}
                  </Text>
                  .
                </Text>

                <View style={styles.countdownPill}>
                  <Icon name="clock" size={14} color={colors.textSecondary || colors.text} />
                  <Text style={styles.countdownText}>
                    Prompt active for {countdown}s
                  </Text>
                </View>

                <View style={styles.waitingButtons}>
                  <TouchableOpacity
                    style={styles.confirmDoneBtn}
                    onPress={handleDone}
                    activeOpacity={0.85}
                  >
                    <Icon name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.confirmDoneBtnText}>I Have Entered PIN</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handlePay}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.resendBtnText}>Resend STK Push</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Payment Selection State */
              <>
                {/* Method Selector */}
                <Text style={styles.sectionLabel}>Select Payment Option</Text>

                <View style={styles.methodsRow}>
                  {/* M-Pesa */}
                  <TouchableOpacity
                    style={[
                      styles.methodCard,
                      paymentMethod === "mpesa" && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + "10",
                      },
                    ]}
                    onPress={() => setPaymentMethod("mpesa")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.methodHeader}>
                      <View style={[styles.methodIcon, { backgroundColor: "#10B98115" }]}>
                        <Icon name="smartphone" size={18} color="#10B981" />
                      </View>
                      <View
                        style={[
                          styles.radioDot,
                          paymentMethod === "mpesa" && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.methodTitle}>M-Pesa Express</Text>
                    <Text style={styles.methodDesc}>Instant STK PIN Prompt</Text>
                  </TouchableOpacity>

                  {/* Cash on Delivery */}
                  <TouchableOpacity
                    style={[
                      styles.methodCard,
                      paymentMethod === "cod" && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primary + "10",
                      },
                    ]}
                    onPress={() => setPaymentMethod("cod")}
                    activeOpacity={0.8}
                  >
                    <View style={styles.methodHeader}>
                      <View style={[styles.methodIcon, { backgroundColor: "#3B82F615" }]}>
                        <Icon name="hand-coins" size={18} color="#3B82F6" />
                      </View>
                      <View
                        style={[
                          styles.radioDot,
                          paymentMethod === "cod" && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.methodTitle}>Pay on Delivery</Text>
                    <Text style={styles.methodDesc}>Cash upon Handover</Text>
                  </TouchableOpacity>
                </View>

                {/* M-Pesa Phone Input */}
                {paymentMethod === "mpesa" && (
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>M-Pesa Registered Number</Text>
                    <View style={styles.inputBox}>
                      <Icon name="phone" size={16} color={colors.textSecondary || colors.text} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. 0712345678 or 254712345678"
                        placeholderTextColor={colors.textDisabled}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <Text style={styles.inputHint}>
                      Enter the Safaricom line that should receive the STK PIN popup.
                    </Text>
                  </View>
                )}

                {/* Amount Summary */}
                <View style={styles.amountCard}>
                  <View>
                    <Text style={styles.amountLabel}>Total Payable</Text>
                    <Text style={styles.amountValue}>KES {totalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.securityPill}>
                    <Icon name="shield-check" size={14} color="#10B981" />
                    <Text style={styles.securityText}>Secure Checkout</Text>
                  </View>
                </View>

                {/* Pay Action Button */}
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handlePay}
                  disabled={isProcessing}
                  activeOpacity={0.85}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon
                        name={paymentMethod === "mpesa" ? "smartphone" : "check"}
                        size={16}
                        color="#FFFFFF"
                      />
                      <Text style={styles.payBtnText}>
                        {paymentMethod === "mpesa"
                          ? `Pay KES ${totalAmount.toLocaleString()} via M-Pesa`
                          : "Confirm Pay on Delivery"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default RetryPaymentModal;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SIZES.spacingLG,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    body: {
      padding: SIZES.spacingLG,
      gap: 16,
      paddingBottom: 36,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    methodsRow: {
      flexDirection: "row",
      gap: 12,
    },
    methodCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 14,
      gap: 6,
    },
    methodHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    methodIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    radioDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
    },
    methodTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    methodDesc: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
    },
    inputSection: {
      gap: 6,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 46,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      paddingVertical: 0,
    },
    inputHint: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.65,
    },
    amountCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },
    amountLabel: {
      fontSize: 11,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginTop: 2,
    },
    securityPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "#10B98115",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    securityText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#10B981",
    },
    payBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: SIZES.radius_medium,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    payBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    waitingContainer: {
      alignItems: "center",
      paddingVertical: 10,
      gap: 12,
    },
    spinnerCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    waitingTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
    },
    waitingDesc: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      textAlign: "center",
      lineHeight: 19,
      paddingHorizontal: 16,
    },
    countdownPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.card,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 4,
    },
    countdownText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
    },
    waitingButtons: {
      width: "100%",
      gap: 10,
      marginTop: 8,
    },
    confirmDoneBtn: {
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium,
    },
    confirmDoneBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
    resendBtn: {
      alignItems: "center",
      paddingVertical: 8,
    },
    resendBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
  });
