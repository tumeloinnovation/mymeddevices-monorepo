import React from "react";
import { DimensionValue, View } from "react-native";

type Props = {
  children: React.ReactNode;
  marginTop?: number;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  marginRight?: number;
  gap?: boolean;
  flex?: boolean;
  marginBottom?: number;
  height?: DimensionValue;
};

const RowContainer: React.FC<Props> = ({
  children,
  gap = false,
  justifyContent = "flex-start",
  marginRight,
  marginTop,
  flex = false,
  marginBottom = 0,
  height = undefined,
}) => {
  return (
    <View
      style={{
        flex: flex ? 1 : 0,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: gap ? 8 : 0,
        justifyContent,
        marginRight,
        marginTop,
        marginBottom,
        height,
      }}
    >
      {children}
    </View>
  );
};

export default RowContainer;
