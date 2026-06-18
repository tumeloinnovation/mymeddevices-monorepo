# Phase 3: Product & Catalog Management

This phase enables vendors to manage their product offerings with comprehensive tools for listing, creating, editing, and organizing products.

## Overview

Phase 3 provides vendors with full control over their product catalog. This includes creating new products, managing existing ones, handling product images, variants, and organizing products by categories. A well-designed product management system is critical for vendor success.

---

## 3.1 Product Management

### Routes
- `/vendor/products` - Product listing
- `/vendor/products/new` - Create product
- `/vendor/products/[id]` - Product details
- `/vendor/products/[id]/edit` - Edit product
- `/vendor/products/bulk-edit` - Bulk edit products

### Current Status
- ✅ Basic data table with search, filters, and pagination
- ✅ Bulk actions integrated into row actions
- ✅ Status badges (Active, Out of Stock, Draft)
- ⏳ Product creation form with validation
- ⏳ Media uploader with UI
- ⏳ Category and status selection
- ⏳ Variant management

### Remaining Tasks

#### Product Listing Page
**File:** `apps/vendor-web/app/vendor/products/page.tsx`

```tsx
export default function ProductsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Manage your product catalog"
          action={
            <Button onClick={() => navigate('/vendor/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          }
        />

        {/* Filters */}
        <ProductFilters />

        {/* Data Table */}
        <ProductsTable />
      </div>
    </VendorLayout>
  );
}
```

#### Product Filters Component
**File:** `apps/vendor-web/app/vendor/products/components/ProductFilters.tsx`

```tsx
interface ProductFiltersProps {
  filters: ProductFilterState;
  onFiltersChange: (filters: ProductFilterState) => void;
  onReset: () => void;
}

interface ProductFilterState {
  search: string;
  status: ProductStatus[];
  categories: string[];
  priceRange?: { min: number; max: number };
  stockStatus: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy: 'name' | 'created' | 'price' | 'stock' | 'sales';
  sortOrder: 'asc' | 'desc';
}
```

**Features:**
- Text search (name, SKU)
- Status multi-select (Active, Draft, Archived)
- Category multi-select with nested display
- Price range slider
- Stock status dropdown
- Sort options
- Active filters display with remove buttons
- Save filter presets

#### Products Table Component
**File:** `apps/vendor-web/app/vendor/products/components/ProductsTable.tsx`

```tsx
interface ProductsTableProps {
  products: Product[];
  loading?: boolean;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onBulkAction: (action: string, productIds: string[]) => void;
  onProductClick: (productId: string) => void;
}

// Table columns
const columns = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox {...{ checked: table.getIsAllRowsSelected(), onChange: table.getToggleAllRowsSelectedHandler() }} />,
    cell: ({ row }) => <Checkbox {...{ checked: row.getIsSelected(), onChange: row.getToggleSelectedHandler() }} />,
  },
  {
    id: 'product',
    header: 'Product',
    cell: ({ row }) => (
      <ProductCell
        name={row.original.name}
        sku={row.original.sku}
        image={row.original.images[0]}
        variants={row.original.variants}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
  },
  {
    id: 'stock',
    header: 'Stock',
    cell: ({ row }) => (
      <StockDisplay
        level={row.original.stock_level}
        threshold={row.original.low_stock_threshold}
        trackInventory={row.original.track_inventory}
      />
    ),
  },
  {
    id: 'price',
    header: 'Price',
    cell: ({ row }) => (
      <PriceDisplay
        price={row.original.price}
        compareAtPrice={row.original.compare_at_price}
      />
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category_name,
  },
  {
    id: 'created',
    header: 'Created',
    cell: ({ row }) => formatDate(row.original.created_at),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <ProductActionsMenu
        productId={row.original.id}
        onEdit={() => navigate(`/vendor/products/${row.original.id}/edit`)}
        onDuplicate={() => handleDuplicate(row.original.id)}
        onDelete={() => handleDelete(row.original.id)}
        onToggleStatus={() => handleToggleStatus(row.original)}
      />
    ),
  },
];
```

**Features:**
- Checkbox for bulk selection
- Sortable columns
- Product thumbnail + name + SKU display
- Variant count indicator
- Status badges with colors
- Stock level with visual indicator
- Price with compare-at-price strike-through
- Relative date display
- Row actions menu
- Infinite scroll or pagination

#### Product Cell Components

