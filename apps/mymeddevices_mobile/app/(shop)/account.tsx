import React, { useEffect, useState, useCallback } from "react";
import { useTheme } from "@react-navigation/native";
import { View, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import LoadingModal from "@/components/modals/LoadingModal";
import { FLOATING_TABBAR_CLEARANCE } from "@/components/layout/tabbar/FloatingTabBar";
import AccountHeaderCard from "@/features/user/components/AccountHeaderCard";
import AccountNavList from "@/features/user/components/AccountNavList";

const Page = () => {
  const { colors } = useTheme();
  const { logout, isAuthenticated, user, customer, refreshUser, isLoading, isInitialized } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "Account" });
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;

    setRefreshing(true);
    try {
      await refreshUser();
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refreshUser]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingModal visible={isSigningOut} message="Signing out..." />
      <AccountHeaderCard
        user={user}
        customer={customer}
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        isInitialized={isInitialized}
      />
      <ScrollView
        style={{ width: "100%" }}
        contentContainerStyle={{
          paddingBottom: FLOATING_TABBAR_CLEARANCE,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            enabled={isAuthenticated}
          />
        }
      >
        <AccountNavList
          isAuthenticated={isAuthenticated}
          onSignOut={handleSignOut}
        />
      </ScrollView>
    </View>
  );
};

export default Page;

