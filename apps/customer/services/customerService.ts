import { mockCustomer, mockAddresses } from '@/lib/seed-data';

export const customerService = {
  getCustomer: async () => {
    return Promise.resolve(mockCustomer);
  },
  updateCustomer: async (data: any) => {
    console.log('Updating customer profile:', data);
    return Promise.resolve({ success: true });
  },
  getAddresses: async () => {
    return Promise.resolve(mockAddresses);
  },
  saveAddresses: async (addresses: any) => {
    console.log('Saving addresses:', addresses);
    return Promise.resolve({ success: true });
  },
};
