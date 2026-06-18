"use client";
import React, { useState } from 'react';

import { Category } from '@/lib/data/types';

type Props = {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
};

const ToggleIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <span className="inline-flex items-center justify-center w-5 h-5 text-sm font-semibold">
    {open ? '−' : '+'}
  </span>
);

const CategoryNode: React.FC<{
  node: Category;
  selectedCategories: string[];
  onCategoryChange: (c: string) => void;
}> = ({ node, selectedCategories, onCategoryChange }) => {
  const [open, setOpen] = useState(false);
  const isSelected = selectedCategories.includes(node.name);

  const hasChildren = node.subCategories && node.subCategories.length > 0;

  return (
    <li>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              aria-expanded={open}
              className="w-7 h-7 flex items-center justify-center border rounded-md bg-white"
            >
              <ToggleIcon open={open} />
            </button>
          ) : (
            <span className="w-7" />
          )}

          {/* Category / Subcategory box; leaf nodes include checkbox beside the name */}
          {!hasChildren ? (
            <>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onCategoryChange(node.name)}
                className="w-4 h-4"
                aria-label={`Select ${node.name}`}
              />
              <span>{node.name}</span>
            </>
          ) : (
            <>
              {node.name}
            </>
          )}
        </div>
      </div>

      {open && hasChildren && (
        <ul className="mt-3 space-y-2 ml-4">
          {node.subCategories!.map(sub => (
            <CategoryNode key={sub.name} node={sub} selectedCategories={selectedCategories} onCategoryChange={onCategoryChange} />
          ))}
        </ul>
      )}
    </li>
  );
};

export const CategoryFilter: React.FC<Props> = ({ categories, selectedCategories, onCategoryChange }) => {
  if (!categories || categories.length === 0) return <p className="text-sm text-muted-foreground">No categories</p>;

  return (
    <div>
      <ul className="space-y-2">
        {categories.map(cat => (
          <CategoryNode key={cat.name} node={cat} selectedCategories={selectedCategories} onCategoryChange={onCategoryChange} />
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter;
