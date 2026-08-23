"use client"

import * as React from "react"
import { useShopFilters } from "@/lib/context/ShopFiltersContext"
import { NavigationMenuLink } from "@/components/ui/navigation-menu"
import { useRouter } from "next/navigation"

interface CategoryListItemProps extends React.ComponentPropsWithoutRef<"a"> {
  slug: string
}

export const CategoryListItem = React.forwardRef<
  React.ElementRef<"a">,
  CategoryListItemProps
>(({ className, title, children, slug, ...props }, ref) => {
  const { setFilter } = useShopFilters()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setFilter("selectedCategory", slug)
    router.push(`/products?category=${slug}`)
  }

  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          onClick={handleClick}
          href={`/products?category=${slug}`}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})

CategoryListItem.displayName = "CategoryListItem"
