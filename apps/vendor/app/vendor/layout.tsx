import VendorLayout from '@/components/layout/VendorLayout';
import VendorGuard from '@/components/vendor/VendorGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <VendorGuard>
      <VendorLayout>{children}</VendorLayout>
    </VendorGuard>
  );
}
