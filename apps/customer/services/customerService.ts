const defaultCustomer = {
  id: 1,
  email: 'customer@mymeddevices.com',
  first_name: 'Jane',
  last_name: 'Doe',
  role: 'customer',
};

const defaultAddresses = [
  {
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    company: 'Nairobi Hospital',
    address_1: 'Argwings Kodhek Rd',
    address_2: 'Suite 4B',
    city: 'Nairobi',
    state: 'Nairobi County',
    postcode: '00100',
    country: 'KE',
    phone: '+254700000000',
  },
];

export const customerService = {
  getCustomer: async () => {
    return Promise.resolve(defaultCustomer);
  },
  updateCustomer: async (data: any) => {
    console.log('Updating customer profile:', data);
    return Promise.resolve({ success: true });
  },
  getAddresses: async () => {
    return Promise.resolve(defaultAddresses);
  },
  saveAddresses: async (addresses: any) => {
    console.log('Saving addresses:', addresses);
    return Promise.resolve({ success: true });
  },
};
