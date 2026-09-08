import React, { memo, useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import Icon from "@/components/common/Icon";
import { useCheckoutStore } from "../stores/useCheckoutStore";
import useDeliveryLocationStore, { DeliveryLocation } from "@/stores/useDeliveryLocationStore";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";

interface DeliveryAddressStepProps {
  onAddressConfirmed: () => void;
}

const DeliveryAddressStep: React.FC<DeliveryAddressStepProps> = memo(({
  onAddressConfirmed,
}) => {
  const { colors, dark } = useTheme();
  const { delivery, setDelivery } = useCheckoutStore();
  const { currentLocation, savedAddresses, setDeliveryLocation } = useDeliveryLocationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync currentLocation to checkout store if delivery is not set
  useEffect(() => {
    if (!delivery && currentLocation) {
      const region = currentLocation.state.replace(/\s*County$/i, "").trim();
      const address = currentLocation.formattedAddress || currentLocation.state;
      setDelivery({
        address,
        region,
      });
    }
  }, [currentLocation, delivery, setDelivery]);

  const handleOpenModal = () => {
    Haptics.selectionAsync().catch(() => {});
    setIsModalOpen(true);
  };

  const handleSelectSaved = (loc: DeliveryLocation) => {
    Haptics.selectionAsync().catch(() => {});
    setDeliveryLocation(loc);
    const region = loc.state.replace(/\s*County$/i, "").trim();
    const address = loc.formattedAddress || loc.state;
    setDelivery({
      address,
      region,
    });
  };

  const currentAddressText =
    delivery?.address ||
    currentLocation?.formattedAddress ||
    currentLocation?.state ||
    "Select Delivery Address";

  const currentRegion =
    delivery?.region ||
    currentLocation?.state?.replace(/\s*County$/i, "").trim() ||
    "";

  return (
    <View style={styles.container}>
      {/* 1. Main Selected Delivery Card */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: dark ? colors.background : "#F8FAFC",
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.pinCircle, { backgroundColor: colors.primary + "15" }]}>
            <Icon name="location" size={18} color={colors.primary} />
          </View>
          <View style={styles.cardDetails}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
              Delivery Destination
            </Text>
            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
              {currentAddressText}
            </Text>
            <View style={styles.regionBadgeRow}>
              <View style={[styles.regionBadge, { backgroundColor: colors.primary + "14" }]}>
                <Icon name="map-pin" size={11} color={colors.primary} />
                <Text style={[styles.regionBadgeText, { color: colors.primary }]}>
                  {currentRegion}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Change Address Action Button */}
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleOpenModal}
          activeOpacity={0.7}
        >
          <Icon name="search" size={14} color={colors.primary} />
          <Text style={[styles.changeButtonText, { color: colors.primary }]}>
            Change / Search Landmark or County
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Quick Select Other Saved Locations (if multiple) */}
      {savedAddresses.length > 1 && (
        <View style={styles.savedSection}>
          <Text style={[styles.savedSectionTitle, { color: colors.textSecondary }]}>
            Or pick from recent addresses:
          </Text>
          <View style={styles.savedPills}>
            {savedAddresses.slice(0, 3).map((loc) => {
              const isSelected =
                (loc.formattedAddress && loc.formattedAddress === delivery?.address) ||
                loc.state === delivery?.address;

              return (
                <TouchableOpacity
                  key={loc.id || loc.state}
                  style={[
                    styles.savedPill,
                    {
                      backgroundColor: isSelected ? colors.primary + "15" : (dark ? colors.background : "#FFFFFF"),
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectSaved(loc)}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={isSelected ? "check" : "location"}
                    size={12}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.savedPillText,
                      { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? "700" : "500" },
                    ]}
                    numberOfLines={1}
                  >
                    {loc.label || loc.state}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. Confirm Address CTA */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          { backgroundColor: delivery ? colors.primary : colors.border },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onAddressConfirmed();
        }}
        disabled={!delivery}
        activeOpacity={0.85}
      >
        <Text style={[styles.confirmButtonText, { color: delivery ? "#FFFFFF" : colors.textSecondary }]}>
          Confirm & Continue to Contact
        </Text>
        <Icon name="chevron-right" size={16} color={delivery ? "#FFFFFF" : colors.textSecondary} />
      </TouchableOpacity>

      {/* Full Feature Location Modal */}
      <DeliveryOptionsModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  mainCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  addressText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  regionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  regionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  regionBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  savedSection: {
    gap: 6,
  },
  savedSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
  },
  savedPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  savedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  savedPillText: {
    fontSize: 12,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    marginTop: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

export default DeliveryAddressStep;
