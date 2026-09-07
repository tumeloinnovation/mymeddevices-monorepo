import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@react-navigation/native";

import Icon from "@/components/common/Icon";
import { Category } from "@/types/category";
import { Colors } from "@/types/app";
import { getCategoryImageUrl, getCategorySubtitle } from "../../utils/categoryMeta";

interface ChildCategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

export const ChildCategoryCard: React.FC<ChildCategoryCardProps> = ({
  category,
  onPress,
}) => {
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const imageUrl = getCategoryImageUrl(category);
  const subtitle = getCategorySubtitle(category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(category)}
      activeOpacity={0.82}
    >
      {/* Image Thumbnail Header */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder={require("@/assets/images/placeholder.png")}
          transition={200}
          cachePolicy="memory-disk"
        />

        {/* Count or Certified Badge */}
        {category.count !== undefined && category.count > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{category.count} items</Text>
          </View>
        ) : (
          <View style={styles.certBadge}>
            <Icon name="shield-check" size={10} color="#FFFFFF" />
            <Text style={styles.certBadgeText}>Verified</Text>
          </View>
        )}
      </View>

      {/* Content Details */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {category.name}
        </Text>

        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        {/* Footer Action */}
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>Explore</Text>
          <View style={styles.actionIconCircle}>
            <Icon name="chevron-right" size={10} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ChildCategoryCard;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    card: {
      flex: 1,
      minWidth: 125,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    imageContainer: {
      position: "relative",
      width: "100%",
      height: 95,
      backgroundColor: dark ? colors.background : "#F1F5F9",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    countBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      backgroundColor: "rgba(15, 23, 42, 0.75)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    countBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "600",
    },
    certBadge: {
      position: "absolute",
      top: 6,
      left: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(2, 132, 199, 0.88)",
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 6,
    },
    certBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "700",
    },
    content: {
      padding: 8,
      flex: 1,
      justifyContent: "space-between",
      gap: 4,
    },
    title: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 16,
    },
    subtitle: {
      fontSize: 10,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      lineHeight: 13,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    actionText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
    },
    actionIconCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
  });
