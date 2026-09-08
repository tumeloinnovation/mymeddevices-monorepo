import React from "react";
import { router } from "expo-router";
import SearchContent from "@/features/search/components/SearchContent";

const Page = () => {
  return <SearchContent onClose={() => router.back()} autoFocus />;
};

export default Page;
