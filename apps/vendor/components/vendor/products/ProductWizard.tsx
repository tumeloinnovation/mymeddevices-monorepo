"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  LayoutDashboard,
  Box,
  Image as ImageIcon,
  Zap,
  ShieldCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Search,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { catalogService, ProductCreate, PPBClassification } from "@mymeddevices/shared-core";

// --- Form Schema ---
const productSchema = z.object({
  // Step 1: Core Fields
  name: z.string().min(3, "Product name is too short"),
  sku: z.string().min(3, "SKU is required"),
  category_id: z.string().min(1, "Please select a category"),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  model_number: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  stock_quantity: z.coerce.number().min(0, "Stock cannot be negative"),
  
  // Step 3: AI/Content (Will be prefilled)
  description: z.string().optional(),
  short_description: z.string().optional(),
  specifications: z.any().optional(),
  tags: z.array(z.string()).optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),

  // Step 4: Compliance
  kmpdb_registration_number: z.string().optional(),
  ppb_classification: z.enum(['Class A', 'Class B', 'Class C', 'Class D', 'Unclassified']).optional(),
  ce_marking_or_fda_clearance: z.string().optional(),
  warranty_info: z.string().optional(),
});

type FormData = z.infer<typeof productSchema>;

const STEPS = [
  { id: "core", title: "Core Identity", icon: Box },
  { id: "media", title: "Media & Assets", icon: ImageIcon },
  { id: "ai", title: "AI Intelligence", icon: Sparkles },
  { id: "review", title: "Review & Publish", icon: ShieldCheck },
];

