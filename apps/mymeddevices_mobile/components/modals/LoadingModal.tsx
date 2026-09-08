import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import CustomText from "../common/CustomText";
import { Colors } from "@/types/app";

interface LoadingModalProps {
  visible: boolean;
  message?: string;
}

const LoadingModal = ({ visible, message = "Loading..." }: LoadingModalProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <CustomText style={styles.message}>{message}</CustomText>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 30,
      alignItems: "center",
      minWidth: 150,
    },
    message: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: "500",
    },
  });

export default LoadingModal;
