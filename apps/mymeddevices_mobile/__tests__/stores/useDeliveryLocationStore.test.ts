import useDeliveryLocationStore, {
  DeliveryLocation,
} from "@/stores/useDeliveryLocationStore";

describe("useDeliveryLocationStore", () => {
  beforeEach(() => {
    useDeliveryLocationStore.setState({
      currentLocation: {
        code: "KE30",
        state: "Nairobi County",
        price: 200,
        formattedAddress: "Nairobi, Kenya",
        label: "Nairobi County",
      },
      savedAddresses: [],
      isDeliveryOptionsOpen: false,
    });
  });

  it("initializes with default location and open/close controls", () => {
    const store = useDeliveryLocationStore.getState();
    expect(store.currentLocation?.state).toBe("Nairobi County");
    expect(store.savedAddresses.length).toBe(0);
    expect(store.isDeliveryOptionsOpen).toBe(false);

    store.openDeliveryOptions();
    expect(useDeliveryLocationStore.getState().isDeliveryOptionsOpen).toBe(true);

    store.closeDeliveryOptions();
    expect(useDeliveryLocationStore.getState().isDeliveryOptionsOpen).toBe(false);
  });

  it("updates current location and auto-saves new address", () => {
    const store = useDeliveryLocationStore.getState();
    const newLocation: DeliveryLocation = {
      id: "loc-mombasa",
      code: "KE28",
      state: "Mombasa",
      price: 800,
      formattedAddress: "Nyali, Mombasa, Kenya",
      label: "Mombasa",
    };

    store.setDeliveryLocation(newLocation);
    const updated = useDeliveryLocationStore.getState();

    expect(updated.currentLocation?.state).toBe("Mombasa");
    expect(updated.currentLocation?.price).toBe(800);
    expect(updated.savedAddresses.length).toBe(1);
    expect(updated.savedAddresses[0].formattedAddress).toBe("Nyali, Mombasa, Kenya");
  });

  it("adds a saved address directly", () => {
    const store = useDeliveryLocationStore.getState();
    const customAddress: DeliveryLocation = {
      id: "loc-kisumu",
      code: "KE17",
      state: "Kisumu",
      price: 650,
      formattedAddress: "Milimani, Kisumu, Kenya",
      label: "Kisumu Office",
    };

    store.addSavedAddress(customAddress);
    const updated = useDeliveryLocationStore.getState();

    expect(updated.savedAddresses.length).toBe(1);
    expect(updated.currentLocation?.state).toBe("Kisumu");
  });

  it("removes a saved address and falls back safely", () => {
    const store = useDeliveryLocationStore.getState();
    const customAddress: DeliveryLocation = {
      id: "loc-nakuru",
      code: "KE31",
      state: "Nakuru",
      price: 500,
      formattedAddress: "Milimani, Nakuru, Kenya",
      label: "Nakuru Clinic",
    };

    store.addSavedAddress(customAddress);
    expect(useDeliveryLocationStore.getState().savedAddresses.length).toBe(1);

    store.removeSavedAddress("loc-nakuru");
    const updated = useDeliveryLocationStore.getState();
    expect(updated.savedAddresses.some((a) => a.id === "loc-nakuru")).toBe(false);
    expect(updated.savedAddresses.length).toBe(0);
    expect(updated.currentLocation).toBeNull();
  });
});
