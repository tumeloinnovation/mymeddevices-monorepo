import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import Icon, { IconName } from "@/components/common/Icon";
import CustomText from "@/components/common/CustomText";
import { ThemeContext } from "@/context/ThemeContext";
import { shareLink } from "@/utils/externalLinks";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import useDeliveryLocationStore from "@/stores/useDeliveryLocationStore";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";

interface AccountNavListProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

export const AccountNavList: React.FC<AccountNavListProps> = ({
  isAuthenticated,
  onSignOut,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { theme, changeTheme } = useContext(ThemeContext);
  const isDarkMode = theme === "dark";

  const { isUpdateAvailable, isChecking, isDownloading } = Updates.useUpdates();
  const updateStatusLabel = isDownloading
    ? "Installing update..."
    : isChecking
    ? "Checking..."
    : isUpdateAvailable
    ? "Update available"
    : "Up to date";

  const { isDeliveryOptionsOpen, openDeliveryOptions, closeDeliveryOptions } =
    useDeliveryLocationStore();

  const orderPipelineSteps = [
    {
      id: "retry",
      title: "To Pay",
      icon: "hand-coins" as IconName,
      route: "/order-history/retry",
    },
    {
      id: "processing",
      title: "Processing",
      icon: "package" as IconName,
      route: "/order-history/processing",
    },
    {
      id: "shipped",
      title: "En Route",
      icon: "truck" as IconName,
      route: "/order-history/shipped",
    },
    {
      id: "completed",
      title: "Delivered",
      icon: "shield-check" as IconName,
      route: "/order-history/completed",
    },
    {
      id: "cancelled",
      title: "Returns",
      icon: "repeat" as IconName,
      route: "/order-history/cancelled",
    },
  ];

  const quickServices = [
    {
      id: "addresses",
      title: "Delivery Addresses",
      subtitle: "Saved delivery places",
      icon: "map-pin" as IconName,
      color: "#2563EB",
      onPress: openDeliveryOptions,
    },
    {
      id: "tracking",
      title: "Track Orders",
      subtitle: "Live delivery status",
      icon: "truck" as IconName,
      color: "#059669",
      route: "/order-tracking",
    },
    {
      id: "help",
      title: "Help & FAQs",
      subtitle: "Advice & customer care",
      icon: "help" as IconName,
      color: "#D97706",
      route: "/(aux)/help-center",
    },
    {
      id: "compare",
      title: "Compare Devices",
      subtitle: "Side-by-side specs",
      icon: "arrow-left-right" as IconName,
      color: "#7C3AED",
      route: "/compare",
    },
  ];

  return (
    <View style={styles.container}>
      {/* 1. ORDER LIFECYCLE PIPELINE */}
      <View style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTitleWrapper}>
            <View style={[styles.miniIconBadge, { backgroundColor: colors.primary + "18" }]}>
              <Icon name="bag" size={16} color={colors.primary} />
            </View>
            <Text style={styles.cardHeaderTitle}>My Orders</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              isAuthenticated
                ? router.push("/order-history")
                : router.push("/guest-order-history")
            }
            style={styles.viewAllRow}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Icon name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.pipelineRow}>
          {orderPipelineSteps.map((step) => (
            <TouchableOpacity
              key={step.id}
              style={styles.pipelineItem}
              onPress={() => {
                if (isAuthenticated) {
                  router.push(step.route as any);
                } else {
                  router.push("/guest-order-history");
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.pipelineIconCircle}>
                <Icon name={step.icon} size={20} color={colors.primary} />
              </View>
              <Text style={styles.pipelineLabel} numberOfLines={1}>
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 2. SERVICES (2x2 Grid) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Services</Text>
      </View>
      <View style={styles.gridContainer}>
        {quickServices.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.gridTile}
            onPress={() => {
              if (service.onPress) {
                service.onPress();
              } else if (service.route) {
                router.push(service.route as any);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: service.color + "16" }]}>
              <Icon name={service.icon} size={18} color={service.color} />
            </View>
            <Text style={styles.gridTileTitle} numberOfLines={1}>
              {service.title}
            </Text>
            <Text style={styles.gridTileSubtitle} numberOfLines={2}>
              {service.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. ACCOUNT & PREFERENCES (Modern Inset Grouped Card) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account & Preferences</Text>
      </View>
      <View style={styles.groupedCard}>
        {isAuthenticated && (
          <>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push("/profile")}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIconContainer, { backgroundColor: "#3B82F618" }]}>
                <Icon name="user" size={18} color="#3B82F6" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Personal Profile</Text>
                <Text style={styles.rowSubtitle}>Account details & clinical role</Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
          </>
        )}

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/notifications-settings" as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#8B5CF618" }]}>
            <Icon name="bell-ring" size={18} color="#8B5CF6" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Notifications & Alerts</Text>
            <Text style={styles.rowSubtitle}>Order updates, price alerts</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        {isAuthenticated && (
          <>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => router.push("/profile/security")}
              activeOpacity={0.7}
            >
              <View style={[styles.rowIconContainer, { backgroundColor: "#10B98118" }]}>
                <Icon name="shield-check" size={18} color="#10B981" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Security & Passwords</Text>
                <Text style={styles.rowSubtitle}>Credentials & authentication</Text>
              </View>
              <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
            </TouchableOpacity>
            <View style={styles.rowDivider} />
          </>
        )}

        {/* Theme Switch Row */}
        <View style={styles.menuRow}>
          <View style={[styles.rowIconContainer, { backgroundColor: "#F59E0B18" }]}>
            <Icon name={isDarkMode ? "moon" : "sun"} size={18} color="#F59E0B" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Dark Mode</Text>
            <Text style={styles.rowSubtitle}>{isDarkMode ? "On (Dark theme)" : "Off (Light theme)"}</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={() => changeTheme(isDarkMode ? "light" : "dark")}
            thumbColor={colors.primary}
            trackColor={{ false: colors.border, true: colors.primary + "66" }}
          />
        </View>
        <View style={styles.rowDivider} />

        {/* Updates Row */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(aux)/check-updates")}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#06B6D418" }]}>
            <Icon name="smartphone" size={18} color="#06B6D4" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>App Updates</Text>
            <Text style={styles.rowSubtitle}>{updateStatusLabel}</Text>
          </View>
          {isUpdateAvailable && (
            <View style={styles.badgeNew}>
              <Text style={styles.badgeNewText}>NEW</Text>
            </View>
          )}
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
      </View>

      {/* 4. ABOUT & SUPPORT (Grouped Inset Card) */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>About & Support</Text>
      </View>
      <View style={styles.groupedCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(aux)/help-center")}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#EC489918" }]}>
            <Icon name="help" size={18} color="#EC4899" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Help Center & FAQs</Text>
            <Text style={styles.rowSubtitle}>Guides, returns & warranty</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(aux)/about-us")}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#6366F118" }]}>
            <Icon name="info" size={18} color="#6366F1" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>About MyMedDevices</Text>
            <Text style={styles.rowSubtitle}>Kenya's online medical store</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(aux)/privacy-policy")}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#14B8A618" }]}>
            <Icon name="shield-check" size={18} color="#14B8A6" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Privacy Policy & Terms</Text>
            <Text style={styles.rowSubtitle}>Regulatory & data compliance</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={shareLink}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#F9731618" }]}>
            <Icon name="share" size={18} color="#F97316" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Share App</Text>
            <Text style={styles.rowSubtitle}>Share with friends & family</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
        <View style={styles.rowDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push("/(aux)/connect-with-us")}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIconContainer, { backgroundColor: "#E11D4818" }]}>
            <Icon name="chat" size={18} color="#E11D48" />
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowTitle}>Connect With Us</Text>
            <Text style={styles.rowSubtitle}>Support hotline & social channels</Text>
          </View>
          <Icon name="chevron-right" size={16} color={colors.textSecondary || colors.text} />
        </TouchableOpacity>
      </View>

      {/* 5. SIGN OUT CTA */}
      {isAuthenticated && (
        <View style={styles.signOutWrapper}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={onSignOut}
            activeOpacity={0.7}
          >
            <Icon name="logout" size={18} color="#EF4444" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Branding & App Version */}
      <View style={styles.footerBranding}>
        <CustomText style={styles.appNameText}>
          {Application.applicationName || "MyMedDevices"}
        </CustomText>
        <CustomText style={styles.appVersionText}>
          v{Application.nativeApplicationVersion || "1.0.0"} • Kenya's Medical & Health Store
        </CustomText>
      </View>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        visible={isDeliveryOptionsOpen}
        onClose={closeDeliveryOptions}
      />
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: SIZES.spacingMD,
      paddingVertical: 10,
      paddingBottom: 40,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: 16,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardHeaderTitleWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    miniIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    cardHeaderTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    viewAllRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    viewAllText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    pipelineRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 14,
      paddingHorizontal: 2,
    },
    pipelineItem: {
      alignItems: "center",
      flex: 1,
    },
    pipelineIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + "12",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    pipelineLabel: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.text,
      textAlign: "center",
    },
    sectionHeader: {
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      opacity: 0.75,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    gridTile: {
      width: "48.5%",
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    gridIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    gridTileTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    gridTileSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      lineHeight: 15,
    },
    groupedCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_medium,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 13,
      paddingHorizontal: 14,
    },
    rowIconContainer: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    rowContent: {
      flex: 1,
      marginRight: 8,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    rowDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 60,
    },
    badgeNew: {
      backgroundColor: "#10B981",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 6,
    },
    badgeNewText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
    signOutWrapper: {
      marginTop: 4,
      marginBottom: 12,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#EF444414",
      borderRadius: SIZES.radius_medium,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: "#EF444430",
    },
    signOutButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#EF4444",
    },
    footerBranding: {
      paddingVertical: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    appNameText: {
      fontSize: 12,
      fontWeight: "600",
      opacity: 0.6,
    },
    appVersionText: {
      fontSize: 11,
      marginTop: 3,
      opacity: 0.4,
    },
  });

export default AccountNavList;

