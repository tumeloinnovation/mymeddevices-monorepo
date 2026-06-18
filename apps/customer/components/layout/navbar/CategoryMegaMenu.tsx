import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'
import Link from 'next/link'

type SubCategory = {
  name: string
  href: string
}

type Category = {
  name: string
  href: string
  description?: string
  icon?: React.ReactNode
  subcategories?: SubCategory[]
}

const sampleCategories: Category[] = [
  {
    name: 'Pharmacy',
    href: '/categories/pharmacy',
    description: 'Prescription medicines, OTC and more',
    icon: <MapPin />,
    subcategories: [
      { name: 'Analgesics', href: '/categories/pharmacy/analgesics' },
      { name: 'Antibiotics', href: '/categories/pharmacy/antibiotics' },
      { name: 'Cough & Cold', href: '/categories/pharmacy/cough-cold' },
    ],
  },
  {
    name: 'Medical Equipment',
    href: '/categories/equipment',
    description: 'Home medical devices & supplies',
    subcategories: [
      { name: 'Blood Pressure', href: '/categories/equipment/bp' },
      { name: 'Diabetic Care', href: '/categories/equipment/diabetic' },
      { name: 'Mobility', href: '/categories/equipment/mobility' },
    ],
  },
  {
    name: 'Wellness',
    href: '/categories/wellness',
    description: 'Supplements, vitamins & personal care',
    subcategories: [
      { name: 'Vitamins', href: '/categories/wellness/vitamins' },
      { name: 'Supplements', href: '/categories/wellness/supplements' },
      { name: 'Personal Care', href: '/categories/wellness/personal-care' },
    ],
  },
]

export const CategoryMegaMenu: React.FC = () => {
  return (
    // The component now only renders the inner card content without absolute positioning
    // so it can be placed inside a NavigationMenu Content or viewport.
    // Add an explicit bg and z-index to avoid being invisible due to theme variables
    <div className="w-full px-2">
      <Card className=" bg-white dark:bg-slate-900">
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6">
          {Array.isArray(sampleCategories) && sampleCategories.map((cat) => (
            <div key={cat.name} className="space-y-2">
              <Link href={cat.href} className="flex items-center gap-2 text-foreground hover:text-primary">
                <span className="w-8 h-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground">{cat.icon ?? <MapPin />}</span>
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  {cat.description && <div className="text-sm text-muted-foreground">{cat.description}</div>}
                </div>
              </Link>

              {cat.subcategories && (
                <ul className="mt-2 space-y-1">
                  {Array.isArray(cat.subcategories) && cat.subcategories.map((sc) => (
                    <li key={sc.name}>
                      <Link href={sc.href} className="text-sm text-muted-foreground hover:text-foreground block">{sc.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {/* Right side promotional card */}
          <div className="col-span-1">
            <div className="flex h-full flex-col justify-between rounded-md border border-border p-4">
              <div>
                <h4 className="text-lg font-semibold">Quick Picks</h4>
                <p className="text-sm text-muted-foreground mt-2">Popular categories and deals curated for you.</p>
                <div className="mt-4 grid gap-2">
                  <Link href="/offers" className="text-sm text-primary hover:underline">Today's Offers</Link>
                  <Link href="/new-arrivals" className="text-sm text-primary hover:underline">New Arrivals</Link>
                  <Link href="/brands" className="text-sm text-primary hover:underline">Top Brands</Link>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/categories">Browse all categories</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CategoryMegaMenu
