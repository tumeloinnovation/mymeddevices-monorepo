'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Layout, Eye, Save, Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { customerService } from '@/lib/services/customer-service'

interface DashboardPreferences {
  language: string
  timezone: string
  itemsPerPage: number
  defaultSort: string
  showRecentlyViewed: boolean
  reducedMotion: boolean
  fontSize: string
  highContrast: boolean
}

const defaultPreferences: DashboardPreferences = {
  language: 'en',
  timezone: 'eat',
  itemsPerPage: 24,
  defaultSort: 'newest',
  showRecentlyViewed: true,
  reducedMotion: false,
  fontSize: 'normal',
  highContrast: false,
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<DashboardPreferences>(defaultPreferences)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadPreferences() {
      try {
        const profile = await customerService.getProfile()
        setPrefs({
          language: profile.language || defaultPreferences.language,
          timezone: profile.timezone || defaultPreferences.timezone,
          itemsPerPage: profile.items_per_page || defaultPreferences.itemsPerPage,
          defaultSort: profile.default_sort || defaultPreferences.defaultSort,
          showRecentlyViewed: profile.show_recently_viewed ?? defaultPreferences.showRecentlyViewed,
          reducedMotion: profile.reduced_motion ?? defaultPreferences.reducedMotion,
          fontSize: profile.font_size || defaultPreferences.fontSize,
          highContrast: profile.high_contrast ?? defaultPreferences.highContrast,
        })
      } catch {
        toast.error('Failed to load preferences')
      } finally {
        setLoaded(true)
      }
    }
    loadPreferences()
  }, [])

  const update = <K extends keyof DashboardPreferences>(
    key: K,
    value: DashboardPreferences[K]
  ) => {
    setPrefs((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await customerService.updateProfile({
        language: prefs.language,
        timezone: prefs.timezone,
        items_per_page: prefs.itemsPerPage,
        default_sort: prefs.defaultSort,
        show_recently_viewed: prefs.showRecentlyViewed,
        reduced_motion: prefs.reducedMotion,
        font_size: prefs.fontSize,
        high_contrast: prefs.highContrast,
      })
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      await customerService.updateProfile({
        language: defaultPreferences.language,
        timezone: defaultPreferences.timezone,
        items_per_page: defaultPreferences.itemsPerPage,
        default_sort: defaultPreferences.defaultSort,
        show_recently_viewed: defaultPreferences.showRecentlyViewed,
        reduced_motion: defaultPreferences.reducedMotion,
        font_size: defaultPreferences.fontSize,
        high_contrast: defaultPreferences.highContrast,
      })
      setPrefs(defaultPreferences)
      toast.success('Preferences reset to defaults')
    } catch {
      toast.error('Failed to reset preferences')
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground">Customize your dashboard and shopping experience.</p>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Preferences</h1>
        <p className="text-muted-foreground mt-2">Customize your dashboard and shopping experience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="size-5" />
              Dashboard Preferences
            </CardTitle>
            <CardDescription>Control how your dashboard and product listings look</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="items-per-page">Items Per Page</Label>
              <Select
                value={String(prefs.itemsPerPage)}
                onValueChange={(v) => update('itemsPerPage', Number(v))}
              >
                <SelectTrigger id="items-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                  <SelectItem value="96">96</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-sort">Default Sort Order</Label>
              <Select value={prefs.defaultSort} onValueChange={(v) => update('defaultSort', v)}>
                <SelectTrigger id="default-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <Label htmlFor="show-recently-viewed">Recently Viewed</Label>
                <p className="text-sm text-muted-foreground">Show recently viewed products</p>
              </div>
              <Switch
                id="show-recently-viewed"
                checked={prefs.showRecentlyViewed}
                onCheckedChange={(v) => update('showRecentlyViewed', v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="size-5" />
              Accessibility
            </CardTitle>
            <CardDescription>Adjust settings for a better experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select value={prefs.fontSize} onValueChange={(v) => update('fontSize', v)}>
                <SelectTrigger id="font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xlarge">Extra Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reduced-motion">Reduced Motion</Label>
                <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
              </div>
              <Switch
                id="reduced-motion"
                checked={prefs.reducedMotion}
                onCheckedChange={(v) => update('reducedMotion', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="high-contrast">High Contrast</Label>
                <p className="text-sm text-muted-foreground">Increase color contrast for better readability</p>
              </div>
              <Switch
                id="high-contrast"
                checked={prefs.highContrast}
                onCheckedChange={(v) => update('highContrast', v)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleReset} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
