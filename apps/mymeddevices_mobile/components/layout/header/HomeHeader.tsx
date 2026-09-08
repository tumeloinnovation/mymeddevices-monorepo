import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Icon from "@/components/common/Icon";
import NotificationIcon from "@/components/common/NotificationIcon";
import AmazonSearchBar from "./AmazonSearchBar";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import useDeliveryLocationStore from "@/stores/useDeliveryLocationStore";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";

const HomeHeader = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentLocation, isDeliveryOptionsOpen, openDeliveryOptions, closeDeliveryOptions } =
    useDeliveryLocationStore();

  const styles = createStyles(colors, insets.top);

  const deliveryLabel = currentLocation?.state || currentLocation?.formattedAddress || "";

  return (
    <View style={styles.wrapper}>
      {/* Main Top Bar */}
      <View style={styles.topRow}>
        <View style={styles.searchWrapper}>
          <AmazonSearchBar placeholder="Search MyMedDevices..." />
        </View>

        {/* Location / Delivery Icon Button */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={openDeliveryOptions}
          accessibilityLabel="Delivery options"
          accessibilityRole="button"
        >
          <Icon name="location" size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Notification Icon Button */}
        <NotificationIcon />
      </View>

      {/* Delivery Location Sub-Strip */}
      <TouchableOpacity
        style={styles.deliveryStrip}
        onPress={openDeliveryOptions}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={deliveryLabel ? `Delivering to ${deliveryLabel}` : "Set delivery location"}
      >
        <Icon name="map-pin" size={14} color={colors.primary} />
        <Text style={styles.deliveryText} numberOfLines={1}>
          {deliveryLabel ? (
            <>
              Deliver to <Text style={styles.deliveryLocationBold}>{deliveryLabel}</Text>
            </>
          ) : (
            <Text style={styles.deliveryEmptyText}>Select delivery location</Text>
          )}
        </Text>
        <Icon name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 2 }} />
      </TouchableOpacity>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        visible={isDeliveryOptionsOpen}
        onClose={closeDeliveryOptions}
      />
    </View>
  );
};

export default HomeHeader;

const createStyles = (colors: Colors, topInset: number) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.card,
      paddingTop: topInset + 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 4,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SIZES.spacingMD,
      paddingBottom: 8,
      gap: 4,
    },
    searchWrapper: {
      flex: 1,
    },
    locationButton: {
      padding: 10,
    },
    deliveryStrip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 111, 97, 0.08)",
      paddingHorizontal: SIZES.spacingMD,
      paddingVertical: 7,
      gap: 6,
    },
    deliveryText: {
      fontSize: 12,
      color: colors.text,
      flex: 1,
    },
    deliveryLocationBold: {
      fontWeight: "700",
      color: colors.text,
    },
    deliveryEmptyText: {
      color: colors.textSecondary || "#64748B",
      fontWeight: "500",
    },
  });
