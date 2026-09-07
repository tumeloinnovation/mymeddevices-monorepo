import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { toast } from "sonner-native";
import { useTheme } from "@react-navigation/native";
import Icon from "@/components/common/Icon";
import { Colors } from "@/types/app";

interface UserAvatarProps {
  uri?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showEditBadge?: boolean;
  onImageSelected?: (uri: string) => void;
  isLoading?: boolean;
  showVerifiedBadge?: boolean;
}

const SIZE_MAP = {
  sm: { dimension: 42, fontSize: 14, iconSize: 18, badgeSize: 16, badgeIcon: 10 },
  md: { dimension: 58, fontSize: 20, iconSize: 26, badgeSize: 22, badgeIcon: 12 },
  lg: { dimension: 78, fontSize: 26, iconSize: 34, badgeSize: 26, badgeIcon: 14 },
  xl: { dimension: 98, fontSize: 32, iconSize: 44, badgeSize: 32, badgeIcon: 17 },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  name = "User",
  size = "md",
  showEditBadge = false,
  onImageSelected,
  isLoading = false,
  showVerifiedBadge = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const config = SIZE_MAP[size];

  const getInitials = (fullName: string) => {
    if (!fullName) return "MD";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "MD";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handlePickImage = async () => {
    if (!onImageSelected) return;

    try {
      const ImagePicker = await import("expo-image-picker");
      if (!ImagePicker || typeof ImagePicker.requestMediaLibraryPermissionsAsync !== "function") {
        toast.error("Image picker is not available on this device.");
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        toast.error("Photo library permission is required to select a profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        onImageSelected(selectedUri);
      }
    } catch (error) {
      console.error("Error picking avatar:", error);
      toast.error("Failed to select photo");
    }
  };

  const initials = getInitials(name);
  const hasValidUri = uri && typeof uri === "string" && (uri.startsWith("http") || uri.startsWith("file://") || uri.startsWith("data:"));

  return (
    <View style={[styles.wrapper, { width: config.dimension, height: config.dimension }]}>
      <View
        style={[
          styles.container,
          {
            width: config.dimension,
            height: config.dimension,
            borderRadius: config.dimension / 2,
            backgroundColor: colors.primary,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : hasValidUri ? (
          <Image
            source={{ uri }}
            style={{
              width: config.dimension,
              height: config.dimension,
              borderRadius: config.dimension / 2,
            }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Text
            style={[
              styles.initialsText,
              {
                fontSize: config.fontSize,
              },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>

      {/* Verified Medical Checkmark Badge */}
      {showVerifiedBadge && !showEditBadge && (
        <View
          style={[
            styles.verifiedBadge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
              borderColor: colors.card,
            },
          ]}
        >
          <Icon name="badge-check" size={config.badgeIcon} color="#FFFFFF" />
        </View>
      )}

      {/* Camera / Edit Overlay Badge */}
      {showEditBadge && (
        <TouchableOpacity
          style={[
            styles.editBadge,
            {
              width: config.badgeSize,
              height: config.badgeSize,
              borderRadius: config.badgeSize / 2,
              backgroundColor: colors.primary,
              borderColor: colors.card,
            },
          ]}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          <Icon name="camera" size={config.badgeIcon} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    container: {
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    initialsText: {
      color: "#FFFFFF",
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    verifiedBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      zIndex: 50,
      elevation: 10,
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      zIndex: 50,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
    },
  });

export default UserAvatar;
