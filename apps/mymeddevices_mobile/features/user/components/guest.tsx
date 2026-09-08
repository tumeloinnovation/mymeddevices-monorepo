import React, { useState } from "react";
import Icon from "@/components/common/Icon";
import { useTheme } from "@react-navigation/native";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import themed from "@/styles/themed";
import CustomButton from "@/components/common/CustomButton";
import { useUserStore } from "../stores/useUserStore";
import { usePathname, useRouter } from "expo-router";

const GuestModal = () => {
  const { colors } = useTheme();
  const path = usePathname();
  const router = useRouter();

  const styles = createStyles(colors);

  const {
    isGuestOpen,
    setIsGuestOpen,
    setGuest,
  } = useUserStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isValid, setIsValid] = useState(true);

  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    setIsValid(phoneRegex.test(number));
    setPhone(number);
  };

  const onSubmit = async () => {
    setGuest({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
    });
    setFirstName("");
    setLastName("");
    setPhone("");
    setIsGuestOpen(false);
    if (path === "/cart") {
      return router.push("/checkout");
    }
  };

  const isDisabled =
    !firstName.length || !lastName.length || !phone.length || !isValid;

  if (!isGuestOpen) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isGuestOpen}
      onRequestClose={() => setIsGuestOpen(false)}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          style={styles.backdrop}
        />
        <View style={styles.container}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Continue as Guest</Text>
            <TouchableOpacity
              onPress={() => setIsGuestOpen(false)}
              style={styles.closeButton}
            >
              <Icon
                name="trash-filled"
                size={16}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>First Name</Text>
            <TextInput
              style={[themed.input, styles.input]}
              placeholder={"Type your first name here"}
              onChangeText={(value) => setFirstName(value)}
              value={firstName}
              autoCorrect={false}
              textContentType="name"
              autoComplete="name"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>Last Name</Text>
            <TextInput
              style={[themed.input, styles.input]}
              placeholder={"Type your last name here"}
              onChangeText={(value) => setLastName(value)}
              value={lastName}
              autoCorrect={false}
              textContentType="name"
              autoComplete="name"
              autoCapitalize="none"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.labelText}>Phone Number</Text>
            <TextInput
              style={[themed.input, styles.input]}
              placeholder={"Type your phone number here"}
              onChangeText={validatePhoneNumber}
              value={phone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoCapitalize="none"
              autoCorrect={false}
              contextMenuHidden={true}
              placeholderTextColor={colors.textSecondary}
            />
            {!isValid && (
              <Text style={styles.errorText}>
                Must be a valid Kenyan phone number
              </Text>
            )}
          </View>
          <CustomButton
            onPress={onSubmit}
            title={"Proceed"}
            disabled={isDisabled}
            type={isDisabled ? "default" : "primary"}
          />
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalContainer: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      position: "relative",
    },
    input: {
      backgroundColor: colors.card,
      width: "100%",
      height: 45,
      color: colors.text,
      borderColor: colors.onSurface,
    },
    backdrop: {
      position: "absolute",
      height: "100%",
      width: "100%",
      backgroundColor: "rgba(0,0,0,.5)",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    iconContainer: {
      position: "absolute",
      right: 10,
    },
    errorText: {
      color: "red",
      fontSize: 14,
    },
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 22,
    },
    container: {
      backgroundColor: colors.card,
      maxWidth: 330,
      width: "100%",
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderRadius: SIZES.radius_medium,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingBottom: 15,
      marginBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleText: {
      flex: 1,
      fontSize: SIZES.h6,
      fontWeight: "600",
      color: colors.text,
    },
    forgotContainer: {
      paddingBottom: 15,
      flexDirection: "row",
      alignSelf: "flex-end",
    },
    forgotText: {
      color: "gray",
    },
    closeButton: {
      height: 32,
      width: 32,
      borderRadius: 32,
      // backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonIcon: {
      color: colors.text,
    },
    labelText: {
      fontSize: SIZES.fontMD,
      lineHeight: 20,
      fontWeight: "400",
      color: colors.text,
      marginBottom: 4,
    },
    inputContainer: {
      marginBottom: 15,
    },
    buttonContainer: {
      marginBottom: 25,
    },
  });

export default GuestModal;
