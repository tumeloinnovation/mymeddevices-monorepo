"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings, Save, RotateCcw, DollarSign, Percent, Info, Check } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface FeeSettings {
  markupThresholdLow: number;
  markupPercentLow: number;
  markupThresholdMedium: number;
  markupPercentMedium: number;
  markupPercentHigh: number;
  commissionFeePercent: number;
}

const defaultSettings: FeeSettings = {
  markupThresholdLow: 10000,
  markupPercentLow: 5.0,
  markupThresholdMedium: 50000,
  markupPercentMedium: 3.0,
  markupPercentHigh: 2.0,
  commissionFeePercent: 2.0,
};

export default function PlatformFeesSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<FeeSettings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<FeeSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem("platform_fee_settings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setOriginalSettings(parsed);
    }
  }, []);

  const handleChange = (field: keyof FeeSettings, value: number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem("platform_fee_settings", JSON.stringify(settings));
      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success("Platform fee settings updated successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    toast.info("Restored to default settings. Save to apply.");
  };

  const calculateExample = (price: number) => {
    let percent = settings.markupPercentHigh;
    if (price <= settings.markupThresholdLow) {
      percent = settings.markupPercentLow;
    } else if (price <= settings.markupThresholdMedium) {
      percent = settings.markupPercentMedium;
    }
    const markup = Math.round((price * (percent / 100)) * 100) / 100;
    const commission = Math.round((price * (settings.commissionFeePercent / 100)) * 100) / 100;
    const total = Math.round((price + markup + commission) * 100) / 100;
    return { price, markup, commission, total, percent };
  };

  const examples = [5000, 15000, 75000].map(calculateExample);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {}
        <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Platform Fee Configuration
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Configure markup tiers and commission rates for product pricing
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 space-y-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4 text-emerald-600" />
                  Markup Fee Tiers
                </CardTitle>
                <CardDescription>
                  Platform markup percentage based on seller base price ranges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tier 1: Low Price Products</Label>
                    <Badge variant="outline" className="text-xs">
                      ≤ KES {settings.markupThresholdLow.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="thresholdLow" className="text-xs text-zinc-500">Price Threshold (KES)</Label>
                      <Input
                        id="thresholdLow"
                        type="number"
                        value={settings.markupThresholdLow}
                        onChange={(e) => handleChange("markupThresholdLow", Number(e.target.value))}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="percentLow" className="text-xs text-zinc-500">Markup Percentage (%)</Label>
                      <Input
                        id="percentLow"
                        type="number"
                        step="0.1"
                        value={settings.markupPercentLow}
                        onChange={(e) => handleChange("markupPercentLow", Number(e.target.value))}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tier 2: Medium Price Products</Label>
                    <Badge variant="outline" className="text-xs">
                      KES {settings.markupThresholdLow.toLocaleString()} - {settings.markupThresholdMedium.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="thresholdMedium" className="text-xs text-zinc-500">Price Threshold (KES)</Label>
                      <Input
                        id="thresholdMedium"
                        type="number"
                        value={settings.markupThresholdMedium}
                        onChange={(e) => handleChange("markupThresholdMedium", Number(e.target.value))}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="percentMedium" className="text-xs text-zinc-500">Markup Percentage (%)</Label>
                      <Input
                        id="percentMedium"
                        type="number"
                        step="0.1"
                        value={settings.markupPercentMedium}
                        onChange={(e) => handleChange("markupPercentMedium", Number(e.target.value))}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Tier 3: High Price Products</Label>
                    <Badge variant="outline" className="text-xs">
                      &gt; KES {settings.markupThresholdMedium.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-sm text-zinc-500 py-2">Automatic tier (no threshold)</div>
                    <div>
                      <Label htmlFor="percentHigh" className="text-xs text-zinc-500">Markup Percentage (%)</Label>
                      <Input
                        id="percentHigh"
                        type="number"
                        step="0.1"
                        value={settings.markupPercentHigh}
                        onChange={(e) => handleChange("markupPercentHigh", Number(e.target.value))}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Commission Fee
                </CardTitle>
                <CardDescription>
                  Additional platform commission on seller base price
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commissionPercent" className="text-xs text-zinc-500">Commission Percentage (%)</Label>
                    <Input
                      id="commissionPercent"
                      type="number"
                      step="0.1"
                      value={settings.commissionFeePercent}
                      onChange={(e) => handleChange("commissionFeePercent", Number(e.target.value))}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="text-sm text-zinc-500 py-2">
                    Applied to all seller prices regardless of tier
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <div className="space-y-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || loading}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <></>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleRestoreDefaults}
                  variant="ghost"
                  className="w-full text-xs"
                >
                  Restore Defaults
                </Button>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Pricing Preview
                </CardTitle>
                <CardDescription>
                  Example calculations with current settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {examples.map((example) => (
                  <div key={example.price} className="border-b border-zinc-200 dark:border-zinc-800 pb-3 last:border-0">
                    <div className="text-xs text-zinc-500 mb-2">
                      Vendor Payout: <span className="font-semibold">KES {example.price.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-amber-600">Markup Fee ({example.percent}%):</span>
                        <span className="font-mono">KES {example.markup.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Commission ({settings.commissionFeePercent}%):</span>
                        <span className="font-mono">KES {example.commission.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t border-zinc-200 dark:border-zinc-700">
                        <span className="text-emerald-600">Customer Price:</span>
                        <span className="font-mono text-emerald-600">KES {example.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-300 mb-1">How it works</p>
                  <p className="text-blue-600 dark:text-blue-400">
                    The platform adds a markup fee based on the wholesale price tier, plus a commission fee. The customer pays the vendor payout plus both fees.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
