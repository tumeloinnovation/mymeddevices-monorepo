"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
} from "lucide-react";
import { catalogService } from "@mymeddevices/shared-core";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (created: number, updated: number) => void;
}

interface PreviewData {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  warnings_count: number;
  errors: Array<{ row: number; sku?: string; error: string; severity: string }>;
  warnings: Array<{ row: number; sku?: string; error: string; severity: string }>;
  preview_data: any[];
}

interface ImportResult {
  success: boolean;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  errors: Array<{ row: number; sku?: string; error: string; severity: string }>;
  warnings: Array<{ row: number; sku?: string; error: string; severity: string }>;
  created_products: string[];
  processing_time_seconds: number;
}

export function ProductsBulkImportModal({
  open,
  onOpenChange,
  onComplete,
}: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "result">(
    "upload"
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const handleDownloadTemplate = useCallback(() => {
    catalogService.downloadImportTemplate();
    toast.success("Template downloaded");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped?.name.endsWith(".csv")) {
        setFile(dropped);
      } else {
        toast.error("Please upload a CSV file");
      }
    },
    []
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  }, []);

  const handlePreview = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const previewData = await catalogService.bulkImportPreview(file);
      setPreview(previewData);

      if (previewData.invalid_rows === 0) {
        setStep("preview");
      } else if (previewData.valid_rows > 0) {
        toast.warning(
          `Found ${previewData.invalid_rows} errors. Review before importing.`
        );
        setStep("preview");
      } else {
        toast.error("No valid rows found. Please fix the errors and try again.");
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to preview file");
      setIsProcessing(false);
    }
  }, [file]);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setStep("importing");
    setIsProcessing(true);

    try {
      const importResult = await catalogService.bulkImport(file, {
        update_existing: updateExisting,
        skip_duplicates: skipDuplicates,
      });

      setResult(importResult);
      setStep("result");

      if (importResult.success) {
        toast.success(
          `Imported ${importResult.created_count} products, updated ${importResult.updated_count}.`
        );
        onComplete?.(importResult.created_count, importResult.updated_count);
      } else {
        toast.error(
          `Import completed with errors. Created ${importResult.created_count}, updated ${importResult.updated_count}.`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to import products");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  }, [file, updateExisting, skipDuplicates, onComplete]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    // Reset state after close animation
    setTimeout(() => {
      setStep("upload");
      setFile(null);
      setPreview(null);
      setResult(null);
      setUpdateExisting(false);
      setSkipDuplicates(true);
    }, 300);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === "upload" && "Bulk Import Products"}
            {step === "preview" && "Review Import"}
            {step === "importing" && "Importing Products"}
            {step === "result" && "Import Results"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {step === "upload" &&
              "Upload a CSV file to bulk import products. Download the template to see the required format."}
            {step === "preview" &&
              "Review the preview below before starting the import."}
            {step === "importing" && "Processing your import..."}
            {step === "result" && "See the import results below."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "upload" && (
            <div className="space-y-4">
              {/* Template Download */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>

              {/* File Upload */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drop your CSV file here
                </p>
                <p className="text-xs text-muted-foreground mb-3">or</p>
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button variant="secondary" size="sm" type="button" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
                {file && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={(checked) =>
                      setUpdateExisting(checked as boolean)
                    }
                  />
                  <Label htmlFor="update-existing" className="text-sm">
                    Update existing products with matching SKU
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) =>
                      setSkipDuplicates(checked as boolean)
                    }
                  />
                  <Label htmlFor="skip-duplicates" className="text-sm">
                    Skip duplicate SKUs in import
                  </Label>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && preview && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-success">
                    {preview.valid_rows}
                  </div>
                  <div className="text-xs text-muted-foreground">Valid Rows</div>
                </div>
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-destructive">
                    {preview.invalid_rows}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-warning">
                    {preview.warnings_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Warnings</div>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Errors ({preview.errors.length})
                  </h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {preview.errors.slice(0, 10).map((err, i) => (
                      <div
                        key={i}
                        className="text-xs text-destructive/80"
                      >
                        Row {err.row}: {err.error}
                        {err.sku && ` (${err.sku})`}
                      </div>
                    ))}
                    {preview.errors.length > 10 && (
                      <div className="text-xs text-destructive/60">
                        ... and {preview.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Sample */}
              {preview.preview_data.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2">
                    Sample Data (first {preview.preview_data.length} rows)
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {preview.preview_data.map((row, i) => (
                      <div
                        key={i}
                        className="text-xs bg-background border rounded p-2"
                      >
                        <div className="font-medium">{row.name}</div>
                        {row.sku && (
                          <div className="text-muted-foreground">SKU: {row.sku}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Processing your import...
              </p>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4">
              {/* Success/Failure Indicator */}
              <div
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border ${
                  result.success
                    ? "bg-success/10 border-success/20"
                    : "bg-warning/10 border-warning/20"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-warning" />
                )}
                <div className="text-sm font-medium">
                  {result.success
                    ? "Import completed successfully!"
                    : "Import completed with some errors"}
                </div>
              </div>

              {/* Results Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums">
                    {result.created_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums">
                    {result.updated_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums">
                    {result.skipped_count}
                  </div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="bg-card border rounded-lg p-3 text-center">
                  <div className="text-2xl font-semibold tabular-nums text-muted-foreground">
                    {result.processing_time_seconds}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Processing Time
                  </div>
                </div>
              </div>

              {/* Result Errors */}
              {result.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-destructive mb-2">
                    Errors ({result.errors.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {result.errors.slice(0, 10).map((err, i) => (
                      <div
                        key={i}
                        className="text-xs text-destructive/80"
                      >
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <div className="text-xs text-destructive/60">
                        ... and {result.errors.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Previewing...
                  </>
                ) : (
                  "Preview Import"
                )}
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={isProcessing}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || (preview?.invalid_rows ?? 0) > 0}
                className={preview?.invalid_rows ?? 0 > 0 ? "hidden" : ""}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${preview?.valid_rows} Products`
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
