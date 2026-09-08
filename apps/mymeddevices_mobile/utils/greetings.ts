import { getHours } from "date-fns";

export const getGreeting = (): string => {
  const hours = getHours(new Date());

  if (hours < 12) {
    return "Good Morning";
  } else if (hours < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
};
