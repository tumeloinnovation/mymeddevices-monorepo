import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import { toast } from "sonner-native";

import Icon from "@/components/common/Icon";
import { SIZES } from "@/styles/sizes";
import { Colors } from "@/types/app";
import { Product } from "@/types/product";
import { productApi } from "@/features/product/services/product.api";
import { useProductStore } from "@/features/product/stores/useProductStore";
import useCartStore from "@/features/cart/stores/useCartStore";
import useDeliveryLocationStore from "@/stores/useDeliveryLocationStore";
import DeliveryOptionsModal from "@/components/sheets/DeliveryOptionsModal";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  products?: Product[];
  suggestions?: string[];
  showDeliveryButton?: boolean;
}

const INITIAL_SUGGESTIONS = [
  "🩺 Recommend Blood Pressure Monitors",
  "🫁 Best Nebulizers for home use",
  "🔥 Items currently on sale & discounts",
  "🚚 Check delivery fees & speeds",
  "♿ Mobility & Wheelchair options",
  "🩹 Wound care & First aid essentials",
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Hello! 👋 I'm **MedBot**, your shopping assistant. How can I help you find what you need today? You can ask me for product recommendations (like blood pressure monitors or nebulizers), compare items, check current sales, or check delivery fees.",
    timestamp: "Just now",
    suggestions: INITIAL_SUGGESTIONS,
  },
];

