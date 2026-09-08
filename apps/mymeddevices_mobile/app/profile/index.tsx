import React, { useEffect, useState, useLayoutEffect, useMemo, useCallback } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { useTheme } from "@react-navigation/native";
import CustomText from "@/components/common/CustomText";
import ContainerView from "@/components/common/ContainerView";
import { useAuth } from "@/context/AuthContext";
import { SIZES } from "@/styles/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Colors } from "@/types/app";
import { customerApi } from "@/features/user/services/customer.api";
import { Customer } from "@/types/user";
import CustomButton from "@/components/common/CustomButton";
import Icon, { IconName } from "@/components/common/Icon";
import useDeliveryLocationStore from "@/stores/useDeliveryLocationStore";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";
import UserAvatar from "@/features/user/components/UserAvatar";
import { ProfileFormSkeleton } from "@/features/user/components/AccountSkeleton";

const ProfilePage = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.bottom);
  const navigation = useNavigation();

  const {
    isAuthenticated,
    user: authUser,
    customer: contextCustomer,
    logout,
    refreshUser,
  } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    phone: "",
    company: "",
    avatarUrl: "",
  });

  const { isDeliveryOptionsOpen, openDeliveryOptions, closeDeliveryOptions } =
    useDeliveryLocationStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "My Profile",
      headerBackTitle: "Account",
    });
  }, [navigation]);

  const cleanKenyanPhone = (raw?: string) => {
    if (!raw) return "";
    let clean = raw.replace(/\D/g, "");
    if (clean.startsWith("254")) {
      clean = clean.slice(3);
    } else if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    return clean.slice(0, 9);
  };

  const handlePhoneChange = (text: string) => {
    let clean = text.replace(/\D/g, "");
    if (clean.startsWith("254")) {
      clean = clean.slice(3);
    } else if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }
    setForm((p) => ({ ...p, phone: clean.slice(0, 9) }));
  };

  const fetchCustomer = useCallback(async () => {
    if (authUser?.id) {
      setIsLoadingCustomer(true);
      setCustomerError(null);
      try {
        const customerData = await customerApi.getCustomer(authUser.id);
        setCustomer(customerData);
        setForm({
          firstName: customerData.first_name || "",
          lastName: customerData.last_name || "",
          displayName: authUser.display_name || "",
          phone: cleanKenyanPhone(customerData.billing?.phone || authUser.billing?.phone || authUser.phone),
          company: customerData.billing?.company || "",
          avatarUrl: customerData.avatar_url || authUser.avatar_url || "",
        });
      } catch (error: any) {
        console.error("Failed to fetch customer data:", error);
        setCustomerError("Could not sync latest customer profile from server. Showing cached details.");
        if (contextCustomer) {
          setCustomer(contextCustomer);
          setForm({
            firstName: contextCustomer.first_name || "",
            lastName: contextCustomer.last_name || "",
            displayName: authUser.display_name || "",
            phone: cleanKenyanPhone(contextCustomer.billing?.phone || authUser.billing?.phone || authUser.phone),
            company: contextCustomer.billing?.company || "",
            avatarUrl: contextCustomer.avatar_url || authUser.avatar_url || "",
          });
        } else {
          setForm({
            firstName: authUser.first_name || "",
            lastName: authUser.last_name || "",
            displayName: authUser.display_name || "",
            phone: cleanKenyanPhone(authUser.billing?.phone || authUser.phone),
            company: "",
            avatarUrl: authUser.avatar_url || "",
          });
        }
      } finally {
        setIsLoadingCustomer(false);
      }
    }
  }, [authUser, contextCustomer]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleAvatarSelected = async (uri: string) => {
    setForm((prev) => ({ ...prev, avatarUrl: uri }));
    if (!authUser?.id) return;

    setIsUploadingAvatar(true);
    try {
      const updatedCustomer = await customerApi.updateCustomer(authUser.id, {
        avatar_url: uri,
      });
      setCustomer(updatedCustomer);
      await refreshUser();
      toast.success("Profile photo updated");
    } catch (err) {
      console.error("Failed to update avatar:", err);
      toast.error("Failed to save profile photo");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const isDirty = useMemo(() => {
    const origFirst = customer?.first_name || authUser?.first_name || "";
    const origLast = customer?.last_name || authUser?.last_name || "";
    const origDisplay = authUser?.display_name || "";
    const origPhone = cleanKenyanPhone(customer?.billing?.phone || authUser?.billing?.phone || authUser?.phone || "");
    const origCompany = customer?.billing?.company || "";

    return (
      form.firstName.trim() !== origFirst.trim() ||
      form.lastName.trim() !== origLast.trim() ||
      form.displayName.trim() !== origDisplay.trim() ||
      form.phone.trim() !== origPhone.trim() ||
      form.company.trim() !== origCompany.trim()
    );
  }, [form, customer, authUser]);

  const profileCompletion = useMemo(() => {
    let score = 0;
    if (form.firstName.trim()) score += 20;
    if (form.lastName.trim()) score += 20;
    if (form.phone.trim()) score += 20;
    if (customer?.billing?.address_1) score += 20;
    if (form.company.trim() || form.avatarUrl) score += 20;
    return Math.min(score, 100);
  }, [form, customer]);

  const handleSave = async () => {
    if (!authUser?.id) return;
    if (!isDirty) {
      toast.info("No changes to save");
      return;
    }

    const cleanDigits = form.phone.trim();
    const formattedPhone = cleanDigits ? `+254${cleanDigits}` : "";

    setIsSaving(true);
    try {
      const updatedCustomer = await customerApi.updateCustomer(authUser.id, {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        display_name: form.displayName.trim(),
        billing: {
          ...customer?.billing,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: formattedPhone,
          company: form.company.trim(),
        },
        shipping: {
          ...customer?.shipping,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone: formattedPhone,
          company: form.company.trim(),
        },
      });

      setCustomer(updatedCustomer);
      await refreshUser();
      toast.success("Profile saved successfully");
    } catch (error: any) {
      console.error("Profile save error:", error);
      toast.error("Unable to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of MyMedDevices?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            toast.success("Signed out successfully");
            router.replace("/(shop)/account");
          } catch (error) {
            toast.error("Failed to sign out");
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <ContainerView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.emptyContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyIconCircle}>
            <Icon name="user-round" size={40} color={colors.primary} />
          </View>
          <CustomText variant="h2" style={styles.emptyTitle}>
            Sign in to Your Account
          </CustomText>
          <CustomText style={styles.emptySubtitle}>
            Sign in to view your orders, track deliveries, and manage your delivery addresses.
          </CustomText>
          <View style={styles.authActions}>
            <CustomButton
              title="Sign In"
              onPress={() => router.push("/(auth)/login")}
              style={styles.buttonSpacing}
            />
            <CustomButton
              title="Create Account"
              onPress={() => router.push("/(auth)/register")}
              type="secondary"
              style={styles.buttonSpacing}
            />
          </View>
        </ScrollView>
      </ContainerView>
    );
  }

  const fullName =
    `${form.firstName} ${form.lastName}`.trim() ||
    authUser?.display_name ||
    authUser?.username ||
    "Customer";

  const email = customer?.email || authUser?.email || "";
  const roleLabel = "CUSTOMER";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO PROFILE CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarRow}>
            <UserAvatar
              uri={form.avatarUrl}
              name={fullName}
              size="xl"
              showEditBadge
              isLoading={isUploadingAvatar}
              onImageSelected={handleAvatarSelected}
            />
            <View style={styles.heroTextInfo}>
              <View style={styles.heroNameRow}>
                <CustomText variant="h2" style={styles.heroName} numberOfLines={1}>
                  {fullName}
                </CustomText>
              </View>

              <View style={styles.heroBadgeRow}>
                <View style={styles.verifiedRoleBadge}>
                  <Icon name="badge-check" size={12} color={colors.primary} />
                  <CustomText style={styles.verifiedRoleText}>{roleLabel}</CustomText>
                </View>
                <View style={styles.tierBadge}>
                  <Icon name="award" size={12} color="#D97706" />
                  <CustomText style={styles.tierBadgeText}>
                    {customer?.loyalty_tier || "Valued Customer"}
                  </CustomText>
                </View>
              </View>

              <CustomText style={styles.heroEmail} numberOfLines={1}>
                {email}
              </CustomText>
            </View>
          </View>

          {/* Profile Completion Meter */}
          <View style={styles.meterContainer}>
            <View style={styles.meterHeader}>
              <CustomText style={styles.meterTitle}>Profile Completion</CustomText>
              <CustomText style={styles.meterPercentage}>{profileCompletion}%</CustomText>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${profileCompletion}%` }]} />
            </View>
          </View>
        </View>

        {customerError && (
          <View style={[styles.errorBanner, { backgroundColor: "#F59E0B14", borderColor: "#F59E0B40" }]}>
            <Icon name="alert" size={18} color="#D97706" />
            <CustomText style={styles.errorBannerText}>{customerError}</CustomText>
            <TouchableOpacity onPress={fetchCustomer} style={styles.errorRetryButton}>
              <CustomText style={styles.errorRetryText}>Retry</CustomText>
            </TouchableOpacity>
          </View>
        )}

        {isLoadingCustomer && !customer && !authUser ? (
          <ProfileFormSkeleton />
        ) : (
          <>
            {/* 2. PERSONAL INFORMATION */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#3B82F618" }]}>
                  <Icon name="user" size={16} color="#3B82F6" />
                </View>
                <CustomText style={styles.sectionTitle}>Personal Details</CustomText>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputFlex}>
                  <FormInput
                    label="First Name"
                    value={form.firstName}
                    placeholder="e.g. Sarah"
                    onChangeText={(val) => setForm((p) => ({ ...p, firstName: val }))}
                  />
                </View>
                <View style={styles.inputFlex}>
                  <FormInput
                    label="Last Name"
                    value={form.lastName}
                    placeholder="e.g. Ochieng"
                    onChangeText={(val) => setForm((p) => ({ ...p, lastName: val }))}
                  />
                </View>
              </View>

              <FormInput
                label="Full Name / Display Name"
                value={form.displayName}
                placeholder="e.g. Sarah Ochieng"
                onChangeText={(val) => setForm((p) => ({ ...p, displayName: val }))}
                helper="Name used on your order receipts and delivery notes."
              />

              <FormInput
                label="Registered Email"
                value={email}
                editable={false}
                rightIcon="shield-check"
                helper="Contact customer care if you need to update your email."
              />
            </View>

            {/* 3. HEALTHCARE FACILITY / PRACTICE (OPTIONAL) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#10B98118" }]}>
                  <Icon name="building" size={16} color="#10B981" />
                </View>
                <CustomText style={styles.sectionTitle}>Clinic or Business (Optional)</CustomText>
              </View>

              <FormInput
                label="Clinic / Practice / Office Name"
                value={form.company}
                placeholder="e.g. Sunshine Clinic (Leave blank if personal)"
                onChangeText={(val) => setForm((p) => ({ ...p, company: val }))}
                helper="Add your clinic or business name here if buying for an institution."
              />
            </View>

            {/* 4. CONTACT & MOBILE PAYMENTS */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#F59E0B18" }]}>
                  <Icon name="phone" size={16} color="#F59E0B" />
                </View>
                <CustomText style={styles.sectionTitle}>Contact & M-Pesa</CustomText>
              </View>

              <View style={styles.phoneInputContainer}>
                <View style={styles.phoneLabelRow}>
                  <CustomText style={styles.inputLabel}>Primary Phone Number</CustomText>
                  <CustomText style={styles.phoneLabelBadge}>Required for STK</CustomText>
                </View>
                <View
                  style={[
                    styles.phoneInputWrapper,
                    isPhoneFocused && styles.phoneInputWrapperFocused,
                  ]}
                >
                  <View style={styles.prefixPill}>
                    <CustomText style={styles.flagEmoji}>🇰🇪</CustomText>
                    <CustomText style={styles.prefixText}>+254</CustomText>
                  </View>
                  <TextInput
                    value={form.phone}
                    placeholder="7XX XXX XXX"
                    placeholderTextColor={colors.textSecondary || colors.text + "60"}
                    keyboardType="phone-pad"
                    maxLength={9}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    onChangeText={handlePhoneChange}
                    style={styles.phoneTextInput}
                  />
                  {form.phone.trim().length === 9 && (
                    <View style={styles.phoneValidBadge}>
                      <Icon name="check" size={12} color="#10B981" />
                    </View>
                  )}
                </View>
                <CustomText style={styles.phoneHelperText}>
                  M-Pesa PIN prompt and delivery tracking SMS will be sent to this number.
                </CustomText>
              </View>
            </View>

            {/* 5. DELIVERY & ADDRESSES */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#8B5CF618" }]}>
                  <Icon name="map-pin" size={16} color="#8B5CF6" />
                </View>
                <CustomText style={styles.sectionTitle}>Delivery Destination</CustomText>
              </View>

              {customer?.billing?.address_1 ? (
                <View style={styles.addressBox}>
                  <View style={styles.addressHeaderRow}>
                    <CustomText style={styles.addressTag}>Default Delivery Address</CustomText>
                  </View>
                  <CustomText style={styles.addressLineBold}>
                    {customer.billing.address_1}
                    {customer.billing.address_2 ? `, ${customer.billing.address_2}` : ""}
                  </CustomText>
                  <CustomText style={styles.addressLineSub}>
                    {customer.billing.city}, {customer.billing.state || "Nairobi"} {customer.billing.postcode}
                  </CustomText>
                  <CustomText style={styles.addressLineSub}>
                    {customer.billing.country === "KE" ? "Kenya" : customer.billing.country}
                  </CustomText>
                </View>
              ) : (
                <View style={styles.emptyAddressBox}>
                  <CustomText style={styles.emptyAddressText}>
                    No default delivery location configured yet.
                  </CustomText>
                </View>
              )}

              <TouchableOpacity
                style={styles.manageAddressButton}
                onPress={openDeliveryOptions}
                activeOpacity={0.7}
              >
                <Icon name="map-pin" size={16} color={colors.primary} />
                <CustomText style={styles.manageAddressText}>Manage Delivery Addresses</CustomText>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* 6. SECURITY & PREFERENCES */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBadge, { backgroundColor: "#EC489918" }]}>
                  <Icon name="shield-check" size={16} color="#EC4899" />
                </View>
                <CustomText style={styles.sectionTitle}>Security & Password</CustomText>
              </View>

              <TouchableOpacity
                style={styles.securityOptionRow}
                onPress={() => router.push("/profile/security")}
                activeOpacity={0.7}
              >
                <View style={styles.securityOptionTextWrap}>
                  <CustomText style={styles.securityOptionTitle}>Password & Security</CustomText>
                  <CustomText style={styles.securityOptionSub}>
                    Change your password or manage login credentials
                  </CustomText>
                </View>
                <Icon name="chevron-right" size={18} color={colors.textSecondary || colors.text} />
              </TouchableOpacity>
            </View>

            {/* 7. SAVE BUTTON */}
            <View style={styles.saveSection}>
              <CustomButton
                title={isSaving ? "Saving Changes..." : "Save Changes"}
                onPress={handleSave}
                disabled={!isDirty || isSaving}
                style={styles.saveButton}
              />
            </View>

            {/* 8. SIGN OUT */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Icon name="logout" size={16} color="#EF4444" />
              <CustomText style={styles.signOutText}>Sign Out of MyMedDevices</CustomText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        visible={isDeliveryOptionsOpen}
        onClose={closeDeliveryOptions}
      />
    </KeyboardAvoidingView>
  );
};

interface FormInputProps extends TextInputProps {
  label: string;
  helper?: string;
  rightIcon?: IconName;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  helper,
  rightIcon,
  editable = true,
  ...props
}) => {
  const { colors } = useTheme();
  const inputStyles = createInputStyles(colors);

  return (
    <View style={inputStyles.container}>
      <CustomText style={inputStyles.label}>{label}</CustomText>
      <View
        style={[
          inputStyles.inputWrapper,
          !editable && inputStyles.disabledWrapper,
        ]}
      >
        <TextInput
          {...props}
          editable={editable}
          placeholderTextColor={colors.text + "60"}
          style={[inputStyles.input, !editable && inputStyles.disabledInput]}
        />
        {rightIcon && (
          <View style={inputStyles.rightIconContainer}>
            <Icon name={rightIcon} size={16} color="#10B981" />
          </View>
        )}
      </View>
      {helper && <CustomText style={inputStyles.helperText}>{helper}</CustomText>}
    </View>
  );
};

const createInputStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      marginBottom: 14,
    },
    label: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_small || 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
    },
    disabledWrapper: {
      backgroundColor: colors.border + "20",
      borderColor: colors.border + "60",
    },
    input: {
      flex: 1,
      paddingVertical: Platform.OS === "ios" ? 12 : 9,
      fontSize: 14,
      color: colors.text,
    },
    disabledInput: {
      color: colors.text + "90",
    },
    rightIconContainer: {
      marginLeft: 8,
    },
    helperText: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 4,
      lineHeight: 15,
    },
  });

const createStyles = (colors: Colors, bottomInset: number) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: SIZES.spacingMD,
      paddingTop: 12,
      paddingBottom: Math.max(bottomInset, 16) + 24,
    },
    heroCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    heroAvatarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    heroTextInfo: {
      flex: 1,
    },
    heroNameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    heroName: {
      fontSize: 19,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.3,
    },
    heroBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 6,
    },
    verifiedRoleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "14",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    verifiedRoleText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.5,
    },
    tierBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "#D9770614",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    tierBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#D97706",
    },
    heroEmail: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
    },
    meterContainer: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    meterHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    meterTitle: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary || colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    meterPercentage: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    meterTrack: {
      height: 6,
      backgroundColor: colors.border + "50",
      borderRadius: 3,
      overflow: "hidden",
    },
    meterFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 3,
    },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: SIZES.radius_large || 16,
      padding: SIZES.spacingMD,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
    inputRow: {
      flexDirection: "row",
      gap: 10,
    },
    inputFlex: {
      flex: 1,
    },
    addressBox: {
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_small || 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    addressHeaderRow: {
      marginBottom: 4,
    },
    addressTag: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    addressLineBold: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 18,
    },
    addressLineSub: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.8,
      lineHeight: 17,
      marginTop: 2,
    },
    emptyAddressBox: {
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_small || 8,
      padding: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      alignItems: "center",
      marginBottom: 12,
    },
    emptyAddressText: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      textAlign: "center",
    },
    manageAddressButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.primary + "10",
      borderRadius: SIZES.radius_small || 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    manageAddressText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 8,
    },
    securityOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 6,
    },
    securityOptionTextWrap: {
      flex: 1,
      marginRight: 10,
    },
    securityOptionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    securityOptionSub: {
      fontSize: 12,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    vendorNoticeBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#D9770614",
      padding: 12,
      borderRadius: SIZES.radius_medium || 12,
      borderWidth: 1,
      borderColor: "#D9770630",
      marginBottom: 14,
    },
    vendorNoticeText: {
      flex: 1,
      fontSize: 12,
      color: "#D97706",
      lineHeight: 17,
    },
    saveSection: {
      marginTop: 8,
      marginBottom: 14,
    },
    saveButton: {
      width: "100%",
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#EF444412",
      borderRadius: SIZES.radius_medium || 12,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor: "#EF444430",
      marginTop: 4,
    },
    signOutText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#EF4444",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: SIZES.radius_medium || 12,
      borderWidth: 1,
      marginBottom: 14,
    },
    errorBannerText: {
      flex: 1,
      fontSize: 12,
      color: "#D97706",
      lineHeight: 16,
      fontWeight: "500",
    },
    errorRetryButton: {
      backgroundColor: "#D97706",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    errorRetryText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    loadingContainer: {
      padding: SIZES.paddingXL,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
    },
    loadingText: {
      color: colors.textSecondary || colors.text,
      marginTop: 10,
      fontSize: 13,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: SIZES.paddingXL,
      paddingVertical: SIZES.paddingXL * 2,
    },
    emptyIconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyTitle: {
      marginBottom: 8,
      textAlign: "center",
      fontWeight: "700",
    },
    emptySubtitle: {
      textAlign: "center",
      color: colors.textSecondary || colors.text,
      opacity: 0.75,
      marginBottom: 24,
      fontSize: 13,
      lineHeight: 19,
      paddingHorizontal: 8,
    },
    authActions: {
      gap: 12,
      width: "100%",
    },
    buttonSpacing: {
      width: "100%",
    },
    phoneInputContainer: {
      marginBottom: 14,
    },
    phoneLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    phoneLabelBadge: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
    },
    phoneInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: SIZES.radius_small || 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      height: Platform.OS === "ios" ? 44 : 42,
      gap: 8,
    },
    phoneInputWrapperFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "06",
    },
    prefixPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 8,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
    },
    flagEmoji: {
      fontSize: 14,
    },
    prefixText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    phoneTextInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      letterSpacing: 0.5,
      fontWeight: "600",
      paddingVertical: 0,
    },
    phoneValidBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#10B98118",
      alignItems: "center",
      justifyContent: "center",
    },
    phoneHelperText: {
      fontSize: 11,
      color: colors.textSecondary || colors.text,
      opacity: 0.7,
      marginTop: 4,
      lineHeight: 15,
    },
  });

export default ProfilePage;