**ProductCell.tsx**
```tsx
interface ProductCellProps {
  name: string;
  sku: string;
  image?: ProductImage;
  variants?: ProductVariant[];
  onClick?: () => void;
}
```

**StockDisplay.tsx**
```tsx
interface StockDisplayProps {
  level: number;
  threshold: number;
  trackInventory: boolean;
}

// Visual indicators
// - Green: In stock (above threshold)
// - Orange: Low stock (at or below threshold)
// - Red: Out of stock
// - Gray: Not tracking inventory
```

**PriceDisplay.tsx**
```tsx
interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  currency?: string;
}
```

**ProductStatusBadge.tsx**
```tsx
interface ProductStatusBadgeProps {
  status: ProductStatus;
  size?: 'sm' | 'md';
}

type ProductStatus = 'active' | 'draft' | 'archived';

// Badge colors
// Active: Green
// Draft: Gray
// Archived: Red
```

#### Bulk Actions Bar
**File:** `apps/vendor-web/app/vendor/products/components/BulkActionsBar.tsx`

```tsx
interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (action: string) => void;
  onClear: () => void;
}

type BulkAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  confirm?: boolean;
  confirmMessage?: string;
  danger?: boolean;
};

// Available bulk actions
const bulkActions = [
  { id: 'activate', label: 'Set Active', icon: Check },
  { id: 'draft', label: 'Set Draft', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive, confirm: true, danger: true },
  { id: 'delete', label: 'Delete', icon: Trash2, confirm: true, danger: true },
  { id: 'update_category', label: 'Update Category', icon: FolderTree },
  { id: 'adjust_stock', label: 'Adjust Stock', icon: Package },
  { id: 'export', label: 'Export CSV', icon: Download },
];
```

**Features:**
- Shows number of selected items
- Action dropdown with icons
- Confirmation dialogs for destructive actions
- Clear selection button
- Progress indicator during bulk operations

---

## 3.2 Create/Edit Product Workflow

### Create Product Page
**File:** `apps/vendor-web/app/vendor/products/new/page.tsx`

```tsx
export default function NewProductPage() {
  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Create Product"
          description="Add a new product to your catalog"
          backButton
        />

        <ProductForm mode="create" />
      </div>
    </VendorLayout>
  );
}
```

### Edit Product Page
**File:** `apps/vendor-web/app/vendor/products/[id]/edit/page.tsx`

```tsx
export default function EditProductPage({ params }: { params: { id: string } }) {
  const { data: product, loading } = useProduct(params.id);

  if (loading) return <ProductFormSkeleton />;
  if (!product) return <NotFound />;

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Edit Product"
          description={`Editing ${product.name}`}
          backButton
          actions={
            <Button variant="outline" onClick={() => navigate(`/vendor/products/${product.id}`)}>
              View Product
            </Button>
          }
        />

        <ProductForm mode="edit" product={product} />
      </div>
    </VendorLayout>
  );
}
```

#### Product Form Component
**File:** `apps/vendor-web/app/vendor/products/components/ProductForm.tsx`

```tsx
interface ProductFormProps {
  mode: 'create' | 'edit';
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
}

interface ProductFormData {
  // Basic Information
  name: string;
  sku: string;
  slug: string;
  description?: string;

  // Pricing
  price: number;
  compareAtPrice?: number;
  costPrice?: number;

  // Inventory
  trackInventory: boolean;
  stockLevel?: number;
  lowStockThreshold?: number;

  // Organization
  categoryId: string;
  tags?: string[];
  status: ProductStatus;

  // Media
  images: ProductImage[];
  featuredImage?: string;

  // Variants (if applicable)
  hasVariants: boolean;
  variants?: ProductVariant[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
}
```

**Form Sections:**

**1. BasicInfoSection.tsx**
```tsx
interface BasicInfoSectionProps {
  errors?: Record<string, string>;
}

// Fields:
// - Name (required, min 3 chars)
// - SKU (required, unique)
// - Slug (auto-generated from name)
// - Description (rich text editor)
```

**Features:**
- Auto-generate slug from name
- Unique SKU validation
- Rich text description editor
- Character count for description
- SEO preview

**2. PricingSection.tsx**
```tsx
interface PricingSectionProps {
  errors?: Record<string, string>;
}

// Fields:
// - Price (required, positive number)
// - Compare at price (optional, for sales)
// - Cost price (optional, for margin calculation)
// - Auto-calculated margin display
```

