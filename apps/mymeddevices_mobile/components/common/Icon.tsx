import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import type { LucideIcon } from "lucide-react-native";

import ArrowDownWideNarrow from "lucide-react-native/icons/arrow-down-wide-narrow";
import ArrowUpNarrowWide from "lucide-react-native/icons/arrow-up-narrow-wide";
import ArrowLeftRight from "lucide-react-native/icons/arrow-left-right";
import BadgeCheck from "lucide-react-native/icons/badge-check";
import Bell from "lucide-react-native/icons/bell";
import BellRing from "lucide-react-native/icons/bell-ring";
import ChevronDown from "lucide-react-native/icons/chevron-down";
import ChevronLeft from "lucide-react-native/icons/chevron-left";
import ChevronRight from "lucide-react-native/icons/chevron-right";
import ChevronUp from "lucide-react-native/icons/chevron-up";
import Check from "lucide-react-native/icons/check";
import CircleAlert from "lucide-react-native/icons/circle-alert";
import CircleCheck from "lucide-react-native/icons/circle-check";
import CircleQuestionMark from "lucide-react-native/icons/circle-question-mark";
import CircleUserRound from "lucide-react-native/icons/circle-user-round";
import CircleX from "lucide-react-native/icons/circle-x";
import Clock from "lucide-react-native/icons/clock";
import Eye from "lucide-react-native/icons/eye";
import EyeOff from "lucide-react-native/icons/eye-off";
import Funnel from "lucide-react-native/icons/funnel";
import HandCoins from "lucide-react-native/icons/hand-coins";
import Heart from "lucide-react-native/icons/heart";
import House from "lucide-react-native/icons/house";
import Info from "lucide-react-native/icons/info";
import List from "lucide-react-native/icons/list";
import ListChecks from "lucide-react-native/icons/list-checks";
import LogIn from "lucide-react-native/icons/log-in";
import LogOut from "lucide-react-native/icons/log-out";
import Lock from "lucide-react-native/icons/lock";
import Mail from "lucide-react-native/icons/mail";
import MapPin from "lucide-react-native/icons/map-pin";
import Minus from "lucide-react-native/icons/minus";
import Moon from "lucide-react-native/icons/moon";
import Pencil from "lucide-react-native/icons/pencil";
import Phone from "lucide-react-native/icons/phone";
import Plus from "lucide-react-native/icons/plus";
import ReceiptText from "lucide-react-native/icons/receipt-text";
import RefreshCw from "lucide-react-native/icons/refresh-cw";
import Repeat2 from "lucide-react-native/icons/repeat-2";
import Search from "lucide-react-native/icons/search";
import ShieldCheck from "lucide-react-native/icons/shield-check";
import ShoppingBag from "lucide-react-native/icons/shopping-bag";
import ShoppingCart from "lucide-react-native/icons/shopping-cart";
import Smartphone from "lucide-react-native/icons/smartphone";
import Star from "lucide-react-native/icons/star";
import Sun from "lucide-react-native/icons/sun";
import Trash2 from "lucide-react-native/icons/trash-2";
import Truck from "lucide-react-native/icons/truck";
import User from "lucide-react-native/icons/user";
import Users from "lucide-react-native/icons/users";
import Wifi from "lucide-react-native/icons/wifi";
import WifiOff from "lucide-react-native/icons/wifi-off";
import X from "lucide-react-native/icons/x";
import Zap from "lucide-react-native/icons/zap";
import Share from "lucide-react-native/icons/share";
import ImageOff from "lucide-react-native/icons/image-off";
import Award from "lucide-react-native/icons/award";
import Stethoscope from "lucide-react-native/icons/stethoscope";
import Activity from "lucide-react-native/icons/activity";
import Droplet from "lucide-react-native/icons/droplet";
import HeartPulse from "lucide-react-native/icons/heart-pulse";
import TestTube from "lucide-react-native/icons/test-tube";
import Scale from "lucide-react-native/icons/scale";
import Wind from "lucide-react-native/icons/wind";
import Gauge from "lucide-react-native/icons/gauge";
import Flame from "lucide-react-native/icons/flame";
import Accessibility from "lucide-react-native/icons/accessibility";
import Footprints from "lucide-react-native/icons/footprints";
import Snowflake from "lucide-react-native/icons/snowflake";
import Watch from "lucide-react-native/icons/watch";
import ChartPie from "lucide-react-native/icons/chart-pie";
import Scan from "lucide-react-native/icons/scan";
import Bed from "lucide-react-native/icons/bed";
import Layers from "lucide-react-native/icons/layers";
import Package from "lucide-react-native/icons/package";
import Cross from "lucide-react-native/icons/cross";
import Baby from "lucide-react-native/icons/baby";
import Sparkles from "lucide-react-native/icons/sparkles";
import Thermometer from "lucide-react-native/icons/thermometer";
import Bot from "lucide-react-native/icons/bot";
import BotMessageSquare from "lucide-react-native/icons/bot-message-square";
import Send from "lucide-react-native/icons/send";
import SendHorizontal from "lucide-react-native/icons/send-horizontal";
import MessageSquare from "lucide-react-native/icons/message-square";
import Camera from "lucide-react-native/icons/camera";
import Building2 from "lucide-react-native/icons/building-2";
import Briefcase from "lucide-react-native/icons/briefcase";
import CreditCard from "lucide-react-native/icons/credit-card";
import FileText from "lucide-react-native/icons/file-text";
import RotateCcw from "lucide-react-native/icons/rotate-ccw";
import Settings from "lucide-react-native/icons/settings";
import Tag from "lucide-react-native/icons/tag";
import Tags from "lucide-react-native/icons/tags";

