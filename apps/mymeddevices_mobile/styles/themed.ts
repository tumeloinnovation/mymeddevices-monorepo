import { StyleSheet } from "react-native";
import { SIZES } from "./sizes";
import { Colors } from "@/types/app";

const createThemedStyles = (colors?: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    inputContainer: {
      marginVertical: 10,
    },
    inputLayout: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
    },
    input: {
      width: "100%",
      borderWidth: 1,
      padding: 5,
      paddingStart: 15,
      borderRadius: 5,
      marginTop: 5,
      marginBottom: 5,
    },
    inputLeftIcon: {
      position: "absolute",
      left: 10,
      bottom: 14,
    },
    inputRightIcon: {
      position: "absolute",
      right: 10,
      bottom: 15,
    },
    helperText: {
      color: colors?.error ?? "#E53E3E",
      paddingStart: 5,
    },
    headerTabsContainer: {
      height: 60,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: SIZES.marginXL,
      paddingLeft: 10,
      paddingRight: 0,
      elevation: 5,
    },
  });

const themed = createThemedStyles();
export default themed;

