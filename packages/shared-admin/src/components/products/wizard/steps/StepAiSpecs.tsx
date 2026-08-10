"use client";

import React, { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Sparkles, Loader2, Zap, Plus, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Textarea } from "../../../ui/textarea";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { ProductWizardFormData } from "../product-wizard-schema";

const SPEC_PRESETS = [
  { key: "Power Supply", category: "Technical" },
  { key: "Certifications", category: "Regulatory" },
  { key: "Regulatory Approval", category: "Regulatory" },
  { key: "Warranty", category: "Support" },
  { key: "Dimensions", category: "Physical" },
  { key: "Operating Temp", category: "Technical" },
  { key: "Display Type", category: "Technical" },
  { key: "Measurement Range", category: "Clinical" },
  { key: "Sample Type", category: "Clinical" },
  { key: "Response Time", category: "Clinical" },
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

  const handleSpecAdd = (presetKey?: string) => {
    const updated = { ...specificationsObj };
    let newKey = presetKey || "New Specification";
    let counter = 1;
    while (newKey in updated) {
      newKey = `${presetKey || "New Specification"} ${counter}`;
      counter++;
    }
    updated[newKey] = "";
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
    setValue("tags", tagsVal.filter((t) => t !== tagToRemove), { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/10">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                MedAI Content Generator (Google Gemini)
              </h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Auto-generate clinical description, technical specs, search keywords & SEO metadata
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={onGenerateAiContent}
            disabled={isGenerating}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Zap className="mr-1.5 h-3.5 w-3.5" /> Run MedAI Auto-Fill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
            Product Descriptions & Summaries
          </CardTitle>
          <Badge variant="outline" className="text-[9px] font-mono bg-amber-50 text-amber-700 border-amber-200">
            Recommended
          </Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="short_description" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Short Overview Summary
              </Label>
              <span className={`text-[9px] font-mono ${shortDescVal.length > 180 ? "text-amber-500" : "text-zinc-400"}`}>
                {shortDescVal.length}/200
              </span>
            </div>
            <Textarea
              id="short_description"
              {...register("short_description")}
              rows={2}
              maxLength={200}
              placeholder="Brief 1-2 sentence overview for product card previews..."
              className="text-xs border-zinc-300 dark:border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                Detailed Clinical Description
              </Label>
              <span className={`text-[9px] font-mono ${descVal.length > 1800 ? "text-amber-500" : "text-zinc-400"}`}>
                {descVal.length}/2000
              </span>
            </div>
            <Textarea
              id="description"
              {...register("description")}
              rows={5}
              maxLength={2000}
              placeholder="Comprehensive clinical applications, features, and device capabilities..."
              className="text-xs border-zinc-300 dark:border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
            Technical Specifications (Key-Value)
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSpecAdd()}
            className="text-xs font-semibold border-zinc-300 dark:border-zinc-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Parameter
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 mr-1 flex-shrink-0">Presets:</span>
            {SPEC_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSpecAdd(p.key)}
                className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-2 py-0.5 whitespace-nowrap hover:border-zinc-500"
              >
                + {p.key}
              </button>
            ))}
          </div>

          {specEntries.length === 0 ? (
            <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-center text-xs text-zinc-400">
              No technical parameters added yet. Click "Add Parameter" or select a quick preset above.
            </div>
          ) : (
            <div className="space-y-2">
              {specEntries.map(([key, val], idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={key}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecChange(key, e.target.value, val)}
                    placeholder="Parameter Name"
                    className="font-mono text-xs border-zinc-300 dark:border-zinc-700 w-1/3"
                  />
                  <Input
                    value={val}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSpecChange(key, key, e.target.value)}
                    placeholder="Value"
                    className="text-xs border-zinc-300 dark:border-zinc-700 flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSpecDelete(key)}
                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Tag className="h-4 w-4 text-zinc-500" /> Search Keywords & Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
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
              placeholder="Add keyword tag (press Enter or comma)..."
              className="text-xs border-zinc-300 dark:border-zinc-700 flex-1"
            />
            <Button type="button" size="sm" onClick={handleAddTag} className="text-xs font-semibold">
              Add Tag
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagsVal.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs font-mono py-1 px-2 flex items-center gap-1">
                {t}
                <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-rose-500 ml-1">
                  ✕
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
