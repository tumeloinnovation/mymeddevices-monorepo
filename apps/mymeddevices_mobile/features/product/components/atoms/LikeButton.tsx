import Icon from "@/components/common/Icon";
import { TouchableOpacity } from "react-native";
import React from "react";
import { useTheme } from "@react-navigation/native";

import { Product } from "@/types/product";
import { useWishlistStore } from "@/features/wishlist/stores/useWishlistStore";

interface props {
  item: Product;
  detail?: boolean;
}

const LikeButton: React.FC<props> = ({ item, detail }) => {
  const { colors } = useTheme();
  const isInWishlist = useWishlistStore((state) => state.isInWishlist(item.id));

  const handleAddToWishlist = useWishlistStore((state) => state.addToWishlist);
  const handleRemoveFromWishlist = useWishlistStore(
    (state) => state.removeFromWishlist
  );

  const handleButton = () => {
    if (isInWishlist) {
      handleRemoveFromWishlist(item);
    } else {
      handleAddToWishlist(item);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleButton}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {isInWishlist ? (
        <Icon
          name="heart-filled"
          size={20}
          color={detail ? colors.text : colors.primary}
        />
      ) : (
        <Icon
          name="heart"
          size={20}
          color={detail ? colors.text : colors.primary}
        />
      )}
    </TouchableOpacity>
  );
};

export default LikeButton;