export const AiAssistantScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets.top, insets.bottom), [colors, insets.top, insets.bottom]);

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const flatListRef = useRef<FlatList>(null);
  const { setProduct } = useProductStore();
  const { addToCart } = useCartStore();
  const { isDeliveryOptionsOpen, openDeliveryOptions, closeDeliveryOptions, currentLocation } =
    useDeliveryLocationStore();

  useEffect(() => {
    // Scroll to bottom whenever messages update
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
    toast.info("Conversation restarted");
  };

  const handleProductPress = (prod: Product) => {
    setProduct(prod);
    router.push({
      pathname: "/product-view",
      params: { id: prod.id },
    });
  };

  const handleAddToCart = (prod: Product) => {
    addToCart(prod);
    toast.success(`Added ${prod.name} to cart!`);
  };

  const generateBotResponse = async (userQuery: string) => {
    setIsTyping(true);
    const queryLower = userQuery.toLowerCase();

    try {
      // 1. Delivery & Shipping queries
      if (
        queryLower.includes("deliver") ||
        queryLower.includes("shipping") ||
        queryLower.includes("rate") ||
        queryLower.includes("county") ||
        queryLower.includes("fee")
      ) {
        setTimeout(() => {
          setIsTyping(false);
          const botMsg: ChatMessage = {
            id: String(Date.now()),
            sender: "bot",
            text: `We provide fast doorstep delivery across all 47 counties in Kenya!\n\n• **Selected county**: ${currentLocation?.state || "None selected yet"}\n• **Nairobi & Environs**: Same-day or next-day delivery\n• **Other Counties**: Fast delivery within 24 to 48 hours.\n\nTap below to choose or update your delivery county:`,
            timestamp: "Just now",
            showDeliveryButton: true,
            suggestions: [
              "🔥 Items currently on sale",
              "🩺 Recommend Blood Pressure Monitors",
              "🫁 Best Nebulizers for home use",
            ],
          };
          setMessages((prev) => [...prev, botMsg]);
        }, 700);
        return;
      }

      // 2. On sale / Discounts query
      if (
        queryLower.includes("sale") ||
        queryLower.includes("discount") ||
        queryLower.includes("deal") ||
        queryLower.includes("offer")
      ) {
        let saleProducts: Product[] = [];
        try {
          const res = await productApi.getOnSaleProducts();
          saleProducts = res || [];
        } catch {
          // fallback search
          const res = await productApi.getProducts({ per_page: 4 });
          saleProducts = res || [];
        }

        setIsTyping(false);
        const botMsg: ChatMessage = {
          id: String(Date.now()),
          sender: "bot",
          text: `Here are top medical devices currently on special offer and featured for sale in our catalog:`,
          timestamp: "Just now",
          products: saleProducts.slice(0, 4),
          suggestions: [
            "🩺 Compare diagnostic tools",
            "🫁 Show nebulizers",
            "🚚 Check delivery fees",
          ],
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      // 3. Product Search / Specific Medical Inquiry
      let searchKeyword = userQuery
        .replace(/[^\w\s]/gi, "")
        .replace(/(recommend|show|find|best|what|are|the|for|me|in|stock|do|you|have)/gi, "")
        .trim();

      if (!searchKeyword || searchKeyword.length < 2) {
        searchKeyword = userQuery;
      }

      const products = await productApi.getProducts({
        search: searchKeyword,
        per_page: 6,
      });

      let replyText = "";
      if (products && products.length > 0) {
        replyText = `Based on your request for "${userQuery}", here are high-grade medical devices available in our catalog with full certification and warranty:`;
      } else {
        // Fallback popular products
        const fallback = await productApi.getProducts({ per_page: 3 });
        replyText = `I couldn't find exact matches for "${userQuery}", but here are our top-rated medical devices that might meet your healthcare needs:`;
        products.push(...(fallback || []));
      }

      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: String(Date.now()),
        sender: "bot",
        text: replyText,
        timestamp: "Just now",
        products: products.slice(0, 4),
        suggestions: [
          "🚚 Check delivery options",
          "🔥 View on-sale devices",
          "🩺 Ask about another product",
        ],
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setIsTyping(false);
      const botMsg: ChatMessage = {
        id: String(Date.now()),
        sender: "bot",
        text: "I had trouble fetching specific items right now, but feel free to browse our categories or ask about warranty, delivery, and device specifications!",
        timestamp: "Just now",
        suggestions: INITIAL_SUGGESTIONS,
      };
      setMessages((prev) => [...prev, botMsg]);
    }
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: query.trim(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    generateBotResponse(query.trim());
  };

  const renderProductCard = (prod: Product) => (
    <View key={String(prod.id)} style={styles.productCard}>
      <TouchableOpacity
        onPress={() => handleProductPress(prod)}
        activeOpacity={0.8}
        style={styles.productImageContainer}
      >
        <Image
          source={prod.images?.[0]?.src}
          style={styles.productImage}
          contentFit="contain"
          placeholder={require("@/assets/images/placeholder.png")}
        />
      </TouchableOpacity>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {prod.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>KES {prod.price}</Text>
          {prod.regular_price && prod.regular_price !== prod.price && (
            <Text style={styles.regularPrice}>KES {prod.regular_price}</Text>
          )}
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleProductPress(prod)}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => handleAddToCart(prod)}
          >
            <Icon name="cart" size={14} color="#FFFFFF" />
            <Text style={styles.cartButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isBot = item.sender === "bot";

    return (
      <View
        style={[
          styles.messageRow,
          isBot ? styles.botMessageRow : styles.userMessageRow,
        ]}
      >
        {isBot && (
          <View style={styles.botAvatar}>
            <Icon name="bot" size={18} color="#FFFFFF" />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isBot ? styles.botMessageText : styles.userMessageText,
            ]}
          >
            {item.text}
          </Text>

          {/* Delivery button if applicable */}
          {item.showDeliveryButton && (
            <TouchableOpacity
              style={styles.openDeliveryBtn}
              onPress={openDeliveryOptions}
              activeOpacity={0.8}
            >
              <Icon name="location" size={16} color="#FFFFFF" />
              <Text style={styles.openDeliveryBtnText}>
                Choose Delivery Location{currentLocation?.state ? ` (${currentLocation.state})` : ""}
              </Text>
            </TouchableOpacity>
          )}

          {/* Product recommendation horizontal carousel */}
          {item.products && item.products.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {item.products.map(renderProductCard)}
            </ScrollView>
          )}

          {/* Suggestion Chips */}
          {item.suggestions && item.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {item.suggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(sug)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Icon name="bot" size={22} color="#FFFFFF" />
          </View>
          <View>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>MedBot AI Assistant</Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Ask questions about sales, devices & delivery
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearChat}
          accessibilityLabel="Restart conversation"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="refresh" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.botAvatar}>
                <Icon name="bot" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>MedBot is thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: keyboardVisible
              ? Math.max(insets.bottom + 4, 10)
              : Math.max(insets.bottom, 10) + 74,
          },
        ]}
      >
        <TextInput
          style={styles.textInput}
          placeholder="Ask MedBot about any medical device..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            inputText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonInactive,
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
        >
          <Icon name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal
        visible={isDeliveryOptionsOpen}
        onClose={closeDeliveryOptions}
      />
    </KeyboardAvoidingView>
  );
};

