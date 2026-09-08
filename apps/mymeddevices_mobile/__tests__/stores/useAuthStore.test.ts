import { mergeCustomerIntoUser, useAuthStore } from "@/stores/useAuthStore";
import { AuthUser } from "@/types/auth";
import { Customer } from "@/types/user";

describe("Auth Store (useAuthStore)", () => {
  beforeEach(() => {
    useAuthStore.getState().resetAuthState();
  });

  it("mergeCustomerIntoUser merges customer data into user object", () => {
    const user: AuthUser = {
      id: 1,
      username: "john_doe",
      email: "john@example.com",
      display_name: "John Doe",
      first_name: "John",
      last_name: "Doe",
      roles: ["customer"],
    };

    const customer: Customer = {
      id: 1,
      email: "john@example.com",
      first_name: "John",
      last_name: "Doe",
      username: "john_doe",
      avatar_url: "https://example.com/avatar.png",
      shipping: {
        address_1: "789 Medical Lane",
        city: "Nairobi",
      },
      billing: {
        address_1: "789 Medical Lane",
        city: "Nairobi",
      },
    };

    const merged = mergeCustomerIntoUser(user, customer);

    expect(merged.avatar_url).toBe("https://example.com/avatar.png");
    expect(merged.shipping?.address_1).toBe("789 Medical Lane");
    expect(merged.billing?.city).toBe("Nairobi");
  });

  it("sets user and authenticated status correctly", () => {
    const store = useAuthStore.getState();
    const user: AuthUser = {
      id: 2,
      username: "jane",
      email: "jane@example.com",
      display_name: "Jane",
      roles: ["customer"],
    };

    store.setUser(user);

    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    store.resetAuthState();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
