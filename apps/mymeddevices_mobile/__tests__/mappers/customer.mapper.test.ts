import { mapBackendCustomer } from "@/features/user/services/customer.api";
import { BackendAddress, BackendCustomer } from "@/types/user";

describe("Customer Mapper (mapBackendCustomer)", () => {
  it("correctly maps backend customer and addresses into Customer model", () => {
    const backendCustomer: BackendCustomer = {
      id: "cust-123",
      user_id: "user-456",
      email: "doctor@example.com",
      first_name: "Jane",
      last_name: "Doe",
      phone: "+254712345678",
      avatar_url: "https://example.com/avatar.jpg",
    };

    const addresses: BackendAddress[] = [
      {
        id: "addr-1",
        customer_id: "cust-123",
        type: "shipping",
        first_name: "Jane",
        last_name: "Doe",
        address_line1: "123 Medical Center",
        address_line2: "Suite 4",
        city: "Nairobi",
        state: "Nairobi County",
        postal_code: "00100",
        country: "KE",
        phone: "+254712345678",
        is_default: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "addr-2",
        customer_id: "cust-123",
        type: "billing",
        first_name: "Jane",
        last_name: "Doe",
        address_line1: "456 Hospital Road",
        city: "Mombasa",
        state: "Mombasa County",
        postal_code: "80100",
        country: "KE",
        phone: "+254712345678",
        is_default: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];

    const customer = mapBackendCustomer(backendCustomer, addresses);

    expect(customer.first_name).toBe("Jane");
    expect(customer.last_name).toBe("Doe");
    expect(customer.email).toBe("doctor@example.com");
    expect(customer.avatar_url).toBe("https://example.com/avatar.jpg");

    // Shipping address mapping
    expect(customer.shipping.address_1).toBe("123 Medical Center");
    expect(customer.shipping.address_2).toBe("Suite 4");
    expect(customer.shipping.city).toBe("Nairobi");
    expect(customer.shipping.state).toBe("Nairobi County");
    expect(customer.shipping.postcode).toBe("00100");

    // Billing address mapping
    expect(customer.billing.address_1).toBe("456 Hospital Road");
    expect(customer.billing.city).toBe("Mombasa");
    expect(customer.billing.state).toBe("Mombasa County");
    expect(customer.billing.postcode).toBe("80100");
  });

  it("handles customer without addresses gracefully with safe empty fallbacks", () => {
    const backendCustomer: BackendCustomer = {
      id: "cust-789",
      user_id: "user-789",
      email: "nurse@example.com",
      first_name: "John",
      last_name: "Smith",
    };

    const customer = mapBackendCustomer(backendCustomer, []);

    expect(customer.first_name).toBe("John");
    expect(customer.last_name).toBe("Smith");
    expect(customer.shipping.address_1).toBe("");
    expect(customer.billing.address_1).toBe("");
  });
});
