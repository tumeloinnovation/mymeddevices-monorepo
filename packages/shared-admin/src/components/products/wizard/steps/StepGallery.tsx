"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Upload, X, AlertCircle, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { useProductWizardStore } from "../use-product-wizard-store";
import { cn } from "../../../../lib/utils";

interface SortableImageItemProps {
  id: number;
  src: string;
  isPrimary: boolean;
  onSetPrimary: (idx: number) => void;
  onRemove: (idx: number) => void;
  shotType?: string;
}

function SortableImageItem({ id, src, isPrimary, onSetPrimary, onRemove, shotType }: SortableImageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square border-2 cursor-pointer group bg-zinc-100 dark:bg-zinc-900 overflow-hidden",
        isPrimary
          ? "border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/20"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
      )}
    >
      <button
        type="button"
        className="absolute top-1 left-1 bg-zinc-900/60 text-white p-1.5 rounded hover:bg-zinc-700 transition-colors z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      <img src={src} alt="Preview" className="w-full h-full object-cover" onClick={() => onSetPrimary(id)} />

      {shotType && (
        <div className="absolute top-1 right-10 bg-indigo-600/90 text-white text-[8px] font-mono uppercase px-1.5 py-0.5 rounded">
          {shotType.replace("_", " ")}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="absolute top-1 right-1 bg-zinc-900/80 text-white p-1 hover:bg-rose-600 transition-colors z-10"
      >
        <X className="h-3 w-3" />
      </button>

      {isPrimary && (
        <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[9px] font-mono uppercase text-center py-0.5 font-bold">
          Primary Image
        </span>
      )}
    </div>
  );
}

interface StepGalleryProps {
  images: File[];
  imagePreviews: string[];
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
}

export function StepGallery({ images, imagePreviews, setImages, setImagePreviews }: StepGalleryProps) {
  const { primaryImageIndex, setPrimaryImage, imageShotTypes } = useProductWizardStore();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = imagePreviews.findIndex((_, idx) => idx === active.id);
      const newIndex = imagePreviews.findIndex((_, idx) => idx === over.id);

      setImages((prev) => arrayMove(prev, oldIndex, newIndex));
      setImagePreviews((prev) => arrayMove(prev, oldIndex, newIndex));

      if (primaryImageIndex === oldIndex) {
        setPrimaryImage(newIndex);
      } else if (primaryImageIndex === newIndex) {
        setPrimaryImage(oldIndex);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = Array.from(e.target.files || []);
    const MAX_SIZE = 10 * 1024 * 1024;

    const oversized = files.filter((f) => f.size > MAX_SIZE);
    if (oversized.length > 0) {
      setUploadError(`${oversized.length} file(s) exceed 10MB limit and were skipped.`);
    }

    const validFiles = files.filter((f) => f.size <= MAX_SIZE);
    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
      const newPreviews = validFiles.map((f) => URL.createObjectURL(f));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-200 dark:border-zinc-800 py-3.5 px-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-semibold uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-zinc-500" /> Clinical Equipment Gallery
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Upload equipment photos, set primary display thumbnail, and arrange display order (minimum 1 image required)
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Step 4 of 6</Badge>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {uploadError && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-3 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-rose-700 dark:text-rose-300">
                <span className="font-semibold block mb-0.5">Upload Error</span>
                {uploadError}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {imagePreviews.length} image{imagePreviews.length !== 1 ? "s" : ""} uploaded
              </span>
              {imagePreviews.length >= 1 ? (
                <Badge variant="outline" className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border-emerald-200">
                  Minimum requirement met
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] font-mono bg-amber-50 text-amber-700 border-amber-200">
                  1 image required
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-zinc-400">Drag to reorder • Click to set primary</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={imagePreviews.map((_, idx) => idx)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviews.map((src, idx) => (
                  <SortableImageItem
                    key={src}
                    id={idx}
                    src={src}
                    isPrimary={idx === primaryImageIndex}
                    onSetPrimary={(i) => setPrimaryImage(i)}
                    onRemove={(i) => {
                      setImages((prev) => prev.filter((_, index) => index !== i));
                      setImagePreviews((prev) => prev.filter((_, index) => index !== i));
                      if (primaryImageIndex === i) setPrimaryImage(0);
                    }}
                    shotType={imageShotTypes[idx]}
                  />
                ))}

                <label className="aspect-square border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex flex-col items-center justify-center cursor-pointer p-4 transition-colors">
                  <Upload className="h-6 w-6 text-zinc-400 mb-2" />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-center">Upload Photos</span>
                  <span className="text-[10px] text-zinc-400 text-center mt-0.5">PNG, JPG up to 10MB each</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  );
}