**Features:**
- Price formatting with currency
- Margin calculator
- Profit display
- Compare-at-price with sale badge preview

**3. InventorySection.tsx**
```tsx
interface InventorySectionProps {
  errors?: Record<string, string>;
}

// Fields:
// - Track inventory toggle
// - Stock level (if tracking)
// - Low stock threshold (if tracking)
// - Continue selling when out of stock checkbox
```

**Features:**
- Toggle inventory tracking
- Stock level input with +/- buttons
- Threshold input with recommended values
- Visual stock status preview
- "Continue selling" option

**4. OrganizationSection.tsx**
```tsx
interface OrganizationSectionProps {
  errors?: Record<string, string>;
}

// Fields:
// - Category dropdown with nested display
// - Tags input with suggestions
// - Product status (Active/Draft/Archived)
```

**Features:**
- Hierarchical category selector
- Multi-select tags
- Tag creation on-the-fly
- Popular tags suggestions
- Status with description

**5. ImagesSection.tsx**
```tsx
interface ImagesSectionProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  position: number;
}
```

**Features:**
- Drag & drop upload
- Multiple file selection
- Image gallery with reorder
- Set featured image
- Alt text for each image
- Image zoom preview
- Delete with confirmation
- Max file size validation
- File type validation

**6. VariantsSection.tsx**
```tsx
interface VariantsSectionProps {
  hasVariants: boolean;
  variants?: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockLevel: number;
  options: VariantOption[];
}

interface VariantOption {
  name: string;  // e.g., "Color", "Size"
  value: string; // e.g., "Red", "Large"
}
```

**Features:**
- Toggle variants on/off
- Dynamic variant options
- Variant matrix table
- Individual variant pricing
- Variant stock management
- Duplicate variant option
- Generate variants from options

**7. SEOSection.tsx**
```tsx
interface SEOSectionProps {
  errors?: Record<string, string>;
}

// Fields:
// - Meta title
// - Meta description
// - Open Graph image
// - SEO preview card
```

**Features:**
- SEO title length indicator
- Meta description preview
- Google search result preview
- Social share preview
- Character count recommendations

#### Form Actions
```tsx
interface FormActionsProps {
  mode: 'create' | 'edit';
  isValid: boolean;
  isSubmitting: boolean;
  hasChanges: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}
```

**Buttons:**
- Cancel
- Save as Draft
- Publish / Update
- Save and continue (create another)

---

## 3.3 Media Management

### Media Library Page
**File:** `apps/vendor-web/app/vendor/media/page.tsx`

```tsx
export default function MediaLibraryPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Media Library"
          description="Manage your product images and media"
          action={
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          }
        />

        <MediaFilters />

        <MediaGallery />
      </div>
    </VendorLayout>
  );
}
```

#### Media Gallery Component
**File:** `apps/vendor-web/app/vendor/media/components/MediaGallery.tsx`

```tsx
interface MediaGalleryProps {
  media: MediaItem[];
  selectedMedia: string[];
  onSelectionChange: (ids: string[]) => void;
  onMediaClick: (media: MediaItem) => void;
  view: 'grid' | 'list';
}

interface MediaItem {
  id: string;
  url: string;
  thumbnail_url: string;
  filename: string;
  size: number;
  type: string;
  width: number;
  height: number;
  created_at: string;
  alt_text?: string;
  products?: string[]; // Product IDs using this media
}
```

**Features:**
- Grid/list toggle
- Multi-select with checkboxes
- Hover preview
- Drag to select multiple
- Filter by file type
- Filter by usage (unused, in use)
- Sort by name, date, size
- Folder organization
- Bulk delete
- Bulk download

#### Media Uploader Component
**File:** `apps/vendor-web/components/media/MediaUploader.tsx`

```tsx
interface MediaUploaderProps {
  onUpload: (files: File[]) => Promise<MediaItem[]>;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
}
```

**Features:**
- Drag & drop zone
- File browser
- Multiple file upload
- Upload progress indicators
- Image preview during upload
- Cancel upload
- Max file size validation
- File type validation
- Duplicate file detection
- Auto-compression options
- Alt text bulk editor

#### Image Editor Component
**File:** `apps/vendor-web/components/media/ImageEditor.tsx`

```tsx
interface ImageEditorProps {
  image: MediaItem;
  onSave: (editedImage: MediaItem) => void;
  onCancel: () => void;
}
```

