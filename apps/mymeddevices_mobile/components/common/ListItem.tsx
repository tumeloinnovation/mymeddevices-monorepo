import React from "react";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";

import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";

interface ListItemProps {
  icon?: React.ReactNode;
  title: string;
  onPress: () => void;
  borderColor?: string;
  subtitle?: string;
}

const ListItem = ({
  icon,
  title,
  onPress,
  borderColor,
  subtitle,
}: ListItemProps) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { borderWidth: 1, borderColor: borderColor ?? colors.border },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <Icon
        name="chevron-right"
        size={20}
        color={colors.text}
      />
    </TouchableOpacity>
  );
};

const getStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      // flex: 1,
      height: 48,
      width: "100%",
      paddingVertical: 10,
      alignItems: "center",
      flexDirection: "row",
      marginVertical: SIZES.marginSM,
      paddingHorizontal: 10,
      borderRadius: SIZES.radius_small,
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    iconContainer: {
      height: 30,
      width: 30,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    icon: {
      height: 20,
      width: 20,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    arrowIcon: {
      height: 20,
      width: 20,
    },
  });

export default ListItem;
