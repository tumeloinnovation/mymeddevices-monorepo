import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { Colors } from "@/types/app";
import CustomButton from "./CustomButton";
import { SIZES } from "@/styles/sizes";

interface EmptyStateProps {
  image: string;
  title: string;
  desc: string;
  buttonText: string;
  navigate?: () => void;
  onPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  image,
  title,
  desc,
  buttonText,
  navigate,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = createEmptyStyles(colors);

  const handlePress = onPress ?? navigate ?? (() => router.navigate("/"));

  return (
    <View style={styles.emptyStateContainer}>
      <Image
        source={image}
        style={styles.emptyStateImage}
        contentFit="contain"
      />
      <Text style={styles.emptyStateText}>{title}</Text>
      <Text style={styles.emptyStateSubText}>{desc}</Text>
      {buttonText && (
        <CustomButton title={buttonText} size="large" onPress={handlePress} />
      )}
    </View>
  );
};

const ProductCardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const styles = createSkeletonStyles(colors);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.pillSkeleton, { opacity }]} />
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      <Animated.View style={[styles.titleLine1, { opacity }]} />
      <Animated.View style={[styles.titleLine2, { opacity }]} />
      <Animated.View style={[styles.priceSkeleton, { opacity }]} />
      <Animated.View style={[styles.buttonSkeleton, { opacity }]} />
    </View>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const items = Array.from({ length: count });

  return (
    <View style={gridStyles.gridContainer}>
      {items.map((_, i) => (
        <View style={gridStyles.gridItem} key={i}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
};

const gridStyles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  gridItem: {
    width: "50%",
  },
});

const createEmptyStyles = (colors: Colors) =>
  StyleSheet.create({
    emptyStateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    emptyStateImage: {
      height: 250,
      width: 250,
    },
    emptyStateText: {
      fontSize: 20,
      marginTop: 5,
      fontWeight: "700",
      color: colors.text,
    },
    emptyStateSubText: {
      fontWeight: "500",
      fontSize: 16,
      marginVertical: 15,
      textAlign: "center",
      width: "70%",
      color: colors.text,
    },
  });

const createSkeletonStyles = (colors: Colors) =>
  StyleSheet.create({
    card: {
      height: 300,
      backgroundColor: colors.card,
      margin: 6,
      padding: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    pillSkeleton: {
      width: 70,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 8,
    },
    imageSkeleton: {
      flex: 1,
      width: "100%",
      borderRadius: 12,
      backgroundColor: colors.border,
      marginBottom: 10,
    },
    titleLine1: {
      width: "90%",
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 6,
    },
    titleLine2: {
      width: "60%",
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 10,
    },
    priceSkeleton: {
      width: "45%",
      height: 16,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 10,
    },
    buttonSkeleton: {
      width: "100%",
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
  });

export default EmptyState;
