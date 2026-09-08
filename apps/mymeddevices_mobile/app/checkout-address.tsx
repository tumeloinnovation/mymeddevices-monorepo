import React, { useCallback, useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import * as Location from "expo-location";
import { toast } from "sonner-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";

import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";
import { useAuth } from "@/context/AuthContext";
import deliveryFees from "@/utils/deliveryFees.json";
import useDeliveryLocationStore, {
  DeliveryLocation,
} from "@/stores/useDeliveryLocationStore";
import { useCheckoutStore } from "@/features/checkout/stores/useCheckoutStore";
import { parseGoogleAddress } from "@/utils/googlePlaces";
import { formatGeocodedAddress } from "@/utils/addressFormatter";
import {
  createCustomDeliveryLocation,
  buildCombinedSavedAddresses,
} from "@/features/checkout/utils/addressHelpers";

const CheckoutAddressScreen = () => {
  const { colors, dark } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, dark, insets.bottom);

  const { customer, isAuthenticated } = useAuth();
  const {
    currentLocation,
    savedAddresses,
    setDeliveryLocation,
    addSavedAddress,
    removeSavedAddress,
  } = useDeliveryLocationStore();
  const { delivery, setDelivery, setShipping } = useCheckoutStore();

  const [isLocating, setIsLocating] = useState(false);
  const [placesSearchText, setPlacesSearchText] = useState("");
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: "Delivery Destination",
      headerBackTitle: "Checkout",
    });
  }, [navigation]);

  const normalizeRegion = (value: string) =>
    value.toLowerCase().replace(/\s*county$/i, "").trim();

  const matchDeliveryFee = useCallback((region: string): number => {
    const normalized = normalizeRegion(region);
    const match = (deliveryFees as DeliveryLocation[]).find(
      (item) => normalizeRegion(item.state) === normalized
    );
    return match?.price ?? 200;
  }, []);

  const handleSelectLocation = (loc: DeliveryLocation) => {
    Haptics.selectionAsync().catch(() => {});
    setDeliveryLocation(loc);
    const region = loc.state.replace(/\s*County$/i, "").trim();
    const address = loc.formattedAddress || loc.state;
    setDelivery({
      address,
      region,
    });
    setShipping(loc.price || matchDeliveryFee(region));
    toast.success(`Delivery address set to ${loc.state}`);
    router.back();
  };

  const handlePlaceSelected = useCallback(
    (data: any, details: any = null) => {
      const { location: newLoc, state, cleanAddress } = createCustomDeliveryLocation(
        data,
        details,
        matchDeliveryFee
      );

      addSavedAddress(newLoc);
      setDeliveryLocation(newLoc);
      setDelivery({
        address: cleanAddress,
        region: state,
      });
      setShipping(newLoc.price);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(`Delivery address set to ${state}`);
      router.back();
    },
    [matchDeliveryFee, addSavedAddress, setDeliveryLocation, setDelivery, setShipping]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.error("Location permission denied");
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
        if (apiKey) {
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
      setDelivery({
        address: formattedAddress,
        region: state,
      });
      setShipping(price);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast.success(`Location set: ${state}`);
      router.back();
    } catch {
      toast.error("Could not detect current location");
    } finally {
      setIsLocating(false);
    }
  }, [apiKey, isLocating, matchDeliveryFee, addSavedAddress, setDeliveryLocation, setDelivery, setShipping]);

  // Combined Saved Addresses List
  const combinedSavedAddresses = useMemo(
    () => buildCombinedSavedAddresses(customer, isAuthenticated, savedAddresses, matchDeliveryFee),
    [customer, isAuthenticated, savedAddresses, matchDeliveryFee]
  );

  const isLocationSelected = (loc: DeliveryLocation) => {
    const activeAddr = delivery?.address || currentLocation?.formattedAddress || currentLocation?.state;
    if (activeAddr && loc.formattedAddress) {
      return activeAddr.trim().toLowerCase() === loc.formattedAddress.trim().toLowerCase();
    }
    return delivery?.region?.toLowerCase() === loc.state.toLowerCase();
  };

  return (
    <View style={styles.container}>
      {/* 1. Compact Current Location Quick-Action */}
      <TouchableOpacity
        style={styles.gpsButton}
        onPress={handleUseCurrentLocation}
        disabled={isLocating}
        activeOpacity={0.75}
      >
        <View style={styles.gpsIconBox}>
          {isLocating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="location" size={15} color={colors.primary} />
          )}
        </View>
        <View style={styles.gpsTextBox}>
          <Text style={styles.gpsTitle}>
            {isLocating ? "Finding your location..." : "Use my current location"}
          </Text>
          <Text style={styles.gpsSubtitle}>
            Detect area and town name automatically
          </Text>
        </View>
        <Icon name="chevron-right" size={14} color={colors.textSecondary || "#94A3B8"} />
      </TouchableOpacity>

      {/* 2. Compact Search Section */}
      <View style={styles.searchSection}>
        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          placeholder="Search landmark, building, street, or estate..."
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
            key: apiKey || "",
            language: "en",
            components: "country:ke",
          }}
          textInputProps={{
            onChangeText: (text) => {
              setPlacesSearchText(text);
              setIsSearchingPlaces(text.trim().length >= 2);
            },
            placeholderTextColor: colors.textSecondary || "#94A3B8",
            returnKeyType: "search",
            autoCorrect: false,
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: [styles.textInput, { color: colors.text }],
            listView: [
              styles.listView,
              {
                backgroundColor: dark ? "#1E293B" : "#FFFFFF",
                borderColor: dark ? "#334155" : "#E2E8F0",
              },
            ],
            row: [
              styles.row,
              {
                backgroundColor: dark ? "#1E293B" : "#FFFFFF",
                borderBottomColor: dark ? "#334155" : "#F1F5F9",
              },
            ],
            separator: { backgroundColor: "transparent" },
          }}
          renderLeftButton={() => (
            <View style={styles.searchIconBox}>
              <Icon name="search" size={14} color={colors.textSecondary || "#94A3B8"} />
            </View>
          )}
          renderRightButton={() => {
            if (isSearchingPlaces) {
              return (
                <View style={styles.searchIconBox}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              );
            }
            if (placesSearchText.length > 0) {
              return (
                <TouchableOpacity
                  style={styles.searchIconBox}
                  onPress={() => {
                    autocompleteRef.current?.clear();
                    setPlacesSearchText("");
                    setIsSearchingPlaces(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={13} color={colors.textSecondary || "#94A3B8"} />
                </TouchableOpacity>
              );
            }
            return null;
          }}
          listLoaderComponent={
            <View style={styles.dropdownLoaderContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.dropdownFeedbackText, { color: colors.textSecondary || "#94A3B8" }]}>
                Searching places in Kenya...
              </Text>
            </View>
          }
          listEmptyComponent={
            placesSearchText.trim().length >= 2 ? (
              <View style={styles.dropdownEmptyContainer}>
                <Icon name="search" size={16} color={colors.textSecondary || "#94A3B8"} />
                <Text style={[styles.dropdownFeedbackText, { color: colors.textSecondary || "#94A3B8" }]}>
                  No locations found for &ldquo;{placesSearchText}&rdquo;
                </Text>
                <Text style={[styles.dropdownSubFeedbackText, { color: colors.textSecondary || "#64748B" }]}>
                  Try typing a nearby landmark, building, estate, or town name.
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
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>
                    {title}
                  </Text>
                  {subtitle ? (
                    <Text style={{ fontSize: 10, color: colors.textSecondary || "#94A3B8", marginTop: 1 }}>
                      {subtitle}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* 3. Saved Destinations */}
      <View style={styles.savedSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.savedSectionTitle}>Delivery Destinations</Text>
          {combinedSavedAddresses.length > 0 && (
            <Text style={styles.savedCountText}>{combinedSavedAddresses.length} saved</Text>
          )}
        </View>
        <FlatList
          data={combinedSavedAddresses}
          keyExtractor={(item, index) => item.id || `${item.code}-${index}`}
          contentContainerStyle={styles.savedList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptySaved}>
              <Icon name="map-pin" size={24} color={colors.textSecondary || "#94A3B8"} />
              <Text style={styles.emptySavedText}>
                No saved destination. Search above or select your county below.
              </Text>
            </View>
          )}
          renderItem={({ item }) => {
            const selected = isLocationSelected(item);
            return (
              <TouchableOpacity
                style={[
                  styles.addressCard,
                  selected && styles.addressCardSelected,
                ]}
                onPress={() => handleSelectLocation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.addressLeft}>
                  <View
                    style={[
                      styles.addressIconBox,
                      selected && styles.addressIconBoxSelected,
                    ]}
                  >
                    <Icon
                      name={selected ? "check" : "location"}
                      size={13}
                      color={selected ? "#FFFFFF" : colors.primary}
                    />
                  </View>
                  <View style={styles.addressTextGroup}>
                    <View style={styles.addressTitleRow}>
                      <Text style={styles.addressLabel}>
                        {item.label || item.state}
                      </Text>
                      {item.isDefault && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>Primary</Text>
                        </View>
                      )}
                    </View>
                    {item.formattedAddress ? (
                      <Text style={styles.addressFull} numberOfLines={1}>
                        {item.formattedAddress}
                      </Text>
                    ) : (
                      <Text style={styles.addressFull}>
                        {item.state} (Standard delivery)
                      </Text>
                    )}
                  </View>
                </View>

                {item.id && !item.isDefault && (
                  <TouchableOpacity
                    onPress={() => removeSavedAddress(item.id!)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="trash" size={13} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
};

export default CheckoutAddressScreen;

const createStyles = (colors: Colors, dark: boolean, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: dark ? "#0F172A" : "#F8FAFC",
      paddingHorizontal: 10,
      paddingTop: 6,
    },
    gpsButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 8,
      marginBottom: 6,
    },
    gpsIconBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: colors.primary + "14",
      alignItems: "center",
      justifyContent: "center",
    },
    gpsTextBox: {
      flex: 1,
    },
    gpsTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    gpsSubtitle: {
      fontSize: 10,
      color: colors.textSecondary || "#64748B",
    },
    searchSection: {
      zIndex: 10,
      marginBottom: 6,
    },
    autocompleteContainer: {
      flex: 0,
      width: "100%",
    },
    textInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingHorizontal: 8,
      height: 38,
    },
    textInput: {
      flex: 1,
      fontSize: 12,
      height: "100%",
      paddingVertical: 0,
    },
    searchIconBox: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    listView: {
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 2,
      elevation: 4,
      maxHeight: 180,
    },
    row: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dropdownLoaderContainer: {
      padding: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      justifyContent: "center",
    },
    dropdownEmptyContainer: {
      padding: 12,
      alignItems: "center",
      gap: 3,
    },
    dropdownFeedbackText: {
      fontSize: 11,
      fontWeight: "600",
    },
    dropdownSubFeedbackText: {
      fontSize: 10,
      textAlign: "center",
      color: colors.textSecondary || "#64748B",
    },
    savedSection: {
      flex: 1,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
      marginTop: 2,
    },
    savedSectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary || "#64748B",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    savedCountText: {
      fontSize: 10,
      color: colors.textSecondary || "#94A3B8",
    },
    savedList: {
      gap: 6,
      paddingBottom: Math.max(bottomInset, 12) + 16,
    },
    addressCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: dark ? "#1E293B" : "#FFFFFF",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: dark ? "#334155" : "#E2E8F0",
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 8,
    },
    addressCardSelected: {
      borderColor: colors.primary,
      backgroundColor: dark ? "rgba(255, 111, 97, 0.05)" : "#FFF7F6",
    },
    addressLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    addressIconBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: dark ? "#334155" : "#F1F5F9",
      alignItems: "center",
      justifyContent: "center",
    },
    addressIconBoxSelected: {
      backgroundColor: colors.primary,
    },
    addressTextGroup: {
      flex: 1,
    },
    addressTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    addressLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text,
    },
    defaultPill: {
      backgroundColor: "rgba(16, 185, 129, 0.12)",
      paddingHorizontal: 5,
      paddingVertical: 0.5,
      borderRadius: 3,
    },
    defaultPillText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#10B981",
    },
    addressFull: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      marginTop: 1,
    },
    emptySaved: {
      paddingVertical: 20,
      alignItems: "center",
      gap: 6,
    },
    emptySavedText: {
      fontSize: 11,
      color: colors.textSecondary || "#64748B",
      textAlign: "center",
    },
  });