**Features:**
- Crop tool with presets
- Rotation
- Brightness/contrast
- Filters
- Resize
- Undo/redo
- Before/after preview

---

## 3.4 Category Management

### Category Selector Component
**File:** `apps/vendor-web/components/products/CategorySelector.tsx`

```tsx
interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  categories: Category[];
  error?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  children?: Category[];
  image_url?: string;
}
```

**Features:**
- Hierarchical tree display
- Search within categories
- Breadcrumb navigation
- Keyboard navigation
- Auto-expand to selected
- Show category count

---

## Success Criteria

- [ ] Product listing loads within 2 seconds
- [ ] Search returns results within 500ms
- [ ] Filters work independently and combined
- [ ] Bulk actions process up to 100 items
- [ ] Product form validates all required fields
- [ ] SKU uniqueness is checked before submit
- [ ] Images upload and display correctly
- [ ] Image reordering persists
- [ ] Product saves and redirects correctly
- [ ] Draft products are listed separately
- [ ] Status badges display correct colors
- [ ] Stock levels show accurate indicators
- [ ] Media gallery handles 1000+ images
- [ ] Category tree loads efficiently

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       ├── products/
│       │   ├── page.tsx                         # ✅ Partial
│       │   ├── new/
│       │   │   └── page.tsx                     # ⏳ To Build
│       │   ├── [id]/
│       │   │   ├── page.tsx                     # ⏳ To Build
│       │   │   └── edit/
│       │   │       └── page.tsx                # ⏳ To Build
│       │   ├── bulk-edit/
│       │   │   └── page.tsx                    # ⏳ To Build
│       │   └── components/
│       │       ├── ProductsTable.tsx            # ✅ Partial
│       │       ├── ProductFilters.tsx           # ⏳ To Build
│       │       ├── BulkActionsBar.tsx           # ⏳ To Build
│       │       ├── ProductForm.tsx              # ⏳ To Build
│       │       ├── ProductCell.tsx              # ⏳ To Build
│       │       ├── StockDisplay.tsx             # ⏳ To Build
│       │       ├── PriceDisplay.tsx             # ⏳ To Build
│       │       ├── ProductStatusBadge.tsx       # ⏳ To Build
│       │       ├── ProductActionsMenu.tsx       # ⏳ To Build
│       │       ├── form-sections/
│       │       │   ├── BasicInfoSection.tsx     # ⏳ To Build
│       │       │   ├── PricingSection.tsx       # ⏳ To Build
│       │       │   ├── InventorySection.tsx    # ⏳ To Build
│       │       │   ├── OrganizationSection.tsx  # ⏳ To Build
│       │       │   ├── ImagesSection.tsx       # ⏳ To Build
│       │       │   ├── VariantsSection.tsx      # ⏳ To Build
│       │       │   └── SEOSection.tsx           # ⏳ To Build
│       │       └── form-skeletons/
│       │           └── ProductFormSkeleton.tsx  # ⏳ To Build
│       └── media/
│           ├── page.tsx                         # ⏳ To Build
│           └── components/
│               ├── MediaGallery.tsx             # ⏳ To Build
│               ├── MediaFilters.tsx             # ⏳ To Build
│               └── MediaFolder.tsx              # ⏳ To Build
├── components/
│   ├── media/
│   │   ├── MediaUploader.tsx                   # ⏳ To Build
│   │   ├── ImageEditor.tsx                     # ⏳ To Build
│   │   └── ImagePreview.tsx                    # ⏳ To Build
│   └── products/
│       ├── CategorySelector.tsx                # ⏳ To Build
│       ├── TagInput.tsx                        # ⏳ To Build
│       └── VariantMatrix.tsx                   # ⏳ To Build
└── lib/
    └── validations/
        └── product-validations.ts               # ⏳ To Build
```

---

## Implementation Notes

1. **Form Validation**: Use react-hook-form with Zod schemas
2. **Image Upload**: Implement progress indicators for large files
3. **SKU Generation**: Auto-generate SKU from category + random if needed
4. **Slug Generation**: Auto-generate from product name, make editable
5. **Variant Management**: Show warning if variants would create >100 combinations
6. **Rich Text**: Use a lightweight rich text editor (e.g., Tiptap)
7. **Image Optimization**: Compress images on upload before sending to server
8. **Auto-save**: Implement draft auto-save every 30 seconds
9. **Undo**: Keep history of changes for undo functionality
10. **Mobile**: Ensure form sections collapse on mobile
