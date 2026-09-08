import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import CustomBottomSheet from "@/components/sheets/CustomBottomSheet";
import VariantProductItem from "@/features/product/components/organisms/VariantProductItem";
import useAppStore from "@/stores/useAppStore";
import BottomSheet from "@gorhom/bottom-sheet";
import GuestModal from "@/features/user/components/guest";
import HomeHeader from "@/components/layout/header/HomeHeader";
import CartHeader from "@/components/layout/header/CartHeader";
import AccountHeader from "@/components/layout/header/AccountHeader";
import CategoryHeader from "@/components/layout/header/CategoryHeader";
import FloatingTabBar, {
  type FloatingTabBarProps,
} from "@/components/layout/tabbar/FloatingTabBar";

export default function Layout() {
  const isRelatedProductsOpen = useAppStore((s) => s.isRelatedProductsOpen);
  const closeRelatedProducts = useAppStore((s) => s.closeRelatedProducts);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        // Tabs are peers — never animate the screen switch itself.
        screenOptions={{
          animation: "none",
          lazy: false,
          freezeOnBlur: true,
        }}
        // The dock overlays content; screens scroll edge-to-edge behind it.
        tabBar={(props) => (
          <FloatingTabBar {...(props as unknown as FloatingTabBarProps)} />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            header: () => <HomeHeader />,
          }}
        />
        <Tabs.Screen
          name="category"
          options={{
            title: "Categories",
            header: () => <CategoryHeader />,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: "Ask AI",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            header: () => <CartHeader />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            header: () => <AccountHeader />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="search-modal"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
      {isRelatedProductsOpen && (
        <CustomBottomSheet onClose={closeRelatedProducts}>
          <VariantProductItem />
        </CustomBottomSheet>
      )}
      <GuestModal />
    </View>
  );
}
