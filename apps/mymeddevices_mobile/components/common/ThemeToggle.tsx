import { ThemeContext } from "@/context/ThemeContext";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { useTheme } from "@react-navigation/native";
import React, { useContext } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import Icon from "@/components/common/Icon";

const ThemeToggle: React.FC = () => {
  const { theme, changeTheme } = useContext(ThemeContext);
  const isDarkMode = theme === "dark";

  const { colors } = useTheme();
  const styles = getStyles(colors);

  const toggleSwitch = () => {
    changeTheme(isDarkMode ? "light" : "dark");
  };
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name="moon" size={24} color={colors.text} />
      </View>
      <Text style={styles.title}>Dark Mode</Text>
      <Switch
        style={{ paddingRight: 10, marginLeft: "auto" }}
        value={isDarkMode}
        onValueChange={toggleSwitch}
        thumbColor={colors.primary}
        trackColor={{ false: colors.textDisabled, true: "#E64A19" }}
      />
    </View>
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
      borderWidth: 1,
      borderColor: colors.border,
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
    title: {
      fontSize: 16,
      flex: 1,
      color: colors.text,
    },
  });

export default ThemeToggle;
