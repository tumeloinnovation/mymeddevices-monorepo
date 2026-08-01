"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  Loader2,
  FileText,
  ShoppingCart,
  Package,
  Settings2,
  Eye,
  CheckCircle2,
  Sparkles,
  Database,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Tag,
  AlertCircle,
  Zap,
  ArrowRight,
} from "lucide-react";
import { catalogService, CategoryTree, Brand, useAuthStore, VendorListItem } from "@mymeddevices/shared-core";
import { motion, AnimatePresence } from "framer-motion";

import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STEPS = [
  { id: "general", label: "General Info", icon: FileText, description: "Basic product details" },
  { id: "pricing", label: "Pricing", icon: ShoppingCart, description: "Price and currency" },
  { id: "inventory", label: "Inventory & Physical", icon: Package, description: "Stock, SKU, weight" },
  { id: "gallery", label: "Product Gallery", icon: ImageIcon, description: "Manage images" },
  { id: "ai", label: "AI Assist", icon: Sparkles, description: "MedAI content & tags" },
  { id: "review", label: "Review", icon: Eye, description: "Confirm & publish" },
];

export default function NewProductPage() {
  const router = useRouter();
  const { listVendorsAdmin } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftProductId, setDraftProductId] = useState<string | null>(null);
  const [createBrandLoading, setCreateBrandLoading] = useState(false);
  const [createBrandError, setCreateBrandError] = useState<string | null>(null);

  // Gallery state
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState({
    vendor_id: "",
    vendor_name: "",
    name: "",
    slug: "",
    description: "",
    short_description: "",
    sku: "",
    category_id: "",
    category_name: "",
    brand: "",
    brand_name: "",
    model_number: "",
    price: "",
    cost_price: "",
    stock_quantity: "0",
    low_stock_threshold: "5",
    track_inventory: true,
    weight_kg: "",
    specifications: "{}",
    meta_title: "",
    meta_description: "",
    tags: [] as string[],
  });

  // Specifications helpers
  const specs = (() => {
    try {
      return JSON.parse(formData.specifications || "{}");
    } catch (e) {
      return {};
    }
  })();

  const handleSpecChange = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...specs };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = newValue;
    setFormData(prev => ({ ...prev, specifications: JSON.stringify(updated, null, 2) }));
  };

  const handleSpecDelete = (keyToDelete: string) => {
    const updated = { ...specs };
    delete updated[keyToDelete];
    setFormData(prev => ({ ...prev, specifications: JSON.stringify(updated, null, 2) }));
  };

  const handleSpecAdd = () => {
    const updated = { ...specs };
    let newKey = "New Specification";
    let counter = 1;
    while (newKey in updated) {
      newKey = `New Specification ${counter}`;
      counter++;
    }
    updated[newKey] = "";
    setFormData(prev => ({ ...prev, specifications: JSON.stringify(updated, null, 2) }));
  };

  const specEntries = Object.entries(specs);

  // Tags helpers
  const tags = formData.tags || [];
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, cleanTag] }));
    }
    setTagInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tagToRemove) }));
  };

  // MedAI Content Generation helper
  const generateAIContent = async () => {
    if (!formData.name || !formData.category_id) {
      toast.error("Please select a vendor, name, and category first");
      return;
    }

    setIsGenerating(true);
    try {
      let specificationsObj = {};
      try {
        specificationsObj = JSON.parse(formData.specifications || "{}");
      } catch (e) {}

      const draftData: any = {
        vendor_id: formData.vendor_id || undefined,
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        sku: formData.sku || undefined,
        category_id: formData.category_id || undefined,
        brand: formData.brand_name || undefined,
        model_number: formData.model_number || undefined,
        price: parseFloat(formData.price) || 0,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        currency: "KES",
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        track_inventory: formData.track_inventory,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        specifications: specificationsObj,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        status: "draft"
      };

      let product;
      if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, draftData);
      } else {
        product = await catalogService.createProduct(draftData);
        setDraftProductId(product.id);
      }
      
      const suggestions = await catalogService.getAiSuggestions(product.id, {
        fields_to_generate: ["description", "short_description", "specifications", "tags", "meta_title", "meta_description"]
      });

      if (suggestions.suggestions) {
        const { suggestions: s } = suggestions;
        setFormData(prev => ({
          ...prev,
          description: s.description || prev.description,
          short_description: s.short_description || prev.short_description,
          specifications: s.specifications ? JSON.stringify(s.specifications, null, 2) : prev.specifications,
          tags: s.tags || prev.tags,
          meta_title: s.meta_title || prev.meta_title,
          meta_description: s.meta_description || prev.meta_description
        }));
        
        toast.success("AI content and specifications generated successfully!");
      }
    } catch (error: any) {
      toast.error("AI Generation failed: " + (error.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, brandsData, vendorsResult] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands({ active_only: true }),
          listVendorsAdmin({ page: 1, page_size: 100 })
        ]);

        const flatCategories: CategoryTree[] = [];
        const flatten = (catList: CategoryTree[]) => {
          catList.forEach((cat) => {
            flatCategories.push(cat);
            if (cat.children?.length > 0) flatten(cat.children);
          });
        };
        flatten(categoriesData);
        setCategories(flatCategories);
        setBrands(brandsData.brands || []);

        const vendorsData = Array.isArray(vendorsResult?.vendors) ? vendorsResult.vendors : [];
        const approvedVendors = vendorsData.filter((v: VendorListItem) => v.approval_status === "approved");
        setVendors(approvedVendors);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, [listVendorsAdmin]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateBrand = async (name: string): Promise<string> => {
    setCreateBrandLoading(true);
    setCreateBrandError(null);

    try {
      const newBrand = await catalogService.createQuickBrand({ name });
      // Add the new brand to the local brands list
      setBrands(prev => [...prev, newBrand]);
      toast.success(`Brand "${name}" created and approved`);
      return newBrand.id;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to create brand";
      setCreateBrandError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreateBrandLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, name, slug }));
  };

  const generateDescriptions = async () => {
    if (!formData.name || !formData.brand) {
      toast.error("Please enter product name and brand first");
      return;
    }

    setGenerating(true);
    try {
      const brandName = brands.find(b => b.id === formData.brand)?.name || formData.brand;
      const categoryName = categories.find(c => c.id === formData.category_id)?.name;

      const result = await catalogService.generateDescriptions({
        product_name: formData.name,
        brand: brandName,
        category: categoryName
      });

      setFormData(prev => ({
        ...prev,
        short_description: result.suggestions.short_description || prev.short_description,
        description: result.suggestions.description || prev.description
      }));

      toast.success("Descriptions generated successfully");
    } catch (error) {
      toast.error("Failed to generate descriptions");
    } finally {
      setGenerating(false);
    }
  };

  const generateSEO = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Please enter product name and description first");
      return;
    }

    setGeneratingSEO(true);
    try {
      const result = await catalogService.generateDescriptions({
        product_name: formData.name,
        brand: brands.find(b => b.id === formData.brand)?.name || formData.brand || "",
        category: categories.find(c => c.id === formData.category_id)?.name
      });

      setFormData(prev => ({
        ...prev,
        meta_title: result.suggestions.meta_title || prev.meta_title,
        meta_description: result.suggestions.meta_description || prev.meta_description
      }));

      toast.success("SEO metadata generated successfully");
    } catch (error) {
      toast.error("Failed to generate SEO metadata");
    } finally {
      setGeneratingSEO(false);
    }
  };

  const fillSampleData = (type: 'complete' | 'simple' | 'invalid_spec' | 'ai_test') => {
    const sampleVendor = vendors.find(v => v.id) || vendors[0];
    const vendorId = sampleVendor?.id || "";
    const vendorName = sampleVendor?.store_name || sampleVendor?.company_name || "";

    if (type === 'complete') {
      const sampleBrand = brands.find(b => b.name.toLowerCase().includes("medtech")) || brands[0];
      const sampleCategory = categories.find(c => c.name.toLowerCase().includes("diagnostic") || c.name.toLowerCase().includes("monitor")) || categories[0];

      setFormData({
        vendor_id: vendorId,
        vendor_name: vendorName,
        name: "ProGlucose Blood Glucose Monitoring System",
        slug: "proglucose-blood-glucose-monitoring-system",
        description: "The ProGlucose Blood Glucose Monitoring System represents the next generation in diabetes management technology. Designed specifically for hospitals, clinics, and healthcare facilities, this FDA-cleared device delivers laboratory-accurate results within 5 seconds.\n\nKey features include a large, high-contrast LCD display for easy reading, Bluetooth Low Energy connectivity for seamless EHR integration, and a built-in quality control system that automatically validates each test strip batch. The device stores up to 1,000 test results with date/time stamps and supports both fingerstick and alternative site testing.\n\nThe ProGlucose system comes with a desktop cradle for easy storage and includes comprehensive data management software that generates trend reports, averages, and actionable insights for patient care. Device requires no coding and supports multiple user profiles, making it ideal for shared clinical environments.\n\nThis device meets ISO 15197:2013 standards for blood glucose monitoring systems and includes a 2-year manufacturer warranty with optional extended service plans available.",
        short_description: "Professional-grade blood glucose monitoring system with Bluetooth connectivity and cloud-based analytics for healthcare facilities.",
        sku: "MTP-PG-2024-001",
        category_id: sampleCategory?.id || "",
        category_name: sampleCategory?.name || "Diagnostic Equipment",
        brand: sampleBrand?.id || "",
        brand_name: sampleBrand?.name || "MedTech Pro",
        model_number: "PG-2024-X",
        price: "189.99",
        cost_price: "95.00",
        stock_quantity: "250",
        low_stock_threshold: "25",
        track_inventory: true,
        weight_kg: "0.35",
        specifications: JSON.stringify({
          "Measurement Range": "20-600 mg/dL (1.1-33.3 mmol/L)",
          "Sample Size": "0.5 μL",
          "Test Time": "5 seconds",
          "Memory": "1,000 results",
          "Display": "2.4\" LCD with backlight",
          "Connectivity": "Bluetooth 5.0 LE, USB-C",
          "Battery": "2x AAA (included), ~1,000 tests",
          "Operating Temperature": "10-40°C (50-104°F)",
          "Storage Temperature": "0-50°C (32-122°F)",
          "Dimensions": "95mm x 55mm x 20mm",
          "Regulatory": "FDA 510(k) Cleared, CE Marked, ISO 13485"
        }, null, 2),
        meta_title: "ProGlucose Blood Glucose Monitor | MedTech Pro - MyMedDevices",
        meta_description: "Professional FDA-cleared blood glucose monitoring system with Bluetooth connectivity. 5-second results, EHR integration, ideal for healthcare facilities.",
        tags: ["blood glucose", "diabetes", "diagnostics", "bluetooth", "fda cleared", "hospital equipment", "point-of-care testing", "monitoring system"]
      });
      toast.success("Complete product (ProGlucose) sample data loaded!");
    } else if (type === 'simple') {
      const sampleBrand = brands.find(b => b.name.toLowerCase().includes("medicut")) || brands[0];
      const sampleCategory = categories.find(c => c.name.toLowerCase().includes("surgical") || c.name.toLowerCase().includes("instrument")) || categories[0];

      setFormData({
        vendor_id: vendorId,
        vendor_name: vendorName,
        name: "MediCut Disposable Scalpel",
        slug: "medicut-disposable-scalpel",
        description: "MediCut Disposable Scalpels are manufactured with high-carbon steel blades to ensure clean, precise incisions. Individually packaged and sterilized by gamma radiation. Ergonomic plastic handle for secure grip during surgical procedures.",
        short_description: "High-grade stainless steel disposable surgical scalpel for precise incisions.",
        sku: "MTP-MC-2024-002",
        category_id: sampleCategory?.id || "",
        category_name: sampleCategory?.name || "Surgical Instruments",
        brand: sampleBrand?.id || "",
        brand_name: sampleBrand?.name || "MediCut",
        model_number: "MC-SC-11",
        price: "12.50",
        cost_price: "5.00",
        stock_quantity: "1000",
        low_stock_threshold: "100",
        track_inventory: true,
        weight_kg: "0.02",
        specifications: JSON.stringify({
          "Blade Material": "High Carbon Steel",
          "Handle Material": "Plastic",
          "Blade Size": "#11",
          "Sterilization": "Gamma Radiation (R)",
          "Packaging": "Individually sealed peel packs",
          "Quantity": "Box of 10"
        }, null, 2),
        meta_title: "MediCut Disposable Surgical Scalpel #11 - MyMedDevices",
        meta_description: "Sterile disposable carbon steel surgical scalpel size #11. Ergonomic handle, individually wrapped. Box of 10.",
        tags: ["scalpel", "surgical", "disposable", "sterile", "carbon steel"]
      });
      toast.success("Simple product (MediCut) sample data loaded!");
    } else if (type === 'invalid_spec') {
      const sampleBrand = brands.find(b => b.name.toLowerCase().includes("flowmed")) || brands[0];
      const sampleCategory = categories.find(c => c.name.toLowerCase().includes("patient") || c.name.toLowerCase().includes("care")) || categories[0];

      setFormData({
        vendor_id: vendorId,
        vendor_name: vendorName,
        name: "Infusion Pump Deluxe",
        slug: "infusion-pump-deluxe",
        description: "A high-precision syringe infusion pump for delivering fluids, medications, or nutrients into a patient's circulatory system in controlled amounts.",
        short_description: "High-precision clinical syringe infusion pump.",
        sku: "MTP-IPD-2024-003",
        category_id: sampleCategory?.id || "",
        category_name: sampleCategory?.name || "Patient Care",
        brand: sampleBrand?.id || "",
        brand_name: sampleBrand?.name || "FlowMed",
        model_number: "IPD-500",
        price: "2450.00",
        cost_price: "1200.00",
        stock_quantity: "15",
        low_stock_threshold: "3",
        track_inventory: true,
        weight_kg: "2.10",
        specifications: "{invalid json here}",
        meta_title: "Infusion Pump Deluxe - MyMedDevices",
        meta_description: "High-precision syringe infusion pump for clinical environments.",
        tags: ["infusion pump", "patient care", "syringe pump"]
      });
      toast.success("Invalid specs product (Infusion Pump) sample data loaded! Go to specifications to inspect invalid JSON.");
    } else if (type === 'ai_test') {
      const sampleBrand = brands.find(b => b.name.toLowerCase().includes("oxihealth")) || brands[0];
      const sampleCategory = categories.find(c => c.name.toLowerCase().includes("diagnostic") || c.name.toLowerCase().includes("monitor")) || categories[0];

      setFormData({
        vendor_id: vendorId,
        vendor_name: vendorName,
        name: "Digital Pulse Oximeter",
        slug: "digital-pulse-oximeter",
        description: "",
        short_description: "",
        sku: "MTP-DPO-2024-004",
        category_id: sampleCategory?.id || "",
        category_name: sampleCategory?.name || "Diagnostic Equipment",
        brand: sampleBrand?.id || "",
        brand_name: sampleBrand?.name || "OxiHealth",
        model_number: "DPO-80",
        price: "45.00",
        cost_price: "20.00",
        stock_quantity: "500",
        low_stock_threshold: "50",
        track_inventory: true,
        weight_kg: "0.05",
        specifications: "{}",
        meta_title: "",
        meta_description: "",
        tags: []
      });
      toast.success("AI Generate product (Pulse Oximeter) sample data loaded! Try clicking 'AI Generate' for short description or SEO.");
    }
  };

  const handleNext = () => {
    // Validate current step before moving
    if (currentStep === 0 && !formData.name) {
      toast.error("Product name is required");
      return;
    }
    if (currentStep === 1 && !formData.price) {
      toast.error("Price is required");
      return;
    }

    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast.error("Please fill in required fields (Name and Price)");
      return;
    }

    setLoading(true);
    try {
      let specifications = {};
      try {
        specifications = JSON.parse(formData.specifications);
      } catch (e) {
        toast.error("Invalid JSON in specifications field");
        setLoading(false);
        return;
      }

      const createData: any = {
        vendor_id: formData.vendor_id || undefined,
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        sku: formData.sku || undefined,
        category_id: formData.category_id || undefined,
        brand: formData.brand_name || undefined,
        model_number: formData.model_number || undefined,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        currency: "KES",
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        track_inventory: formData.track_inventory,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        specifications,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      let product;
      if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, createData);
      } else {
        product = await catalogService.createProduct(createData);
      }

      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await catalogService.uploadImage(product.id, images[i], {
            is_primary: i === primaryImageIndex,
            sort_order: i,
          });
        }
      }

      toast.success("Product created successfully");
      router.push(`/dashboard/catalog/products/${product.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const StepIcon = ({ step, index }: { step: typeof STEPS[0]; index: number }) => {
    const Icon = step.icon;
    const isCompleted = completedSteps.has(index);
    const isCurrent = currentStep === index;

    return (
      <div className="relative">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300",
          isCompleted && "bg-emerald-500 border-emerald-500 text-white",
          isCurrent && "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30",
          !isCompleted && !isCurrent && "bg-muted/50 border-muted-foreground/20 text-muted-foreground"
        )}>
          {isCompleted ? (
            <Check className="h-5 w-5" />
          ) : (
            <Icon className="h-5 w-5" />
          )}
        </div>
        {index < STEPS.length - 1 && (
          <div className={cn(
            "absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8 -z-10 transition-colors duration-300",
            isCompleted ? "bg-emerald-500" : "bg-muted-foreground/10"
          )} />
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/catalog/products">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">New Product</h1>
              <p className="text-sm text-muted-foreground">Create a new product listing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-mono text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:border-amber-500/50"
                >
                  <Database className="mr-2 h-3.5 w-3.5" />
                  Fill Sample Data
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg border-border">
                <DropdownMenuItem onClick={() => fillSampleData('complete')} className="cursor-pointer">
                  ProGlucose (Complete Product)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fillSampleData('simple')} className="cursor-pointer">
                  MediCut Scalpel (Simple Product)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fillSampleData('ai_test')} className="cursor-pointer">
                  Pulse Oximeter (AI Gen Test)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fillSampleData('invalid_spec')} className="cursor-pointer">
                  Infusion Pump (Invalid Specifications)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={currentStep === STEPS.length - 1 ? handleSave : handleNext}
              disabled={loading}
              className="rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publish Product
                </>
              ) : (
                <>
                  Continue
                  <ChevronsUpDown className="ml-2 h-4 w-4 rotate-90" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Sidebar - Steps (Desktop Only) */}
          <div className="hidden lg:block w-72 border-r bg-muted/30 flex-shrink-0 overflow-y-auto">
            <div className="p-6 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-6">
                Setup Steps
              </h2>
              <nav className="space-y-1">
                {STEPS.map((step, index) => {
                  const isActive = currentStep === index;
                  const isCompleted = completedSteps.has(index);

                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (isCompleted || index < currentStep) {
                          setCurrentStep(index);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left",
                        isActive && "bg-white shadow-md border border-border",
                        !isActive && isCompleted && "hover:bg-muted/50",
                        !isActive && !isCompleted && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={!isCompleted && index > currentStep}
                    >
                      <StepIcon step={step} index={index} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Right Side - Form Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Horizontal Steps for mobile/tablet */}
            <div className="lg:hidden px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {STEPS[currentStep].label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-1.5 transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>
              
              {/* Horizontal mini step icons for tablet view */}
              <div className="hidden sm:flex items-center justify-start gap-2 mt-4 overflow-x-auto py-1">
                {STEPS.map((step, index) => {
                  const isActive = currentStep === index;
                  const isCompleted = completedSteps.has(index);
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (isCompleted || index < currentStep) {
                          setCurrentStep(index);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all border",
                        isActive && "bg-card border-border text-foreground font-semibold shadow-sm",
                        !isActive && isCompleted && "bg-success/5 border-success/20 text-success hover:bg-success/10",
                        !isActive && !isCompleted && "opacity-40 border-transparent text-muted-foreground cursor-not-allowed"
                      )}
                      disabled={!isCompleted && index > currentStep}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[80px]">{step.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {currentStep === 0 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">General Information</h2>
                    <p className="text-muted-foreground mt-1">Enter the basic details for your product.</p>
                  </div>

                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Core Details</CardTitle>
                      <CardDescription>
                        The essential information that identifies your product.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">
                            Product Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => generateSlug(e.target.value)}
                            placeholder="e.g. MRI Scanner Model X"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider">
                            Slug
                          </Label>
                          <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="mri-scanner-model-x"
                            className="h-11 font-mono text-sm"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="vendor" className="text-xs font-semibold uppercase tracking-wider">
                          Vendor <span className="text-red-500">*</span>
                        </Label>
                        <SearchableSelect
                          options={vendors.map((v) => ({
                            value: v.id,
                            label: v.store_name || v.company_name || "Unknown",
                          }))}
                          value={formData.vendor_id}
                          onChange={(value) => {
                            const vendor = vendors.find(v => v.id === value);
                            setFormData({ ...formData, vendor_id: value, vendor_name: vendor?.store_name || vendor?.company_name || "" });
                          }}
                          placeholder="Select vendor..."
                          searchPlaceholder="Search vendors..."
                          emptyMessage="No vendors found."
                          className="w-full"
                        />
                        <p className="text-[10px] text-muted-foreground">Select the vendor this product belongs to</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider">
                            Category
                          </Label>
                          <SearchableSelect
                            options={categories.map((c) => ({
                              value: c.id,
                              label: c.name,
                            }))}
                            value={formData.category_id}
                            onChange={(value) => {
                              const cat = categories.find(c => c.id === value);
                              setFormData({ ...formData, category_id: value, category_name: cat?.name || "" });
                            }}
                            placeholder="Select category..."
                            searchPlaceholder="Search categories..."
                            emptyMessage="No categories found."
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="brand" className="text-xs font-semibold uppercase tracking-wider">
                            Brand
                          </Label>
                          <SearchableSelect
                            options={brands.map((b) => ({
                              value: b.id,
                              label: b.name,
                              badge: b.approval_status === 'pending' ? 'Pending' : undefined,
                            }))}
                            value={formData.brand}
                            onChange={(value) => {
                              const brand = brands.find(b => b.id === value);
                              setFormData({ ...formData, brand: value, brand_name: brand?.name || "" });
                            }}
                            placeholder="Select brand..."
                            searchPlaceholder="Search brands..."
                            emptyMessage="No brands found."
                            className="w-full"
                            allowCreate={true}
                            onCreateOption={handleCreateBrand}
                            createLoading={createBrandLoading}
                            createError={createBrandError || undefined}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="model_number" className="text-xs font-semibold uppercase tracking-wider">
                            Model Number
                          </Label>
                          <Input
                            id="model_number"
                            value={formData.model_number}
                            onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                            placeholder="e.g. Voluson E10"
                            className="h-11 font-semibold"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pricing</h2>
                    <p className="text-muted-foreground mt-1">Set the pricing details for your product.</p>
                  </div>

                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Price Information</CardTitle>
                      <CardDescription>
                        Configure the retail price and cost price.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="price" className="text-xs font-semibold uppercase tracking-wider">
                            Retail Price (KES) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className="h-11 text-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label htmlFor="cost_price" className="text-xs font-semibold uppercase tracking-wider">
                            Cost Price (KES)
                          </Label>
                          <Input
                            id="cost_price"
                            type="number"
                            value={formData.cost_price}
                            onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                            placeholder="0.00"
                            className="h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Inventory & Physical</h2>
                    <p className="text-muted-foreground mt-1">Manage stock, SKU, and physical attributes.</p>
                  </div>

                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Stock & Physical Management</CardTitle>
                      <CardDescription>
                        Set up inventory levels and weight.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="sku" className="text-xs font-semibold uppercase tracking-wider">
                              SKU
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                const brandName = formData.brand_name || "GEN";
                                const categoryId = formData.category_id || "CAT";
                                const brandPart = brandName.substring(0, 3).toUpperCase();
                                const catPart = categoryId.substring(0, 3).toUpperCase();
                                const randomPart = Math.floor(1000 + Math.random() * 9000);
                                const generatedSku = `${brandPart}-${catPart}-${randomPart}`;
                                setFormData({ ...formData, sku: generatedSku });
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Auto-generate
                            </Button>
                          </div>
                          <Input
                            id="sku"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="e.g. MRI-102-X"
                            className="h-11 font-mono"
                          />
                          <p className="text-[10px] text-muted-foreground">Click auto-generate to create a unique SKU based on brand and category.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stock_quantity" className="text-xs font-semibold uppercase tracking-wider">
                            Initial Stock
                          </Label>
                          <Input
                            id="stock_quantity"
                            type="number"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="low_stock_threshold" className="text-xs font-semibold uppercase tracking-wider">
                            Low Stock Alert
                          </Label>
                          <Input
                            id="low_stock_threshold"
                            type="number"
                            value={formData.low_stock_threshold}
                            onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weight_kg" className="text-xs font-semibold uppercase tracking-wider">
                            Weight (kg)
                          </Label>
                          <div className="relative">
                            <Input
                              id="weight_kg"
                              type="number"
                              step="any"
                              value={formData.weight_kg}
                              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                              placeholder="e.g. 12.5"
                              className="h-11 pr-12 font-semibold"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground text-xs">kg</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div>
                          <Label htmlFor="track_inventory" className="text-sm font-semibold">Track Inventory</Label>
                          <p className="text-xs text-muted-foreground">Automatically deduct stock on orders</p>
                        </div>
                        <Switch
                          id="track_inventory"
                          checked={formData.track_inventory}
                          onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked })}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Product Gallery</h2>
                    <p className="text-muted-foreground mt-1">Upload and manage product clinical images.</p>
                  </div>

                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Image Gallery</CardTitle>
                      <CardDescription>
                        Add up to 5 clinical images. Click on any image to set it as primary.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                          {imagePreviews.map((src: string, idx: number) => (
                            <motion.div
                              key={src}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              onClick={() => setPrimaryImageIndex(idx)}
                              className={cn(
                                "relative aspect-square rounded-2xl overflow-hidden group border cursor-pointer transition-all",
                                idx === primaryImageIndex ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border hover:border-primary/50"
                              )}
                            >
                              <img src={src} alt="Preview" className="object-cover w-full h-full" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idxToRemove = idx;
                                  setImages(prev => prev.filter((_, i) => i !== idxToRemove));
                                  setImagePreviews(prev => prev.filter((_, i) => i !== idxToRemove));
                                  setPrimaryImageIndex(prev => {
                                    if (idxToRemove === prev) return 0;
                                    if (idxToRemove < prev) return prev - 1;
                                    return prev;
                                  });
                                }}
                                className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all border border-border"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                              {idx === primaryImageIndex ? (
                                <div className="absolute bottom-0 left-0 right-0 bg-primary/95 text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider">Primary</div>
                              ) : (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] font-bold text-white py-1 text-center uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">Set Primary</div>
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <label className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all group">
                          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Add Image</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                setImages([...images, ...files]);
                                const newPreviews = files.map(f => URL.createObjectURL(f));
                                setImagePreviews([...imagePreviews, ...newPreviews]);
                              }
                            }}
                          />
                        </label>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-300">Clinical Image Standards</p>
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium leading-relaxed mt-1">
                            Please upload high-resolution images: 1. Main perspective view, 2. Control console or screen interface, 3. Serial / rating plate label, 4. Included accessories.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Assist & Technical Details</h2>
                    <p className="text-muted-foreground mt-1">Generate details using MedAI and manage technical specifications.</p>
                  </div>

                  {/* MedAI Assist Card - Compact */}
                  <Card className="border-border/50 shadow-lg shadow-foreground/5 bg-gradient-to-br from-amber-500/[0.02] to-primary/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                      <Zap className="h-16 w-16 text-primary" />
                    </div>
                    <CardContent className="flex items-center justify-between py-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-white border ${isGenerating ? "animate-pulse" : ""}`}>
                          {isGenerating ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">AI Generate</h3>
                          <p className="text-[10px] text-muted-foreground">Auto-fill descriptions, specs & tags</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={generateAIContent}
                        disabled={isGenerating || !formData.name || !formData.category_id}
                        className="rounded-lg h-9 px-4 text-xs font-semibold gap-2"
                      >
                        {isGenerating ? "Generating..." : "Generate"}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Description Card */}
                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Product Descriptions</CardTitle>
                      <CardDescription>
                        Detailed information and short summary generated by AI or entered manually.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="short_description" className="text-xs font-semibold uppercase tracking-wider">
                          Short Description
                        </Label>
                        <Textarea
                          id="short_description"
                          value={formData.short_description}
                          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                          rows={3}
                          placeholder="A brief summary for listings..."
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={6}
                          placeholder="Provide a detailed description of the product..."
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Specs Card */}
                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle>Technical Specifications</CardTitle>
                        <CardDescription>
                          Define clinical and physical specifications as key-value pairs.
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSpecAdd}
                        className="rounded-xl h-9 text-xs font-semibold gap-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Spec
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {specEntries.length === 0 ? (
                        <div className="text-center p-8 rounded-xl bg-muted/20 border border-dashed border-muted text-xs text-muted-foreground font-medium">
                          No specifications yet. Click "Generate Details" or add one manually.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {specEntries.map(([key, val], idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-muted/30 p-2 rounded-xl border">
                              <Input
                                value={key}
                                onChange={(e) => handleSpecChange(key, e.target.value, val as string)}
                                placeholder="e.g. Dimensions"
                                className="h-9 rounded-lg font-bold text-xs"
                              />
                              <Input
                                value={val as string}
                                onChange={(e) => handleSpecChange(key, key, e.target.value)}
                                placeholder="Value"
                                className="h-9 rounded-lg text-xs"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSpecDelete(key)}
                                className="rounded-lg h-9 w-9 text-red-500 hover:bg-red-500/10 transition-all flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tags Card */}
                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                      <CardDescription>
                        Manage categorizations and keywords for storefront navigation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 p-3 min-h-[56px] rounded-xl border bg-white items-center">
                        {tags.map((tag: string) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20"
                          >
                            <span>{tag}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-primary hover:text-red-500 rounded-full transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleAddTag}
                          placeholder={tags.length === 0 ? "e.g. ultrasound, portable, ge (Press Enter to add)" : "Add more tags..."}
                          className="flex-grow min-w-[120px] bg-transparent outline-none text-xs px-1 text-foreground"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* SEO Metadata Card */}
                  <Card className="border-border/50 shadow-xl shadow-foreground/5">
                    <CardHeader>
                      <CardTitle>SEO Optimization</CardTitle>
                      <CardDescription>
                        Optimize details for search engines.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="meta_title" className="text-xs font-semibold uppercase tracking-wider">
                          Meta Title
                        </Label>
                        <Input
                          id="meta_title"
                          value={formData.meta_title}
                          onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                          placeholder="Optimal title for search engines"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meta_description" className="text-xs font-semibold uppercase tracking-wider">
                          Meta Description
                        </Label>
                        <Textarea
                          id="meta_description"
                          value={formData.meta_description}
                          onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                          rows={3}
                          placeholder="Brief description for search results..."
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Review & Publish</h2>
                    <p className="text-muted-foreground mt-1">Review your product before publishing.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Gallery Preview Card */}
                    {imagePreviews.length > 0 && (
                      <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
                        <CardHeader>
                          <CardTitle className="text-sm">Product Gallery Previews</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                            {imagePreviews.map((src, idx) => (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                                <img src={src} alt="Preview" className="object-cover w-full h-full" />
                                {idx === primaryImageIndex && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[8px] font-bold text-white py-0.5 text-center uppercase tracking-wider">Primary</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Product Details Card */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5">
                      <CardHeader>
                        <CardTitle className="text-sm">Product Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          { label: "Name", value: formData.name },
                          { label: "Slug", value: formData.slug, mono: true },
                          { label: "Vendor", value: formData.vendor_name },
                          { label: "Brand", value: formData.brand_name },
                          { label: "Category", value: formData.category_name },
                          { label: "Model Number", value: formData.model_number },
                          { label: "SKU", value: formData.sku, mono: true },
                        ].map(({ label, value, mono }) => (
                          <div key={label} className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {label}
                            </Label>
                            <p className={cn("text-sm font-medium", mono && "font-mono text-xs")}>
                              {value || <span className="text-muted-foreground italic">Not set</span>}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Descriptions Card */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5">
                      <CardHeader>
                        <CardTitle className="text-sm">Descriptions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Short Description
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {formData.short_description || <span className="italic">Not set</span>}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Full Description
                          </Label>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {formData.description || <span className="italic">Not set</span>}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing Card */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5">
                      <CardHeader>
                        <CardTitle className="text-sm">Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Retail Price (KES)
                          </Label>
                          <p className="text-2xl font-bold">{formData.price || <span className="text-muted-foreground italic">Not set</span>}</p>
                        </div>
                        {formData.cost_price && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                Cost Price (KES)
                              </Label>
                              <p className="text-sm text-muted-foreground">{formData.cost_price}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Inventory Card */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5">
                      <CardHeader>
                        <CardTitle className="text-sm">Inventory</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Track Inventory</Label>
                          <Badge variant={formData.track_inventory ? "default" : "secondary"}>
                            {formData.track_inventory ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Stock
                            </Label>
                            <p className="text-lg font-bold">{formData.stock_quantity}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Low Stock Alert
                            </Label>
                            <p className="text-sm font-medium">{formData.low_stock_threshold}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              Weight (kg)
                            </Label>
                            <p className="text-sm font-medium">{formData.weight_kg || <span className="italic">Not set</span>}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Specifications Card (full width) */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">Specifications</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          try {
                            const specsObjObj = JSON.parse(formData.specifications || "{}");
                            const entries = Object.entries(specsObjObj);
                            if (entries.length === 0) {
                              return <p className="text-sm text-muted-foreground italic">No specifications</p>;
                            }
                            return (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {entries.map(([key, value]) => (
                                  <div key={key} className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                      {key}
                                    </Label>
                                    <p className="text-sm font-medium">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            );
                          } catch {
                            return <p className="text-sm text-destructive italic">Invalid JSON format</p>;
                          }
                        })()}
                      </CardContent>
                    </Card>

                    {/* SEO Metadata Card (full width) */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">SEO Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Meta Title
                          </Label>
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            {formData.meta_title || <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        </div>
                        <Separator />
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Meta Description
                          </Label>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {formData.meta_description || <span className="italic">Not set</span>}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tags Card (full width) */}
                    <Card className="border-border/50 shadow-xl shadow-foreground/5 col-span-2">
                      <CardHeader>
                        <CardTitle className="text-sm">Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.length > 0 ? (
                            formData.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="font-medium">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground italic">No tags</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 border-t mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="rounded-xl"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                <Button
                  onClick={currentStep === STEPS.length - 1 ? handleSave : handleNext}
                  disabled={loading}
                  className="rounded-xl shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : currentStep === STEPS.length - 1 ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Publish Product
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronsUpDown className="ml-2 h-4 w-4 rotate-90" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
