
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Category } from "@/lib/data/types";

type CategoryTreeProps = {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
};

const CategoryListItem = ({ category, selectedCategories, onCategoryChange }: { category: Category, selectedCategories: string[], onCategoryChange: (category: string) => void }) => {
  const hasSubCategories = category.subCategories && category.subCategories.length > 0;

  return (
    <div className="ml-4">
      {hasSubCategories ? (
        <Accordion type="single" collapsible>
          <AccordionItem value={category.name}>
            <AccordionTrigger>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={category.name}
                  checked={selectedCategories.includes(category.name)}
                  onChange={() => onCategoryChange(category.name)}
                  className="mr-2"
                />
                <label htmlFor={category.name}>{category.name}</label>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {category.subCategories?.map(subCategory => (
                <CategoryListItem key={subCategory.name} category={subCategory} selectedCategories={selectedCategories} onCategoryChange={onCategoryChange} />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            id={category.name}
            checked={selectedCategories.includes(category.name)}
            onChange={() => onCategoryChange(category.name)}
            className="mr-2"
          />
          <label htmlFor={category.name}>{category.name}</label>
        </div>
      )}
    </div>
  );
};

export const CategoryTree = ({ categories, selectedCategories, onCategoryChange }: CategoryTreeProps) => {
  return (
    <>
      {categories.map(category => (
        <CategoryListItem key={category.name} category={category} selectedCategories={selectedCategories} onCategoryChange={onCategoryChange} />
      ))}
    </>
  );
};