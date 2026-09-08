"use client";

import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Sparkles,
  Loader2,
  Zap,
  Plus,
  Trash2,
  Tag,
  ShieldCheck,
  Cpu,
  Activity,
  Layers,
  Thermometer,
  FileText,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { RichTextEditor } from "../../../ui/rich-text-editor";
import { ProductWizardFormData } from "../product-wizard-schema";

interface SpecPresetGroup {
  category: string;
  icon: any;
  items: { key: string; placeholder: string }[];
}

const MEDICAL_SPEC_CATEGORIES: SpecPresetGroup[] = [
  {
    category: "Regulatory & Compliance",
    icon: ShieldCheck,
    items: [
      { key: "PPB Classification", placeholder: "Class A / Class B / Class C / Class D" },
      { key: "Certifications", placeholder: "CE Marked, ISO 13485, FDA 510(k)" },
      { key: "Warranty & Support", placeholder: "1 Year Manufacturer Warranty with Local Service" },
      { key: "Country of Origin", placeholder: "Germany / USA / Japan / Kenya" },
    ],
  },
  {
    category: "Clinical & Performance",
    icon: Activity,
    items: [
      { key: "Measurement Range", placeholder: "e.g. 0 - 300 mmHg, 30 - 240 bpm" },
      { key: "Accuracy / Resolution", placeholder: "e.g. ±2 mmHg, ±1 bpm" },
      { key: "Response Time", placeholder: "e.g. < 5 seconds" },
      { key: "Clinical Indications", placeholder: "e.g. Adult, Pediatric & Neonatal Monitoring" },
    ],
  },
  {
    category: "Physical & Material",
    icon: Layers,
    items: [
      { key: "Material Composition", placeholder: "Medical-Grade Silicone, Latex-Free" },
      { key: "Sterility Status", placeholder: "Sterile (EO Gas / Gamma) / Non-Sterile" },
      { key: "Gauge / Size", placeholder: "e.g. 18G / 20G / 22G, 500ml" },
      { key: "Shelf Life", placeholder: "e.g. 3 Years / 5 Years from date of manufacture" },
    ],
  },
  {
    category: "Power & Environment",
    icon: Thermometer,
    items: [
      { key: "Power Supply", placeholder: "100-240V AC, 50/60 Hz / Internal Backup Battery" },
      { key: "Battery Runtime", placeholder: "e.g. Up to 4 hours continuous operation" },
      { key: "Operating Temperature", placeholder: "10°C to 40°C (50°F to 104°F)" },
      { key: "Storage Humidity", placeholder: "15% to 90% non-condensing" },
    ],
  },
];

interface StepAiSpecsProps {
  onGenerateAiContent: () => Promise<void>;
  isGenerating: boolean;
}

