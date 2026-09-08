import { parseGoogleAddress } from "@/utils/googlePlaces";

describe("parseGoogleAddress", () => {
  it("should return fallback defaults when details and data are empty", () => {
    const result = parseGoogleAddress(null);
    expect(result).toEqual({
      address_1: "",
      city: "Nairobi",
      state: "Nairobi",
      country: "KE",
      postcode: "00100",
      formattedAddress: "",
      region: "Nairobi",
      lat: undefined,
      lng: undefined,
    });
  });

  it("should correctly parse Google Place address components", () => {
    const mockDetails = {
      formatted_address: "123 Kimathi St, Nairobi, Kenya",
      address_components: [
        { long_name: "123", types: ["street_number"] },
        { long_name: "Kimathi St", types: ["route"] },
        { long_name: "Nairobi", types: ["locality"] },
        { long_name: "Nairobi County", types: ["administrative_area_level_1"] },
        { long_name: "Kenya", types: ["country"] },
        { long_name: "00100", types: ["postal_code"] },
      ],
      geometry: {
        location: {
          lat: -1.286389,
          lng: 36.817223,
        },
      },
    };

    const result = parseGoogleAddress(mockDetails);

    expect(result.address_1).toBe("123 Kimathi St");
    expect(result.city).toBe("Nairobi");
    expect(result.state).toBe("Nairobi County");
    expect(result.region).toBe("Nairobi");
    expect(result.country).toBe("Kenya");
    expect(result.postcode).toBe("00100");
    expect(result.formattedAddress).toBe("123 Kimathi St, Nairobi, Kenya");
    expect(result.lat).toBe(-1.286389);
    expect(result.lng).toBe(36.817223);
  });

  it("should fallback to data description when details formatted_address is missing", () => {
    const mockData = { description: "Kenyatta Ave, Nairobi" };
    const result = parseGoogleAddress({}, mockData);

    expect(result.formattedAddress).toBe("Kenyatta Ave, Nairobi");
    expect(result.address_1).toBe("Kenyatta Ave, Nairobi");
  });
});
