import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { toast } from "sonner-native";
import Icon from "@/components/common/Icon";
import { AuthUser } from "@/types/auth";
import { Customer } from "@/types/user";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useAuth } from "@/context/AuthContext";
import { customerApi } from "@/features/user/services/customer.api";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";
import { useCartStore } from "@/features/cart/stores/useCartStore";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import UserAvatar from "./UserAvatar";
import { AccountHeaderCardSkeleton } from "./AccountSkeleton";

interface AccountHeaderCardProps {
  user: AuthUser | null;
  customer?: Customer | null;
  isAuthenticated: boolean;
  isLoading?: boolean;
  isInitialized?: boolean;
}

export const AccountHeaderCard: React.FC<AccountHeaderCardProps> = ({
  user,
  customer,
  isAuthenticated,
  isLoading = false,
  isInitialized = true,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { refreshUser } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const wishlistCount = useWishlistStore((s) => s.wishlist_list.length);
  const cartCount = useCartStore((s) => s.cart_items);
  const compareCount = useCompareStore((s) => s.compare_list.length);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (!isInitialized || (isLoading && !user)) {
    return <AccountHeaderCardSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestCard}>
          <View style={styles.guestAvatar}>
            <Icon name="user-round" size={32} color={colors.primary} />
          </View>
          <View style={styles.guestContent}>
            <Text style={styles.guestTitle}>Welcome to MyMedDevices</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to track orders, save favorite health devices, and enjoy easy Lipa na M-Pesa checkout.
            </Text>
            <View style={styles.guestActionRow}>
              <TouchableOpacity
                style={styles.signInPrimaryButton}
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.8}
              >
                <Icon name="login" size={16} color="#FFFFFF" />
                <Text style={styles.signInPrimaryText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const fullName =
    customer?.first_name || customer?.last_name
      ? `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim()
      : user.display_name ||
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username ||
        "Healthcare Buyer";

  const email = customer?.email || user.email || "";
  const phone = customer?.billing?.phone || user.billing?.phone || "";
  const company = customer?.billing?.company || "";
  const roleLabel = (user.roles?.[0] || "Verified Buyer").toUpperCase();
  const avatarUrl = customer?.avatar_url || user.avatar_url;
  const loyaltyPoints = customer?.loyalty_points ?? 120;

  const handleAvatarSelected = async (uri: string) => {
    if (!user?.id) return;
    setIsUploadingAvatar(true);
    try {
      await customerApi.updateCustomer(user.id, { avatar_url: uri });
      await refreshUser();
      toast.success("Profile photo updated");
    } catch (err) {
      console.error("Failed to update avatar from account card:", err);
      toast.error("Failed to update profile photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Profile Header Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <UserAvatar
            uri={avatarUrl}
            name={fullName}
            size="lg"
            showEditBadge={isAuthenticated}
            onImageSelected={handleAvatarSelected}
            isLoading={isUploadingAvatar}
            showVerifiedBadge={!isAuthenticated}
          />

          <View style={styles.profileInfo}>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
            </View>

            <Text style={styles.userName} numberOfLines={1}>
              {fullName}
            </Text>

            {Boolean(company) ? (
              <View style={styles.facilityRow}>
                <Icon name="building" size={12} color={colors.primary} />
                <Text style={styles.facilityText} numberOfLines={1}>
                  {company}
                </Text>
              </View>
            ) : (
              <Text style={styles.userEmail} numberOfLines={1}>
                {email || phone}
              </Text>
            )}

            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Icon name="badge-check" size={11} color={colors.primary} />
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>

              <TouchableOpacity
                style={styles.editProfilePill}
                onPress={() => router.push("/profile")}
                activeOpacity={0.7}
              >
                <Icon name="pencil" size={11} color={colors.primary} />
                <Text style={styles.editProfilePillText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stat & Counter Bar */}
        <View style={styles.metricsContainer}>
          <TouchableOpacity
            style={styles.metricItem}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <View style={styles.metricIconWrap}>
              <Icon name="award" size={14} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{loyaltyPoints}</Text>
            <Text style={styles.metricLabel}>Points</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricItem}
            onPress={() => router.push("/wishlist")}
            activeOpacity={0.7}
          >
            <View style={styles.metricIconWrap}>
              <Icon name="heart" size={14} color="#E11D48" />
            </View>
            <Text style={styles.metricValue}>{wishlistCount}</Text>
            <Text style={styles.metricLabel}>Wishlist</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricItem}
            onPress={() => router.push("/(shop)/cart")}
            activeOpacity={0.7}
          >
            <View style={styles.metricIconWrap}>
              <Icon name="cart" size={14} color={colors.primary} />
            </View>
            <Text style={styles.metricValue}>{cartCount}</Text>
            <Text style={styles.metricLabel}>Cart</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricItem}
            onPress={() => router.push("/compare")}
            activeOpacity={0.7}
          >
            <View style={styles.metricIconWrap}>
              <Icon name="arrow-left-right" size={14} color="#7C3AED" />
            </View>
            <Text style={styles.metricValue}>{compareCount}</Text>
            <Text style={styles.metricLabel}>Compare</Text>
          </TouchableOpacity>
        </View>
      </View>
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
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
    greetingRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    greetingText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
    },
    userName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    facilityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 6,
    },
    facilityText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "600",
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginBottom: 6,
    },
    badgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    roleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    roleBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    editProfilePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.border + "40",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    editProfilePillText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
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
    metricIconWrap: {
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: "500",
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginTop: 1,
    },
    metricDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },
    guestCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingLG,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    guestAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    guestContent: {
      alignItems: "center",
      width: "100%",
    },
    guestTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      textAlign: "center",
    },
    guestSubtitle: {
      fontSize: 13,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    guestActionRow: {
      width: "100%",
    },
    signInPrimaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 13,
      borderRadius: SIZES.radius_medium || 10,
    },
    signInPrimaryText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });

export default AccountHeaderCard;
