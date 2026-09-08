import { parseISO, formatDistanceToNow } from "date-fns";

export const formatTimeAgo = (isoString: string): string => {
  const date = parseISO(isoString);
  return formatDistanceToNow(date, { addSuffix: true });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("KES", "Ksh.");
};