type LucideEntry = {
  set: "lucide";
  Icon: LucideIcon;
  /** Fill the icon shape with `color` (for solid / filled variants). */
  filled?: boolean;
};

type FaEntry = { set: "fa6"; name: string };

// Brand logos use FontAwesome6; UI icons use Lucide.
export const ICON_MAP = {
  // --- Canonical Names ---
  "cart": { set: "lucide", Icon: ShoppingCart },
  "shopping-cart": { set: "lucide", Icon: ShoppingCart },
  "shopping-bag": { set: "lucide", Icon: ShoppingBag },
  "bag": { set: "lucide", Icon: ShoppingBag },
  "heart": { set: "lucide", Icon: Heart },
  "heart-filled": { set: "lucide", Icon: Heart, filled: true },
  "star": { set: "lucide", Icon: Star },
  "star-filled": { set: "lucide", Icon: Star, filled: true },
  "user": { set: "lucide", Icon: User },
  "user-filled": { set: "lucide", Icon: User, filled: true },
  "user-round": { set: "lucide", Icon: CircleUserRound },
  "users": { set: "lucide", Icon: Users },
  "search": { set: "lucide", Icon: Search },
  "home": { set: "lucide", Icon: House },
  "bell": { set: "lucide", Icon: Bell },
  "bell-ring": { set: "lucide", Icon: BellRing },
  "lock": { set: "lucide", Icon: Lock },
  "map-pin": { set: "lucide", Icon: MapPin },
  "location": { set: "lucide", Icon: MapPin },
  "shield-check": { set: "lucide", Icon: ShieldCheck },
  "badge-check": { set: "lucide", Icon: BadgeCheck },
  "check": { set: "lucide", Icon: Check },
  "check-circle": { set: "lucide", Icon: CircleCheck },
  "check-list": { set: "lucide", Icon: ListChecks },
  "pencil": { set: "lucide", Icon: Pencil },
  "edit": { set: "lucide", Icon: Pencil },
  "mail": { set: "lucide", Icon: Mail },
  "email": { set: "lucide", Icon: Mail },
  "chevron-left": { set: "lucide", Icon: ChevronLeft },
  "chevron-right": { set: "lucide", Icon: ChevronRight },
  "chevron-down": { set: "lucide", Icon: ChevronDown },
  "chevron-up": { set: "lucide", Icon: ChevronUp },
  "arrow-left": { set: "lucide", Icon: ChevronLeft },
  "arrow-right": { set: "lucide", Icon: ChevronRight },
  "arrow-left-right": { set: "lucide", Icon: ArrowLeftRight },
  "plus": { set: "lucide", Icon: Plus },
  "minus": { set: "lucide", Icon: Minus },
  "close": { set: "lucide", Icon: X },
  "x": { set: "lucide", Icon: X },
  "trash": { set: "lucide", Icon: Trash2 },
  "trash-2": { set: "lucide", Icon: Trash2 },
  "trash-filled": { set: "lucide", Icon: Trash2, filled: true },
  "refresh": { set: "lucide", Icon: RefreshCw },
  "repeat": { set: "lucide", Icon: Repeat2 },
  "rotate-ccw": { set: "lucide", Icon: RotateCcw },
  "tag": { set: "lucide", Icon: Tag },
  "tags": { set: "lucide", Icon: Tags },
  "filter": { set: "lucide", Icon: Funnel },
  "sort": { set: "lucide", Icon: ArrowDownWideNarrow },
  "sort-desc": { set: "lucide", Icon: ArrowDownWideNarrow },
  "sort-high-low": { set: "lucide", Icon: ArrowDownWideNarrow },
  "sort-asc": { set: "lucide", Icon: ArrowUpNarrowWide },
  "sort-low-high": { set: "lucide", Icon: ArrowUpNarrowWide },
  "list": { set: "lucide", Icon: List },
  "settings": { set: "lucide", Icon: Settings },
  "gear": { set: "lucide", Icon: Settings },
  "phone": { set: "lucide", Icon: Phone },
  "moon": { set: "lucide", Icon: Moon },
  "sun": { set: "lucide", Icon: Sun },
  "truck": { set: "lucide", Icon: Truck },
  "wifi": { set: "lucide", Icon: Wifi },
  "wifi-off": { set: "lucide", Icon: WifiOff },
  "fingerprint": { set: "fa6" as const, name: "fingerprint" },
  "biometrics": { set: "fa6" as const, name: "fingerprint" },
  "face-id": { set: "lucide", Icon: Scan },
  "eye": { set: "lucide", Icon: Eye },
  "eye-off": { set: "lucide", Icon: EyeOff },
  "login": { set: "lucide", Icon: LogIn },
  "logout": { set: "lucide", Icon: LogOut },
  "share": { set: "lucide", Icon: Share },
  "award": { set: "lucide", Icon: Award },
  "image-off": { set: "lucide", Icon: ImageOff },
  "info": { set: "lucide", Icon: Info },
  "help": { set: "lucide", Icon: CircleQuestionMark },
  "alert": { set: "lucide", Icon: CircleAlert },
  "alert-circle": { set: "lucide", Icon: CircleAlert },
  "x-circle": { set: "lucide", Icon: CircleX },
  "circle-x": { set: "lucide", Icon: CircleX },
  "clock": { set: "lucide", Icon: Clock },
  "time": { set: "lucide", Icon: Clock },
  "smartphone": { set: "lucide", Icon: Smartphone },
  "zap": { set: "lucide", Icon: Zap },
  "receipt": { set: "lucide", Icon: ReceiptText },
  "hand-coins": { set: "lucide", Icon: HandCoins },
  "bot": { set: "lucide", Icon: Bot },
  "bot-message-square": { set: "lucide", Icon: BotMessageSquare },
  "send": { set: "lucide", Icon: Send },
  "send-horizontal": { set: "lucide", Icon: SendHorizontal },
  "message-square": { set: "lucide", Icon: MessageSquare },
  "chat": { set: "lucide", Icon: MessageSquare },
  "camera": { set: "lucide", Icon: Camera },
  "building": { set: "lucide", Icon: Building2 },
  "hospital": { set: "lucide", Icon: Building2 },
  "briefcase": { set: "lucide", Icon: Briefcase },
  "credit-card": { set: "lucide", Icon: CreditCard },
  "file-text": { set: "lucide", Icon: FileText },

  // --- Medical & Category Icons ---
  "stethoscope": { set: "lucide", Icon: Stethoscope },
  "activity": { set: "lucide", Icon: Activity },
  "thermometer": { set: "lucide", Icon: Thermometer },
  "droplet": { set: "lucide", Icon: Droplet },
  "heart-pulse": { set: "lucide", Icon: HeartPulse },
  "test-tube": { set: "lucide", Icon: TestTube },
  "scale": { set: "lucide", Icon: Scale },
  "wind": { set: "lucide", Icon: Wind },
  "lungs": { set: "lucide", Icon: Wind },
  "gauge": { set: "lucide", Icon: Gauge },
  "flame": { set: "lucide", Icon: Flame },
  "accessibility": { set: "lucide", Icon: Accessibility },
  "footprints": { set: "lucide", Icon: Footprints },
  "snowflake": { set: "lucide", Icon: Snowflake },
  "watch": { set: "lucide", Icon: Watch },
  "pie-chart": { set: "lucide", Icon: ChartPie },
  "chart-pie": { set: "lucide", Icon: ChartPie },
  "scan": { set: "lucide", Icon: Scan },
  "bed": { set: "lucide", Icon: Bed },
  "cylinder": { set: "lucide", Icon: Package },
  "layers": { set: "lucide", Icon: Layers },
  "package": { set: "lucide", Icon: Package },
  "cross": { set: "lucide", Icon: Cross },
  "bandage": { set: "lucide", Icon: ShieldCheck },
  "baby": { set: "lucide", Icon: Baby },
  "sparkles": { set: "lucide", Icon: Sparkles },

  // --- Brand Logos ---
  "facebook": { set: "fa6" as const, name: "facebook-f" },
  "instagram": { set: "fa6" as const, name: "instagram" },
  "linkedin": { set: "fa6" as const, name: "linkedin-in" },
  "tiktok": { set: "fa6" as const, name: "tiktok" },
  "whatsapp": { set: "fa6" as const, name: "whatsapp" },
  "twitter": { set: "fa6" as const, name: "x-twitter" },
  "x-twitter": { set: "fa6" as const, name: "x-twitter" },
  "youtube": { set: "fa6" as const, name: "youtube" },
} as const;

export type IconName = keyof typeof ICON_MAP;

export type IconProps = {
  name: IconName | (string & {});
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = "#000",
  strokeWidth,
  style,
}) => {
  const entry = (ICON_MAP as Record<string, LucideEntry | FaEntry>)[name];

  if (!entry) {
    if (__DEV__) {
      console.warn(`[Icon] Unknown icon "${name}", rendering fallback.`);
    }
    return (
      <CircleQuestionMark size={size} color={color} style={style} />
    );
  }

  if (entry.set === "fa6") {
    return <FontAwesome6 name={entry.name} size={size} color={color} style={style} />;
  }

  return (
    <entry.Icon
      size={size}
      color={color}
      fill={entry.filled ? color : "none"}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

export default Icon;
