import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import Skeleton from "@/components/common/Skeleton";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

export const AccountHeaderCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* Top Avatar & User Info Row */}
        <View style={styles.profileTopRow}>
          <Skeleton width={78} height={78} borderRadius={39} />
          <View style={styles.profileInfo}>
            <Skeleton width={90} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <Skeleton width={160} height={20} borderRadius={6} style={{ marginBottom: 8 }} />
            <Skeleton width={120} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Skeleton width={80} height={22} borderRadius={6} />
              <Skeleton width={75} height={22} borderRadius={6} />
            </View>
          </View>
        </View>

        {/* 4-Item Metric Counters */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Skeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
            <Skeleton width={32} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={40} height={10} borderRadius={4} />
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Skeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
            <Skeleton width={32} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={40} height={10} borderRadius={4} />
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Skeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
            <Skeleton width={32} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={40} height={10} borderRadius={4} />
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Skeleton width={20} height={20} borderRadius={10} style={{ marginBottom: 4 }} />
            <Skeleton width={32} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
            <Skeleton width={40} height={10} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const ProfileFormSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.profileFormContainer}>
      {/* Hero Card Skeleton */}
      <View style={styles.heroCard}>
        <View style={styles.heroAvatarRow}>
          <Skeleton width={98} height={98} borderRadius={49} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="80%" height={22} borderRadius={6} />
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Skeleton width={70} height={20} borderRadius={6} />
              <Skeleton width={90} height={20} borderRadius={6} />
            </View>
            <Skeleton width="60%" height={14} borderRadius={4} />
          </View>
        </View>
        <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Skeleton width={110} height={12} borderRadius={4} />
            <Skeleton width={30} height={12} borderRadius={4} />
          </View>
          <Skeleton width="100%" height={6} borderRadius={3} />
        </View>
      </View>

      {/* Details Section Skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Skeleton width={28} height={28} borderRadius={7} />
          <Skeleton width={120} height={16} borderRadius={4} />
        </View>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={70} height={12} borderRadius={4} />
            <Skeleton width="100%" height={44} borderRadius={8} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width={70} height={12} borderRadius={4} />
            <Skeleton width="100%" height={44} borderRadius={8} />
          </View>
        </View>
        <View style={{ gap: 6, marginBottom: 14 }}>
          <Skeleton width={100} height={12} borderRadius={4} />
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
        <View style={{ gap: 6 }}>
          <Skeleton width={110} height={12} borderRadius={4} />
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
      </View>

      {/* Facility Card Skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Skeleton width={28} height={28} borderRadius={7} />
          <Skeleton width={140} height={16} borderRadius={4} />
        </View>
        <View style={{ gap: 6 }}>
          <Skeleton width={130} height={12} borderRadius={4} />
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const OrderItemSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ gap: 6 }}>
          <Skeleton width={120} height={16} borderRadius={4} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Skeleton width={8} height={8} borderRadius={4} />
            <Skeleton width={60} height={12} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={90} height={18} borderRadius={4} />
      </View>
      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 }}>
        <Skeleton width={52} height={52} borderRadius={8} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="85%" height={14} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
        <Skeleton width={95} height={32} borderRadius={8} />
      </View>
    </View>
  );
};

export const OrderHistorySkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={{ padding: SIZES.paddingMD, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderItemSkeleton key={i} />
      ))}
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: SIZES.spacingMD,
      paddingTop: 8,
      paddingBottom: 4,
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 2,
    },
    profileTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    profileInfo: {
      flex: 1,
      justifyContent: "center",
    },
    metricsContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_medium || 12,
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    metricItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    metricDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    profileFormContainer: {
      paddingHorizontal: SIZES.spacingMD,
      paddingTop: 12,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      elevation: 2,
    },
    heroAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      elevation: 1,
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium || 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
    },
  });

export default AccountHeaderCardSkeleton;
