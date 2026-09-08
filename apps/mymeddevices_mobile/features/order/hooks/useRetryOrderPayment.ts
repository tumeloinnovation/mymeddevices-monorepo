import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { toast } from "sonner-native";
import { useQueryClient } from "@tanstack/react-query";
import { initiateMpesaPayment } from "@/services/order.service";
import { Order } from "@/types/order";

export const useRetryOrderPayment = (order: Order) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const queryClient = useQueryClient();

  const retryWithPaymentMethod = useCallback(
    async (paymentMethod: "cod" | "mpesa") => {
      setIsRetrying(true);

      try {
        if (paymentMethod === "mpesa") {
          toast.info("Initiating M-Pesa payment...", {
            description: "Follow the prompt on your phone to complete the payment.",
          });

          const phone = order.billing?.phone || order.shipping?.phone || "";

          if (!phone) {
            toast.error("Phone number not found", {
              description: "Please update your contact information before retrying.",
            });
            setIsRetrying(false);
            return;
          }

          const mpesaRes = await initiateMpesaPayment(order.id, phone);

          if (mpesaRes.success) {
            toast.success("STK Push sent", {
              description: "Enter your M-Pesa PIN to complete payment.",
            });
          } else {
            toast.warning("Payment initiated", {
              description: "The M-Pesa prompt may still arrive shortly.",
            });
          }
        } else {
          toast.success("Order confirmed", {
            description: "Your order is scheduled for Cash on Delivery.",
          });
        }

        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      } catch (error: any) {
        console.error("Retry payment error:", error);
        toast.error("Failed to retry payment", {
          description: error?.message || "Please try again.",
        });
      } finally {
        setIsRetrying(false);
      }
    },
    [order, queryClient]
  );

  const handleRetryPayment = useCallback(() => {
    Alert.alert(
      "Retry Payment",
      "Choose your payment method",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Cash on Delivery",
          onPress: () => retryWithPaymentMethod("cod"),
        },
        {
          text: "M-Pesa",
          onPress: () => retryWithPaymentMethod("mpesa"),
        },
      ],
      { cancelable: true }
    );
  }, [retryWithPaymentMethod]);

  const canRetryPayment = ["failed", "cancelled", "pending", "on-hold"].includes(
    order.status
  );

  return {
    isRetrying,
    canRetryPayment,
    handleRetryPayment,
  };
};