export function ProductWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      category_id: "",
      price: 0,
      stock_quantity: 0,
      ppb_classification: "Unclassified",
      tags: [],
    },
    mode: "onChange",
  });

  const { handleSubmit, trigger, watch, setValue, formState: { errors } } = methods;

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ["name", "sku", "category_id", "price"];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      let product;
      if (draftProductId) {
        product = await catalogService.updateProduct(draftProductId, data as any);
      } else {
        product = await catalogService.createProduct(data as ProductCreate);
      }
      
      // Upload images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await catalogService.uploadImage(product.id, images[i], {
            is_primary: i === 0,
            sort_order: i,
          });
        }
      }

      toast.success("Product created successfully!");
      router.push("/vendor/products");
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIContent = async () => {
    const name = watch("name");
    const categoryId = watch("category_id");

    if (!name || !categoryId) {
      toast.error("Please provide a name and category first.");
      return;
    }

    setIsGenerating(true);
    try {
      // In a real scenario, we'd need a product ID first or a generic generation endpoint.
      // Since our backend requires a product ID for ai-assist, we might need to 
      // save as draft first OR use a mock/temp generation if backend supports it.
      // For now, let's assume we create a quick draft if we're at Step 3.
      
      const draftData = methods.getValues();
      const product = await catalogService.createProduct({
        ...draftData,
        status: "draft"
      } as ProductCreate);
      
      const suggestions = await catalogService.getAiSuggestions(product.id, {
        fields_to_generate: ["description", "short_description", "specifications", "tags", "meta_title", "meta_description"]
      });

      if (suggestions.suggestions) {
        const { suggestions: s } = suggestions;
        if (s.description) setValue("description", s.description);
        if (s.short_description) setValue("short_description", s.short_description);
        if (s.specifications) setValue("specifications", s.specifications);
        if (s.tags) setValue("tags", s.tags);
        if (s.meta_title) setValue("meta_title", s.meta_title);
        if (s.meta_description) setValue("meta_description", s.meta_description);
        
        toast.success("AI content generated successfully!");
      }
    } catch (error: any) {
      toast.error("AI Generation failed: " + (error.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Wizard Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">New Product Wizard</h1>
              <p className="text-muted-foreground text-sm">Follow the steps to list your medical equipment.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${currentStep === idx ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-transparent"}`}>
                  <step.icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{step.title}</span>
                </div>
                {idx < STEPS.length - 1 && <div className="h-px w-4 bg-muted" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-1.5 bg-muted" />
      </div>

      {/* Wizard Content */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepContent 
                step={currentStep} 
                images={images} 
                setImages={setImages} 
                previews={imagePreviews} 
                setPreviews={setImagePreviews}
                isGenerating={isGenerating}
                onGenerateAI={generateAIContent}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0 || isSubmitting}
              className="font-bold text-xs uppercase tracking-widest gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="font-black text-xs uppercase tracking-widest gap-2 px-8 rounded-xl shadow-lg shadow-primary/20"
              >
                Next Step
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="font-black text-xs uppercase tracking-widest gap-2 px-10 rounded-xl shadow-xl shadow-primary/30"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Publish Listing
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function StepContent({ step, images, setImages, previews, setPreviews, isGenerating, onGenerateAI }: any) {
  switch (step) {
    case 0: return <StepCoreIdentity />;
    case 1: return <StepMedia images={images} setImages={setImages} previews={previews} setPreviews={setPreviews} />;
    case 2: return <StepAIAssist isGenerating={isGenerating} onGenerate={onGenerateAI} />;
    case 3: return <StepReview />;
    default: return null;
  }
}

// --- SUB-COMPONENTS FOR STEPS ---

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/api/hooks/useCatalog";

function StepCoreIdentity() {
  const { register, formState: { errors }, setValue, watch } = useFormContext();
  const { data: categories } = useCategories();

  return (
    <Card className="border-muted/40 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden">
      <div className="bg-primary/5 p-8 border-b border-muted/20">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
          <Box className="h-6 w-6 text-primary" />
          Core Identity
        </h2>
        <p className="text-muted-foreground text-xs mt-1 font-medium">Capture the essential clinical details of your equipment.</p>
      </div>
      <CardContent className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Product Name *</Label>
            <Input {...register("name")} placeholder="e.g. Ultrasound System Voluson E10" className="h-14 rounded-2xl text-lg font-bold" />
            {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.name.message as string}</p>}
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">SKU / Catalog No. *</Label>
            <Input {...register("sku")} placeholder="e.g. GE-U-V10-2026" className="h-14 rounded-2xl font-mono" />
            {errors.sku && <p className="text-red-500 text-[10px] font-bold uppercase">{errors.sku.message as string}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Category *</Label>
            <Select onValueChange={(val) => setValue("category_id", val)} defaultValue={watch("category_id")}>
              <SelectTrigger className="h-14 rounded-2xl font-bold">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Brand</Label>
            <Input {...register("brand")} placeholder="e.g. GE Healthcare" className="h-14 rounded-2xl font-bold" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Retail Price (KES) *</Label>
            <div className="relative">
              <Input type="number" {...register("price")} className="h-14 pl-12 rounded-2xl text-xl font-black bg-primary/5 border-primary/20" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary text-xs">KES</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { X, Upload } from "lucide-react";
import Image from "next/image";

function StepMedia({ images, setImages, previews, setPreviews }: any) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImages([...images, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_: any, i: number) => i !== index));
    setPreviews(previews.filter((_: any, i: number) => i !== index));
  };

  return (
    <Card className="border-muted/40 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden">
      <div className="bg-indigo-500/5 p-8 border-b border-muted/20">
        <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-indigo-600">
          <ImageIcon className="h-6 w-6" />
          Media & Assets
        </h2>
        <p className="text-muted-foreground text-xs mt-1 font-medium">Upload high-resolution clinical images of the product.</p>
      </div>
      <CardContent className="p-10 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <AnimatePresence>
            {previews.map((src: string, idx: number) => (
              <motion.div
                key={src}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative aspect-square rounded-3xl overflow-hidden group border-2 border-muted"
              >
                <Image src={src} alt="Preview" fill className="object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 h-7 w-7 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
                {idx === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-[8px] font-black text-white py-1 text-center uppercase tracking-widest">Primary</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <label className="aspect-square rounded-3xl border-2 border-dashed border-muted flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-all group">
            <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Add Media</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Image Requirements</p>
            <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed mt-1">
              For medical devices, please include: 1. Front view, 2. Control Panel/Screen, 3. Serial Number Label, 4. Included Accessories. Minimum 1080px recommended.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Textarea } from "@/components/ui/textarea";

function StepAIAssist({ isGenerating, onGenerate }: any) {
  const { register, watch } = useFormContext();

  return (
    <Card className="border-muted/40 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden">
      <div className="bg-amber-500/5 p-8 border-b border-muted/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
           <Zap className="h-24 w-24 text-amber-500/10 -rotate-12" />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-amber-600">
            <Sparkles className="h-6 w-6" />
            AI Intelligence
          </h2>
          <p className="text-muted-foreground text-xs mt-1 font-medium">Use Google Gemini to generate professional clinical descriptions.</p>
        </div>
      </div>
      <CardContent className="p-10 space-y-10">
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-muted rounded-[2rem] bg-muted/10 gap-6">
          <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center shadow-xl ${isGenerating ? "bg-primary animate-pulse" : "bg-white"}`}>
            {isGenerating ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Sparkles className="h-8 w-8 text-amber-500" />}
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-black tracking-tight">Magic Pre-fill</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">Click below to auto-generate description, technical specs, and SEO meta using AI.</p>
          </div>
          <Button 
            type="button" 
            onClick={onGenerate} 
            disabled={isGenerating}
            className="rounded-2xl h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20"
          >
            {isGenerating ? "Generating Insights..." : "Generate with Gemini"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-8">
           <div className="space-y-3">
             <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Generated Description</Label>
             <Textarea {...register("description")} rows={8} className="rounded-2xl py-5 text-sm leading-relaxed border-muted-foreground/20" placeholder="AI will generate this, or you can type manually..." />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">SEO Meta Title</Label>
               <Input {...register("meta_title")} className="h-14 rounded-2xl font-bold" />
             </div>
             <div className="space-y-3">
               <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">SEO Meta Description</Label>
               <Input {...register("meta_description")} className="h-14 rounded-2xl font-bold" />
             </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StepReview() {
  const { watch, register } = useFormContext();
  const data = watch();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card className="border-muted/40 shadow-xl shadow-foreground/5 rounded-[2.5rem] overflow-hidden">
          <div className="bg-emerald-500/5 p-8 border-b border-muted/20">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
              Final Compliance Review
            </h2>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Verify regulatory registrations before going live.</p>
          </div>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">KMPDB Reg No.</Label>
                <Input {...register("kmpdb_registration_number")} placeholder="KMPDB/REG/..." className="h-14 rounded-2xl font-bold" />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">PPB Classification</Label>
                <Select onValueChange={(val) => register("ppb_classification").onChange({ target: { value: val } })} defaultValue={data.ppb_classification}>
                   <SelectTrigger className="h-14 rounded-2xl font-bold">
                     <SelectValue placeholder="Select Class" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="Class A">Class A (Low Risk)</SelectItem>
                      <SelectItem value="Class B">Class B (Low-Moderate)</SelectItem>
                      <SelectItem value="Class C">Class C (Moderate-High)</SelectItem>
                      <SelectItem value="Class D">Class D (High Risk)</SelectItem>
                      <SelectItem value="Unclassified">Unclassified</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Warranty & Support Info</Label>
              <Textarea {...register("warranty_info")} className="rounded-2xl py-4 text-sm" placeholder="Details about service contracts, warranty periods, etc." />
            </div>
          </CardContent>
        </Card>

        <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white space-y-6">
           <h3 className="text-lg font-black flex items-center gap-3">
             <LayoutDashboard className="h-5 w-5 text-primary" />
             Submission Confirmation
           </h3>
           <p className="text-slate-400 text-xs leading-relaxed">
             By publishing this listing, you confirm that all medical certifications provided are valid and the equipment meets the safety standards for the selected region.
           </p>
           <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ready for Admin Review</span>
           </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Listing Preview</h3>
           <Card className="rounded-3xl border-muted/40 shadow-2xl overflow-hidden group">
              <div className="aspect-[4/5] bg-muted relative">
                 <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-black text-4xl uppercase -rotate-12">
                   {data.name || "Preview"}
                 </div>
                 <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black text-primary border shadow-sm">
                   {data.price ? `KES ${Number(data.price).toLocaleString()}` : "Price TBD"}
                 </div>
              </div>
              <CardContent className="p-6 space-y-4">
                 <div className="space-y-1">
                   <h4 className="font-black tracking-tight truncate">{data.name || "New Product Listing"}</h4>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">{data.brand || "Unknown Brand"}</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   <div className="px-2 py-0.5 bg-muted rounded text-[8px] font-black uppercase">{data.ppb_classification}</div>
                   {data.tags?.map((t: string) => (
                     <div key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-black uppercase">{t}</div>
                   ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
