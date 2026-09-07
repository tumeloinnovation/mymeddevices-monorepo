import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { LineItem } from "@/types/order";

interface OrderShipmentItemsPreviewProps {
  items: LineItem[];
  onViewAll: () => void;
}

export const OrderShipmentItemsPreview: React.FC<OrderShipmentItemsPreviewProps> = ({
  items,
  onViewAll,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.itemsCard}>
      <View style={styles.itemsCardHeader}>
        <Text style={styles.itemsTitle}>
          Shipment Items ({items.length})
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {items.map((item, idx) => (
        <View key={item.id || idx} style={styles.itemRow}>
          <Image
            source={item.image?.src || require("@/assets/images/placeholder.png")}
            style={styles.itemThumbnail}
            contentFit="cover"
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>
              Qty: {item.quantity} • KES {Number(item.price || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default React.memo(OrderShipmentItemsPreview);

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    itemsCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      gap: 10,
    },
    itemsCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemsTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    itemThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    itemMeta: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
    },
  });