export default AiAssistantScreen;

const createStyles = (colors: Colors, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: topInset + 10,
      paddingBottom: 12,
      paddingHorizontal: SIZES.spacingLG,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 3,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    headerTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: SIZES.fontMD,
      fontWeight: "700",
      color: colors.text,
    },
    onlineBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(46, 204, 113, 0.15)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 4,
    },
    onlineDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#2ECC71",
    },
    onlineText: {
      fontSize: 10,
      fontWeight: "600",
      color: "#2ECC71",
    },
    headerSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    clearBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    messagesList: {
      paddingHorizontal: SIZES.spacingMD,
      paddingVertical: SIZES.spacingMD,
      gap: 14,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginVertical: 4,
    },
    botMessageRow: {
      justifyContent: "flex-start",
    },
    userMessageRow: {
      justifyContent: "flex-end",
    },
    botAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    bubble: {
      maxWidth: "84%",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    botBubble: {
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    messageText: {
      fontSize: SIZES.fontSM,
      lineHeight: 20,
    },
    botMessageText: {
      color: colors.text,
    },
    userMessageText: {
      color: "#FFFFFF",
      fontWeight: "500",
    },
    openDeliveryBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 10,
      gap: 6,
      alignSelf: "flex-start",
    },
    openDeliveryBtnText: {
      color: "#FFFFFF",
      fontWeight: "600",
      fontSize: 12,
    },
    productsScroll: {
      paddingVertical: 10,
      gap: 10,
    },
    productCard: {
      width: 160,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    productImageContainer: {
      width: "100%",
      height: 100,
      borderRadius: 8,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    productImage: {
      width: "90%",
      height: "90%",
    },
    productInfo: {
      gap: 4,
    },
    productName: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      minHeight: 32,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    productPrice: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
    },
    regularPrice: {
      fontSize: 11,
      color: colors.textSecondary,
      textDecorationLine: "line-through",
    },
    productActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    viewButton: {
      flex: 1,
      paddingVertical: 5,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
    },
    viewButtonText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
    },
    cartButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
      paddingVertical: 5,
      borderRadius: 6,
      gap: 4,
    },
    cartButtonText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    suggestionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    suggestionChip: {
      backgroundColor: "rgba(255, 111, 97, 0.08)",
      borderWidth: 1,
      borderColor: "rgba(255, 111, 97, 0.25)",
      borderRadius: 16,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    suggestionText: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.primary,
    },
    typingContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginVertical: 6,
    },
    typingBubble: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 16,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    typingText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    inputBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: SIZES.spacingMD,
      paddingTop: 8,
      paddingBottom: Math.max(bottomInset + 4, 12),
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 8,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 22,
      height: 44,
      paddingHorizontal: 16,
      fontSize: SIZES.fontSM,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonActive: {
      backgroundColor: colors.primary,
    },
    sendButtonInactive: {
      backgroundColor: colors.border,
      opacity: 0.6,
    },
  });
