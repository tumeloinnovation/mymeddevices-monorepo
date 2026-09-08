import { router } from "expo-router";
import Icon from "@/components/common/Icon";
import { TouchableOpacity } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import useAppStore from "@/stores/useAppStore";
import useCompareStore from "@/features/compare/stores/useCompareStore";
import { useCompareToggle } from "@/features/compare/hooks/useCompareToggle";

const CompareButton = ({ item }: { item: Product }) => {
  const { colors } = useTheme();
  const isInCompare = useCompareStore((state) => state.isInCompare(item.id));

  const openRelatedProducts = useAppStore((s) => s.openRelatedProducts);

  const { toggle } = useCompareToggle();
  const clearCompare = useCompareStore((s) => s.clearCompare);

  const compare_list = useCompareStore((state) => state.compare_list);

  const handleButton = () => {
    const before = compare_list.length;
    const result = toggle(item);

    if (result !== "added") return;

    if (before === 0) {
      openRelatedProducts(item.related_ids ?? []);
    } else if (before === 1) {
      router.navigate("/compare");
    }
  };

  return (
    <TouchableOpacity
      onPress={handleButton}
      onLongPress={clearCompare}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Icon
        name="arrow-left-right"
        size={20}
        color={isInCompare ? colors.textDisabled : colors.primary}
      />
    </TouchableOpacity>
  );
};

export default CompareButton;
