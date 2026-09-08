import { setSecureItem, getSecureItem, deleteSecureItem } from "@/utils/tokenStorage";

const BIOMETRIC_ENABLED_KEY = "biometric_auth_enabled";
const SAVED_BIOMETRIC_CREDENTIALS_KEY = "biometric_saved_credentials";

export interface BiometricCredentials {
  email: string;
  password?: string;
  refreshToken?: string;
}

export interface BiometricCapability {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: number[];
  biometricLabel: string;
}

// Safely obtain LocalAuthentication only when native module is compiled into the runtime
let localAuthModule: typeof import("expo-local-authentication") | null = null;
const getLocalAuth = (): typeof import("expo-local-authentication") | null => {
  if (localAuthModule) return localAuthModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    localAuthModule = require("expo-local-authentication");
    return localAuthModule;
  } catch {
    return null;
  }
};

class BiometricService {
  /**
   * Check device capability for biometric authentication (Face ID, Touch ID, Fingerprint)
   * Safely returns false if native module is not linked or not present in current binary.
   */
  async getCapabilities(): Promise<BiometricCapability> {
    try {
      const LocalAuth = getLocalAuth();
      if (!LocalAuth) {
        return {
          hasHardware: false,
          isEnrolled: false,
          supportedTypes: [],
          biometricLabel: "Biometrics",
        };
      }

      const hasHardware = await LocalAuth.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuth.isEnrolledAsync() : false;
      const supportedTypes = hasHardware
        ? await LocalAuth.supportedAuthenticationTypesAsync()
        : [];

      let biometricLabel = "Biometrics";
      // 2 = FACIAL_RECOGNITION, 1 = FINGERPRINT, 3 = IRIS
      if (supportedTypes.includes(2)) {
        biometricLabel = "Face ID";
      } else if (supportedTypes.includes(1)) {
        biometricLabel = "Fingerprint";
      } else if (supportedTypes.includes(3)) {
        biometricLabel = "Iris Recognition";
      }

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        biometricLabel,
      };
    } catch {
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        biometricLabel: "Biometrics",
      };
    }
  }

  /**
   * Check whether the user has explicitly turned on biometric quick login
   */
  async isBiometricEnabled(): Promise<boolean> {
    const val = await getSecureItem(BIOMETRIC_ENABLED_KEY);
    return val === "true";
  }

  /**
   * Enable or disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean, credentials?: BiometricCredentials): Promise<boolean> {
    if (enabled) {
      const auth = await this.authenticate("Confirm biometric activation for MyMedDevices");
      if (!auth.success) return false;

      await setSecureItem(BIOMETRIC_ENABLED_KEY, "true");
      if (credentials) {
        await setSecureItem(SAVED_BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(credentials));
      }
      return true;
    } else {
      await deleteSecureItem(BIOMETRIC_ENABLED_KEY);
      await deleteSecureItem(SAVED_BIOMETRIC_CREDENTIALS_KEY);
      return true;
    }
  }

  /**
   * Perform biometric challenge prompt
   */
  async authenticate(promptMessage = "Authenticate to access MyMedDevices"): Promise<{ success: boolean; error?: string }> {
    try {
      const LocalAuth = getLocalAuth();
      if (!LocalAuth) {
        return { success: false, error: "not_available" };
      }

      const result = await LocalAuth.authenticateAsync({
        promptMessage,
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      return result;
    } catch {
      return { success: false, error: "authentication_failed" };
    }
  }

  /**
   * Retrieve securely stored biometric login credentials
   */
  async getSavedCredentials(): Promise<BiometricCredentials | null> {
    const isEnabled = await this.isBiometricEnabled();
    if (!isEnabled) return null;

    const credsStr = await getSecureItem(SAVED_BIOMETRIC_CREDENTIALS_KEY);
    if (!credsStr) return null;

    try {
      return JSON.parse(credsStr) as BiometricCredentials;
    } catch {
      return null;
    }
  }
}

export const biometricService = new BiometricService();
export default biometricService;
