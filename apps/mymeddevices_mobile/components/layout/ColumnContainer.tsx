import React from "react";
import { View, Text, DimensionValue } from "react-native";

type Props = {
  children: React.ReactNode;
  width: "33.33%" | "40%" | "50%" | "60%" | DimensionValue;
  paddingHorizontal?: boolean;
  marginBottom?: number;
  height?: DimensionValue;
};

const ColumnContainer: React.FC<Props> = ({
  children,
  width,
  height = 300,
  paddingHorizontal = false,
  marginBottom,
}) => {
  return (
    <View
      style={{
        width,
        height,
        paddingHorizontal: paddingHorizontal ? 5 : 0,
        marginBottom,
      }}
    >
      {children}
    </View>
  );
};

export default ColumnContainer;
