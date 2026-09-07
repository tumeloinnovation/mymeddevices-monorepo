import { toast } from "sonner-native";
import { Product } from "@/types/product";
import useCompareStore from "@/features/compare/stores/useCompareStore";

export const MAX_COMPARE_ITEMS = 2;

export type CompareToggleResult = "added" | "removed" | "limit" | "none";

/**
 * Centralizes the add/remove-to-compare logic so the compare button and the
 * related products cards stay in sync (same 2-item limit + toast).
 *
 * Pass the `item` to get a reactive `isSelected` flag that re-renders the
 * component whenever this product enters/leaves the compare list.
 */
export const useCompareToggle = (item?: Product) => {
  const addToCompare = useCompareStore((s) => s.addToCompare);
  const removeFromCompare = useCompareStore((s) => s.removeFromCompare);
  const isSelected = useCompareStore((s) => (item ? s.isInCompare(item.id) : false));

  const toggle = (target: Product): CompareToggleResult => {
    const { isInCompare, compare_list } = useCompareStore.getState();

    if (isInCompare(target.id)) {
      removeFromCompare(target);
      return "removed";
    }

    if (compare_list.length >= MAX_COMPARE_ITEMS) {
      toast.info(`You can only compare ${MAX_COMPARE_ITEMS} items`, {
        description: "Remove an item before adding another.",
      });
      return "limit";
    }

    addToCompare(target);
    return "added";
  };

  return { toggle, isSelected };
};
