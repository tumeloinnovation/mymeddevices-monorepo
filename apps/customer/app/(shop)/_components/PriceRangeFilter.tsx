"use client";
import React, { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { usePriceDistribution } from "@/lib/hooks/usePriceDistribution";
import { useShopFilters } from "@/lib/context/ShopFiltersContext";


export const PriceRangeFilter: React.FC = () => {
  const { filters, setFilter } = useShopFilters();
  const [min, max] = filters.priceRange;

  const { data, isLoading } = usePriceDistribution();

  return (
    <div>
      {/* Label */}
      <label className="text-sm font-semibold mb-4 text-foreground border-b border-border pb-2 block">
        Price Range
      </label>

      {/* Chart */}
      <div className="w-full h-20 mb-4">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading price distribution...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-sm text-muted-foreground">No price data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="priceColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--muted))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis dataKey="price" hide />
              <YAxis hide />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value, name, props) => [`${value} items`, "KSH"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="url(#priceColor)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Slider */}
      <div className="mb-4">
        <Slider
                min={0}
                max={10000} // Set a higher max
                step={100}
                value={filters.priceRange}
                onValueChange={(val) => setFilter("priceRange", [val[0], val[1]])}
            />
      </div>

      {/* Min / Max Inputs */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">KSH</span>
          <Input
            type="number"
            value={min}
            onChange={(e) =>
                    setFilter("priceRange", [Number(e.target.value), Math.max(max, Number(e.target.value))])
                }
            className="h-9 w-32 text-sm border-border pl-12"
            placeholder="0"
          />
        </div>
        <span className="text-muted-foreground">—</span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">KSH</span>
          <Input
            type="number"
            value={max}
           onChange={(e) =>
                    setFilter("priceRange", [Math.min(min, Number(e.target.value)), Number(e.target.value)])
                }
            className="h-9 w-32 text-sm border-border pl-12"
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
};

export default PriceRangeFilter;
