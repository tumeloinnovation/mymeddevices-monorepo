import React from "react";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface props {
  handleClosePress: () => void;
  title: string;
}

const SheetHeader: React.FC<props> = ({ handleClosePress, title }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.headerContainer, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.headerText, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity style={[styles.closeButton]} onPress={handleClosePress}>
        <Icon name="close" size={25} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export default SheetHeader;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  headerText: {
    fontWeight: "500",
    fontSize: 20,
  },
  closeButton: {
    height: 25,
    width: 25,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
