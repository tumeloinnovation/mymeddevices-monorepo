import { Linking, Share, Platform } from "react-native";

const WHATSAPP_PHONE = "254735239696";

const shareLink = async () => {
  await Share.share({
    message:
      "Discover the best home-based medical devices with MyMedDevices! Compare, save, and improve your health with our advised, affordable solutions. Download now and take control of your wellness: https://play.google.com/store/apps/details?id=com.tumeloinnovations.my_med_devices",
  });
};

const handleSocialMedia = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web browser
      await Linking.openURL(url);
    }
  } catch (err) {
    console.error("An error occurred", err);
  }
};

const openWhatsApp = async (customMessage?: string) => {
  const defaultMessage = `MyMedDevices\nHello! I'm interested in your medical devices. Can you help me?`;
  const message = encodeURIComponent(customMessage || defaultMessage);
  
  // Try to open WhatsApp app first
  const whatsappAppUrl = `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${message}`;
  const whatsappWebUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${message}`;
  
  try {
    const canOpenApp = await Linking.canOpenURL(whatsappAppUrl);
    if (canOpenApp) {
      await Linking.openURL(whatsappAppUrl);
    } else {
      await Linking.openURL(whatsappWebUrl);
    }
  } catch (err) {
    console.error("Failed to open WhatsApp", err);
    await Linking.openURL(whatsappWebUrl);
  }
};

const openWhatsAppOrderHistory = async () => {
  const message = `MyMedDevices\nHello! I'd like to check on my previous orders. Can you help me with my order history?`;
  await openWhatsApp(message);
};

// Social media links with app deep links where possible
const socialLinks = {
  instagram: {
    url: "instagram://user?username=mymedevices",
    webUrl: "https://www.instagram.com/mymedevices/",
    label: "Instagram",
  },
  facebook: {
    url: "fb://profile/61581546818170",
    webUrl: "https://www.facebook.com/profile.php?id=61581546818170",
    label: "Facebook",
  },
  x: {
    url: "twitter://user?screen_name=mymeddevicesltd",
    webUrl: "https://twitter.com/mymeddevicesltd",
    label: "X",
  },
  tiktok: {
    url: "https://vm.tiktok.com/ZMA3sMq5S/",
    webUrl: "https://vm.tiktok.com/ZMA3sMq5S/",
    label: "TikTok",
  },
  whatsapp: {
    url: `whatsapp://send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent("MyMedDevices\nHello! I'm interested in your medical devices. Can you help me?")}`,
    webUrl: `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent("MyMedDevices\nHello! I'm interested in your medical devices. Can you help me?")}`,
    label: "WhatsApp",
  },
  linkedin: {
    url: "linkedin://company/my-med-device-ltd",
    webUrl: "https://www.linkedin.com/company/my-med-device-ltd/",
    label: "LinkedIn",
  },
  youtube: {
    url: "youtube://@mymeddevices",
    webUrl: "https://www.youtube.com/@mymeddevices",
    label: "YouTube",
  },
};

const openSocialMedia = async (platform: keyof typeof socialLinks) => {
  const social = socialLinks[platform];
  
  try {
    // Try app deep link first
    const canOpenApp = await Linking.canOpenURL(social.url);
    if (canOpenApp) {
      await Linking.openURL(social.url);
    } else {
      // Fallback to web URL
      await Linking.openURL(social.webUrl);
    }
  } catch (err) {
    console.error(`Failed to open ${platform}`, err);
    await Linking.openURL(social.webUrl);
  }
};

export { 
  shareLink, 
  openWhatsApp, 
  openWhatsAppOrderHistory, 
  openSocialMedia 
};