export function StepAiSpecs({ onGenerateAiContent, isGenerating }: StepAiSpecsProps) {
  const { register, watch, setValue } = useFormContext<ProductWizardFormData>();

  const shortDescVal = watch("short_description") || "";
  const descVal = watch("description") || "";
  const specificationsObj = watch("specifications") || {};
  const tagsVal = watch("tags") || [];

  const [tagInput, setTagInput] = useState("");
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  const specEntries = useMemo(() => Object.entries(specificationsObj), [specificationsObj]);

  const handleSpecChange = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...specificationsObj };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = newValue;
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleSpecDelete = (keyToDelete: string) => {
    const updated = { ...specificationsObj };
    delete updated[keyToDelete];
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleSpecAdd = (presetKey?: string, defaultVal = "") => {
    const updated = { ...specificationsObj };
    let newKey = presetKey || "New Specification";
    let counter = 1;
    while (newKey in updated) {
      newKey = `${presetKey || "New Specification"} ${counter}`;
      counter++;
    }
    updated[newKey] = defaultVal;
    setValue("specifications", updated, { shouldValidate: true, shouldDirty: true });
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tagsVal.includes(cleanTag)) {
      setValue("tags", [...tagsVal, cleanTag], { shouldValidate: true, shouldDirty: true });
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tagsVal.filter((t) => t !== tagToRemove),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. MedAI Assist Banner */}
      <Card className="border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shrink-0 shadow-sm">
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                  MedAI Catalog Intelligence (Google Gemini)
                </h3>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300/90 mt-0.5">
                Auto-generate clinical copywriting, regulatory parameters, technical specifications, and search keywords.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onGenerateAiContent}
            disabled={isGenerating}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shrink-0 shadow-sm transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating MedAI Content...
              </>
            ) : (
              <>
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Run MedAI Auto-Fill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 2. Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ===================== COLUMN 1: Clinical Descriptions & Summaries ===================== */}
        <div className="space-y-6">
          <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" /> Clinical Descriptions & Summaries
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Overview summary for catalog listing cards and full medical copy for the product details page.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                Column 1
              </Badge>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-6">
              {/* Short Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="short_description" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    Short Overview Summary
                    <span className="text-[10px] font-normal lowercase text-zinc-400 font-mono">(listing card preview)</span>
                  </Label>
                  <span className={`text-[10px] font-mono ${shortDescVal.length > 450 ? "text-amber-500 font-bold" : "text-zinc-400"}`}>
                    {shortDescVal.length}/500 chars
                  </span>
                </div>
                <Textarea
                  id="short_description"
                  {...register("short_description")}
                  rows={3}
                  maxLength={500}
                  placeholder="Concise 1-2 sentence overview highlighting target clinical settings, primary benefits, and core utility..."
                  className="text-xs border-zinc-300 dark:border-zinc-700 font-sans leading-relaxed focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Long Description using Tiptap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    Detailed Clinical Description & Applications
                    <span className="text-[10px] font-normal lowercase text-zinc-400 font-mono">(Tiptap rich text)</span>
                  </Label>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {descVal ? descVal.replace(/<[^>]*>/g, "").length : 0} chars
                  </span>
                </div>
                <RichTextEditor
                  value={descVal}
                  onChange={(val) => setValue("description", val, { shouldValidate: true, shouldDirty: true })}
                  placeholder="Comprehensive clinical applications, key device capabilities, indications, and workflow features..."
                  minHeight="min-h-[260px]"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3 text-zinc-400 inline" />
                  Format with headings, lists, quotes, and bold text for optimal storefront presentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================== COLUMN 2: Specs & Tags ===================== */}
        <div className="space-y-6">
          {/* Card 1: Technical & Regulatory Specifications */}
          <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-zinc-500" /> Technical & Regulatory Specifications
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Structured technical parameters and compliance data.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSpecAdd()}
                className="text-xs font-semibold border-zinc-300 dark:border-zinc-700 shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Parameter
              </Button>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Categorized Medical Spec Presets */}
              <div className="space-y-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Presets:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono text-zinc-500">
                    {MEDICAL_SPEC_CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() => setSelectedCategoryIdx(idx)}
                        className={`px-2 py-0.5 rounded transition-all ${
                          selectedCategoryIdx === idx
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                            : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {cat.category.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Presets in active category */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {MEDICAL_SPEC_CATEGORIES[selectedCategoryIdx].items.map((p) => {
                    const isAdded = p.key in specificationsObj;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => handleSpecAdd(p.key)}
                        disabled={isAdded}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                          isAdded
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-zinc-700 dark:text-zinc-300 font-medium"
                        }`}
                      >
                        <Plus className="h-3 w-3 text-emerald-600" /> {p.key}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specifications Key-Value List */}
              {specEntries.length === 0 ? (
                <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-center text-xs text-zinc-400 space-y-1.5 rounded-md">
                  <Cpu className="h-5 w-5 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <p className="font-semibold text-zinc-600 dark:text-zinc-400">No technical parameters added yet</p>
                  <p className="text-[11px] text-zinc-400">
                    Click a preset above or click &quot;Add Parameter&quot; to add specifications.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
                    <span className="col-span-5">Parameter Key</span>
                    <span className="col-span-6">Value / Details</span>
                    <span className="col-span-1 text-center">Del</span>
                  </div>
                  {specEntries.map(([key, val], idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
                      <div className="col-span-5">
                        <Input
                          value={key}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecChange(key, e.target.value, val)}
                          placeholder="e.g. PPB Classification"
                          className="font-mono text-xs border-zinc-300 dark:border-zinc-700 font-semibold h-8"
                        />
                      </div>
                      <div className="col-span-6">
                        <Input
                          value={val}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecChange(key, key, e.target.value)}
                          placeholder="e.g. Class B / 100-240V AC"
                          className="text-xs border-zinc-300 dark:border-zinc-700 h-8"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSpecDelete(key)}
                          className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                          title="Remove specification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Search Keywords & Catalog Tags */}
          <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950 shadow-sm">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3 px-4">
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Tag className="h-4 w-4 text-zinc-500" /> Search Keywords & Catalog Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add search keyword tag (press Enter or comma)..."
                  className="text-xs border-zinc-300 dark:border-zinc-700 flex-1 h-8"
                />
                <Button type="button" size="sm" onClick={handleAddTag} className="text-xs font-semibold h-8">
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tagsVal.length === 0 ? (
                  <span className="text-xs text-zinc-400 italic">No search tags assigned yet.</span>
                ) : (
                  tagsVal.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs font-mono py-0.5 px-2.5 flex items-center gap-1.5">
                      {t}
                      <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-500 ml-0.5 font-bold">
                        ✕
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

