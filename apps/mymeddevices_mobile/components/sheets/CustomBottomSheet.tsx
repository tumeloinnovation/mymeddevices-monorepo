import { StyleSheet, ToastAndroid } from "react-native";
import React, { useCallback } from "react";
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import useCompareStore from "@/features/compare/stores/useCompareStore";

interface Props {
  children?: React.ReactNode;
  onClose?: () => void;
}

const CustomBottomSheet: React.FC<Props> = ({ children, onClose, ...rest }) => {
  const { colors } = useTheme();
  const snapPoints = React.useMemo(() => ["80%", "92%"], []);
  const sheetRef = React.useRef<BottomSheet>(null);

  const { clearCompare } = useCompareStore();

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        clearCompare();
        onClose?.();
      }
    },
    [clearCompare, onClose]
  );

  const renderBackdrop = React.useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        {...backdropProps}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.text, width: 40 }}
      {...rest}
    >
      {children}
    </BottomSheet>
  );
};

export default CustomBottomSheet;

const styles = StyleSheet.create({});
