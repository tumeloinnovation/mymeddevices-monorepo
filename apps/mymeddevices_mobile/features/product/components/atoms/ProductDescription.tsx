import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import { Colors } from "@/types/app";
import Icon from "@/components/common/Icon";

interface ProductDescriptionProps {
  data: Product | null;
}

export const ProductDescription: React.FC<ProductDescriptionProps> = ({ data }) => {
  const { width } = useWindowDimensions();
  const { colors, dark } = useTheme();
  const styles = createStyles(colors, dark);

  const [isExpanded, setIsExpanded] = useState(false);

  const htmlContent =
    data?.description ||
    data?.short_description ||
    "<p>No detailed description provided for this device.</p>";

  const isLongContent = htmlContent.length > 450;

  const tagsStyles = {
    body: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
    },
    p: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 10,
    },
    h1: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "700" as const,
      marginBottom: 8,
      marginTop: 4,
    },
    h2: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700" as const,
      marginBottom: 6,
      marginTop: 4,
    },
    h3: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600" as const,
      marginBottom: 6,
    },
    ul: {
      marginBottom: 10,
      paddingLeft: 12,
    },
    li: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 4,
    },
    strong: {
      color: colors.text,
      fontWeight: "700" as const,
    },
  };

  return (
    <View style={styles.container}>
      {/* Rendered HTML Description */}
      <View
        style={[
          styles.htmlContainer,
          !isExpanded && isLongContent && styles.collapsedContainer,
        ]}
      >
        <RenderHtml
          contentWidth={width - 48}
          source={{ html: htmlContent }}
          tagsStyles={tagsStyles}
          defaultTextProps={{ style: { color: colors.text } }}
        />
      </View>

      {/* Show More / Show Less Toggle Button */}
      {isLongContent && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? "Show Less" : "Read Full Description"}
          </Text>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color={colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ProductDescription;

const createStyles = (colors: Colors, dark: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 2,
      gap: 8,
    },
    htmlContainer: {
      overflow: "hidden",
    },
    collapsedContainer: {
      maxHeight: 160,
    },
    expandButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 8,
      backgroundColor: dark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
    },
    expandButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
  });
