import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { toast } from "sonner-native";
import * as Location from "expo-location";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";

import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useAuth } from "@/context/AuthContext";
import deliveryFees from "@/utils/deliveryFees.json";
import useDeliveryLocationStore, {
  DeliveryLocation,
} from "@/stores/useDeliveryLocationStore";
import { parseGoogleAddress } from "@/utils/googlePlaces";
import { formatGeocodedAddress } from "@/utils/addressFormatter";

interface DeliveryOptionsModalProps {
  visible: boolean;
  onClose: () => void;
}

type ViewMode = "saved_list" | "add_address";

const DeliveryOptionsModal: React.FC<DeliveryOptionsModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false || netInfo.isInternetReachable === false;

  const { customer, isAuthenticated } = useAuth();
  const {
    currentLocation,
    savedAddresses,
    setDeliveryLocation,
    addSavedAddress,
    removeSavedAddress,
    clearDeliveryLocation,
    clearAllSavedAddresses,
  } = useDeliveryLocationStore();

  const [viewMode, setViewMode] = useState<ViewMode>("saved_list");
  const [isLocating, setIsLocating] = useState(false);
  const [countySearchQuery, setCountySearchQuery] = useState("");
  const [placesSearchText, setPlacesSearchText] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const styles = useMemo(
    () => createStyles(colors, insets.top, insets.bottom),
    [colors, insets.top, insets.bottom]
  );

  const normalizeRegion = (value: string) =>
    value.toLowerCase().replace(/\s*county$/i, "").trim();

  const matchDeliveryFee = useCallback((region: string): number => {
    const normalized = normalizeRegion(region);
    const match = (deliveryFees as DeliveryLocation[]).find(
      (item) => normalizeRegion(item.state) === normalized
    );
    return match?.price ?? 200;
  }, []);

  const handleClose = () => {
    setViewMode("saved_list");
    setCountySearchQuery("");
    setPlacesSearchText("");
    setIsSearchingPlaces(false);
    onClose();
  };

  const handleSelectLocation = (loc: DeliveryLocation) => {
    setDeliveryLocation(loc);
    toast.success(`Delivery location set to ${loc.state}`);
    handleClose();
  };

  const handlePlaceSelected = useCallback(
    (data: any, details: any = null) => {
      let parsed = details ? parseGoogleAddress(details, data) : null;
      const state =
        parsed?.city ||
        parsed?.state ||
        parsed?.region ||
        data?.structured_formatting?.secondary_text?.split(",")?.[0]?.trim() ||
        "Kenya";
      const fee = matchDeliveryFee(parsed?.region || state);
      const cleanAddress =
        parsed?.formattedAddress || data?.structured_formatting?.main_text || state;

      const newLoc: DeliveryLocation = {
        code: "CUSTOM",
        state,
        price: fee,
        formattedAddress: cleanAddress,
        label: data?.structured_formatting?.main_text || parsed?.city || state,
      };

      addSavedAddress(newLoc);
      setDeliveryLocation(newLoc);

      if (autocompleteRef.current) {
        autocompleteRef.current.setAddressText(cleanAddress);
        autocompleteRef.current.blur();
      }

      toast.success(`Delivery location set to ${state}`);
      handleClose();
    },
    [matchDeliveryFee, addSavedAddress, setDeliveryLocation]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission was denied");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      let formattedAddress = "Detected Location";
      let state = "Kenya";
      let price = 200;

      try {
        const reverseResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverseResults && reverseResults.length > 0) {
          const loc = reverseResults[0];
          const cleaned = formatGeocodedAddress(loc);
          formattedAddress = cleaned.formattedAddress;
          state = cleaned.region;
          price = cleaned.deliveryFee;
        }
      } catch {
        if (!isOffline && apiKey) {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
            );
            const json = await response.json();
            const result = json?.results?.[0];
            if (result) {
              formattedAddress = result.formatted_address || formattedAddress;
              const components = result.address_components || [];
              for (const comp of components) {
                const types: string[] = comp.types || [];
                if (
                  types.includes("administrative_area_level_2") ||
                  types.includes("locality") ||
                  types.includes("administrative_area_level_1")
                ) {
                  state = comp.long_name;
                  break;
                }
              }
              price = matchDeliveryFee(state);
            }
          } catch {
            // graceful fallback
          }
        }
      }

      const newLoc: DeliveryLocation = {
        code: "CURRENT",
        state,
        price,
        formattedAddress,
        label: state,
      };

      addSavedAddress(newLoc);
      setDeliveryLocation(newLoc);
      toast.success(`Delivery location set to ${state}`);
      handleClose();
    } catch {
      toast.error("Could not get your current location");
    } finally {
      setIsLocating(false);
    }
  }, [apiKey, isLocating, isOffline, matchDeliveryFee, addSavedAddress, setDeliveryLocation]);

  const handleManageAddressInProfile = () => {
    handleClose();
    if (isAuthenticated) {
      router.push("/profile/address");
    } else {
      router.push("/(auth)/login");
    }
  };

  // Compile combined saved addresses list
  const combinedSavedAddresses = useMemo(() => {
    const list: DeliveryLocation[] = [];
    const seenAddresses = new Set<string>();

    const addUnique = (loc: DeliveryLocation) => {
      const key = (loc.formattedAddress || loc.state).trim().toLowerCase();
      if (!seenAddresses.has(key)) {
        seenAddresses.add(key);
        list.push(loc);
      }
    };

    if (isAuthenticated && customer?.shipping?.address_1) {
      const shipState = customer.shipping.city || customer.shipping.state || "Kenya";
      addUnique({
        id: "profile-shipping",
        code: "PROFILE_SHIPPING",
        state: shipState,
        price: matchDeliveryFee(shipState),
        formattedAddress: `${customer.shipping.address_1}${customer.shipping.city ? `, ${customer.shipping.city}` : ""}`,
        label: "Primary Shipping Address",
        isDefault: true,
      });
    }

    for (const saved of savedAddresses) {
      if (
        saved.id !== "default-nairobi" &&
        saved.label !== "Default Location" &&
        saved.state !== "Nairobi County"
      ) {
        addUnique(saved);
      }
    }

    return list;
  }, [customer, isAuthenticated, savedAddresses, matchDeliveryFee]);

  const filteredCounties = useMemo(() => {
    if (!countySearchQuery.trim()) return deliveryFees as DeliveryLocation[];
    const q = countySearchQuery.toLowerCase();
    return (deliveryFees as DeliveryLocation[]).filter(
      (item) =>
        item.state.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    );
  }, [countySearchQuery]);

  const isLocationSelected = (loc: DeliveryLocation) => {
    if (!currentLocation) return false;
    if (currentLocation.formattedAddress && loc.formattedAddress) {
      return (
        currentLocation.formattedAddress.trim().toLowerCase() ===
        loc.formattedAddress.trim().toLowerCase()
      );
    }
    return currentLocation.state?.toLowerCase() === loc.state?.toLowerCase();
  };

  const isAddAddressMode = viewMode === "add_address";

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={[styles.backdrop, isAddAddressMode && styles.backdropCompact]}
          onPress={handleClose}
        />
        <View
          style={[
            styles.sheetContainer,
            isAddAddressMode && styles.sheetContainerFullScreen,
          ]}
        >
          {/* Header handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {isOffline && (
            <View style={styles.offlineBanner}>
              <Icon name="wifi-off" size={13} color="#D97706" />
              <Text style={styles.offlineBannerText}>
                You are currently offline. Showing cached saved addresses.
              </Text>
            </View>
          )}

          {!isAddAddressMode ? (
            /* ================= VIEW 1: SAVED ADDRESSES LIST ================= */
            <View style={styles.viewContainer}>
              <View style={styles.headerRow}>
                <View style={styles.headerTitleGroup}>
                  <View style={styles.iconCircle}>
                    <Icon name="location" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Choose Delivery Location</Text>
                    <Text style={styles.subtitle}>
                      Select where you want your medical devices delivered
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {!isAuthenticated && (
                <View style={styles.guestBanner}>
                  <Icon name="info" size={13} color={colors.primary} />
                  <Text style={styles.guestBannerText}>
                    Sign in to sync your saved delivery addresses across all devices.
                  </Text>
                  <TouchableOpacity
                    onPress={handleManageAddressInProfile}
                    style={styles.signInButton}
                  >
                    <Text style={styles.signInButtonText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

              <FlatList
                data={combinedSavedAddresses}
                keyExtractor={(item, index) => item.id || `saved-${index}-${item.code}`}
                style={styles.savedList}
                contentContainerStyle={styles.savedListContent}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Saved Addresses</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={styles.sectionCount}>
                        {combinedSavedAddresses.length} saved
                      </Text>
                      {savedAddresses.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            clearAllSavedAddresses();
                            toast.success("Saved addresses cleared");
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "600", color: colors.error || "#EF4444" }}>
                            Clear all
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                }
                renderItem={({ item }) => {
                  const selected = isLocationSelected(item);
                  const isDeletable = !item.id?.startsWith("profile-");

                  return (
                    <TouchableOpacity
                      style={[
                        styles.addressCard,
                        selected && styles.addressCardSelected,
                      ]}
                      onPress={() => handleSelectLocation(item)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          selected && styles.radioCircleSelected,
                        ]}
                      >
                        {selected && <View style={styles.radioInnerCircle} />}
                      </View>

                      <View style={styles.addressCardBody}>
                        <View style={styles.addressLabelRow}>
                          <Text style={styles.addressLabel}>
                            {item.label || item.state}
                          </Text>
                          {item.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>Default</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.addressState} numberOfLines={1}>
                          {item.state}
                        </Text>
                        {item.formattedAddress ? (
                          <Text style={styles.addressDetails} numberOfLines={1}>
                            {item.formattedAddress}
                          </Text>
                        ) : null}
                      </View>

                      {isDeletable && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            removeSavedAddress(item.id || item.formattedAddress || item.state);
                            if (combinedSavedAddresses.length <= 1) {
                              clearDeliveryLocation();
                            }
                            toast.success("Address removed");
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Icon name="trash" size={13} color={colors.error || "#EF4444"} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="map-pin" size={24} color={colors.textSecondary} />
                    <Text style={styles.emptyText}>No saved addresses yet.</Text>
                  </View>
                }
              />

              <View style={styles.footerContainer}>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => setViewMode("add_address")}
                  activeOpacity={0.8}
                >
                  <Icon name="plus" size={15} color="#FFFFFF" />
                  <Text style={styles.addAddressButtonText}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ================= VIEW 2: ADD ADDRESS ================= */
            <View style={styles.viewContainer}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setViewMode("saved_list")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="chevron-left" size={18} color={colors.primary} />
                  <Text style={styles.backButtonText}>Saved Addresses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.addScrollView}
                contentContainerStyle={styles.addScrollViewContent}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.addSectionTitle}>Add Delivery Location</Text>
                <Text style={styles.addSectionSubtitle}>
                  Pinpoint your exact location or search by city, estate, or town in Kenya.
                </Text>

                {/* Option 1: Use My Current Location */}
                <TouchableOpacity
                  style={styles.currentLocationButton}
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                  activeOpacity={0.8}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.currentLocationIconWrap}>
                      <Icon name="location" size={15} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currentLocationTitle}>
                      {isLocating ? "Detecting your location..." : "Use my current location"}
                    </Text>
                    <Text style={styles.currentLocationSubtitle}>
                      Automatically detect location using GPS
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={14} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR SEARCH LOCATION</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Option 2: Google Places Autocomplete */}
                {!isOffline && apiKey ? (
                  <View style={styles.autocompleteContainer}>
                    <GooglePlacesAutocomplete
                      ref={autocompleteRef}
                      placeholder="Search street, building, or area in Kenya..."
                      onPress={handlePlaceSelected}
                      fetchDetails={true}
                      debounce={400}
                      minLength={2}
                      enablePoweredByContainer={false}
                      keyboardShouldPersistTaps="always"
                      listUnderlayColor="rgba(0,0,0,0.05)"
                      listViewDisplayed="auto"
                      disableScroll={false}
                      onFail={(error) => {
                        setIsSearchingPlaces(false);
                        console.warn("Google Places Autocomplete failed:", error);
                      }}
                      onTimeout={() => {
                        setIsSearchingPlaces(false);
                        toast.error("Location search timed out. Check your internet connection.");
                      }}
                      query={{
                        key: apiKey,
                        language: "en",
                        components: "country:ke",
                      }}
                      textInputProps={{
                        placeholderTextColor: colors.textSecondary,
                        cursorColor: colors.primary,
                        autoFocus: true,
                        value: placesSearchText,
                        onChangeText: (text) => {
                          setPlacesSearchText(text);
                          setIsSearchingPlaces(text.trim().length >= 2);
                        },
                      }}
                      renderLeftButton={() => (
                        <View style={styles.searchLeftIconWrap}>
                          <Icon name="search" size={15} color={colors.textSecondary} />
                        </View>
                      )}
                      renderRightButton={() => {
                        if (isSearchingPlaces) {
                          return (
                            <View style={styles.searchRightActionWrap}>
                              <ActivityIndicator size="small" color={colors.primary} />
                            </View>
                          );
                        }
                        if (placesSearchText.length > 0) {
                          return (
                            <TouchableOpacity
                              style={styles.searchRightActionWrap}
                              onPress={() => {
                                autocompleteRef.current?.setAddressText("");
                                setPlacesSearchText("");
                                setIsSearchingPlaces(false);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Icon name="close" size={14} color={colors.textSecondary} />
                            </TouchableOpacity>
                          );
                        }
                        return null;
                      }}
                      listLoaderComponent={
                        <View style={styles.dropdownLoaderContainer}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={[styles.dropdownFeedbackText, { color: colors.textSecondary }]}>
                            Searching places in Kenya...
                          </Text>
                        </View>
                      }
                      listEmptyComponent={
                        placesSearchText.trim().length >= 2 ? (
                          <View style={styles.dropdownEmptyContainer}>
                            <Icon name="search" size={16} color={colors.textSecondary} />
                            <Text style={[styles.dropdownFeedbackText, { color: colors.textSecondary }]}>
                              No locations found for &ldquo;{placesSearchText}&rdquo;
                            </Text>
                            <Text style={[styles.dropdownSubFeedbackText, { color: colors.textSecondary }]}>
                              Try searching by landmark, building, estate, or nearby county.
                            </Text>
                          </View>
                        ) : null
                      }
                      renderRow={(rowData) => {
                        if (isSearchingPlaces) {
                          setTimeout(() => setIsSearchingPlaces(false), 0);
                        }
                        const title =
                          rowData.structured_formatting?.main_text || rowData.description;
                        const subtitle =
                          rowData.structured_formatting?.secondary_text || "";
                        return (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 }}>
                            <Icon name="location" size={14} color={colors.primary} />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                                {title}
                              </Text>
                              {subtitle ? (
                                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                                  {subtitle}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        );
                      }}
                      styles={{
                        container: { flex: 0 },
                        textInputContainer: {
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          height: 38,
                          paddingHorizontal: 8,
                        },
                        textInput: {
                          flex: 1,
                          height: 36,
                          backgroundColor: "transparent",
                          color: colors.text,
                          fontSize: 12,
                          paddingHorizontal: 6,
                          margin: 0,
                        },
                        listView: {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderRadius: 8,
                          elevation: 10,
                          marginTop: 4,
                          maxHeight: 220,
                        },
                        row: {
                          backgroundColor: colors.card,
                          paddingVertical: 6,
                          paddingHorizontal: 10,
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.border,
                        },
                        description: {
                          color: colors.text,
                          fontSize: 12,
                        },
                        separator: { height: 0 },
                      }}
                    />
                  </View>
                ) : (
                  <View style={styles.offlinePickerContainer}>
                    <View style={styles.countySearchBox}>
                      <Icon name="search" size={14} color={colors.textSecondary} />
                      <TextInput
                        style={styles.countySearchInput}
                        placeholder="Search 47 Kenyan Counties..."
                        placeholderTextColor={colors.textSecondary}
                        value={countySearchQuery}
                        onChangeText={setCountySearchQuery}
                      />
                      {countySearchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setCountySearchQuery("")}>
                          <Icon name="close" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.countyListWrapper}>
                      {filteredCounties.slice(0, 15).map((county) => (
                        <TouchableOpacity
                          key={county.code}
                          style={styles.countyItem}
                          onPress={() =>
                            handleSelectLocation({
                              code: county.code,
                              state: county.state,
                              price: county.price,
                              formattedAddress: `${county.state}, Kenya`,
                              label: county.state,
                            })
                          }
                        >
                          <Icon name="map-pin" size={14} color={colors.primary} />
                          <Text style={styles.countyName}>{county.state}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default DeliveryOptionsModal;

const createStyles = (colors: Colors, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0, 0, 0, 0.45)",
    },
    backdrop: {
      flex: 1,
    },
    backdropCompact: {
      flex: 0,
      height: 20,
    },
    sheetContainer: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      maxHeight: "80%",
      minHeight: 340,
      paddingTop: 8,
      paddingBottom: Math.max(bottomInset, 12),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 12,
    },
    sheetContainerFullScreen: {
      height: "90%",
      maxHeight: "92%",
      minHeight: "85%",
      marginTop: Math.max(topInset, 16),
    },
    handleContainer: {
      alignItems: "center",
      paddingBottom: 6,
    },
    handle: {
      width: 32,
      height: 3.5,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    offlineBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(217, 119, 6, 0.1)",
      marginHorizontal: 10,
      marginBottom: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 6,
    },
    offlineBannerText: {
      fontSize: 11,
      color: "#D97706",
      fontWeight: "500",
      flex: 1,
    },
    viewContainer: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    iconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255, 111, 97, 0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    subtitle: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 1,
    },
    closeButton: {
      padding: 4,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingVertical: 2,
    },
    backButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    guestBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 111, 97, 0.06)",
      marginHorizontal: 10,
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 6,
      gap: 6,
    },
    guestBannerText: {
      fontSize: 10,
      color: colors.text,
      flex: 1,
      lineHeight: 14,
    },
    signInButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    signInButtonText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    sectionCount: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    savedList: {
      flex: 1,
    },
    savedListContent: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
      gap: 6,
    },
    addressCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 8,
    },
    addressCardSelected: {
      borderColor: colors.primary,
      backgroundColor: "rgba(255, 111, 97, 0.04)",
    },
    radioCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    radioCircleSelected: {
      borderColor: colors.primary,
    },
    radioInnerCircle: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    addressCardBody: {
      flex: 1,
      gap: 1,
    },
    addressLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    addressLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    defaultBadge: {
      backgroundColor: "rgba(46, 204, 113, 0.15)",
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 3,
    },
    defaultBadgeText: {
      fontSize: 9,
      fontWeight: "600",
      color: "#2ECC71",
    },
    addressState: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.text,
    },
    addressDetails: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    deleteButton: {
      padding: 4,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      gap: 6,
    },
    emptyText: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    footerContainer: {
      paddingHorizontal: 10,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    addAddressButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: 9,
      borderRadius: 8,
      gap: 6,
    },
    addAddressButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    addScrollView: {
      flex: 1,
    },
    addScrollViewContent: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 16,
    },
    addSectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    addSectionSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: 10,
      lineHeight: 15,
    },
    currentLocationButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 111, 97, 0.06)",
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 8,
    },
    currentLocationIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },
    currentLocationTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    currentLocationSubtitle: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      gap: 8,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    autocompleteContainer: {
      marginBottom: 10,
      zIndex: 10000,
    },
    searchLeftIconWrap: {
      justifyContent: "center",
      alignItems: "center",
      marginRight: 4,
    },
    searchRightActionWrap: {
      justifyContent: "center",
      alignItems: "center",
      padding: 4,
      marginLeft: 4,
    },
    dropdownLoaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
      gap: 6,
      backgroundColor: colors.card,
    },
    dropdownEmptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 10,
      gap: 4,
      backgroundColor: colors.card,
    },
    dropdownFeedbackText: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
    },
    dropdownSubFeedbackText: {
      fontSize: 10,
      textAlign: "center",
      lineHeight: 14,
    },
    offlinePickerContainer: {
      gap: 8,
      marginBottom: 16,
    },
    countySearchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      height: 38,
      gap: 6,
    },
    countySearchInput: {
      flex: 1,
      fontSize: 12,
      color: colors.text,
    },
    countyListWrapper: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    countyItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 8,
    },
    countyName: {
      flex: 1,
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
  });
