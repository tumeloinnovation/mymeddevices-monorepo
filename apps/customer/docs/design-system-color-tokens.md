# Design System Color Tokens

This document provides guidance on using semantic CSS color tokens in the dashboard and throughout the customer app.

## Semantic Color Tokens (Use These)

```css
/* Text Colors */
text-foreground           /* Primary text color */
text-muted-foreground     /* Secondary text, descriptions */

/* Background Colors */
bg-background            /* Main page background */
bg-card                  /* Card backgrounds */
bg-muted                 /* Subtle sections, grouped content */
bg-primary               /* Primary brand color background */
text-primary             /* Primary brand color text */

/* Border & UI */
border-border            /* Default borders */
border-input             /* Form input borders */
ring-offset-background    /* Focus ring offset */

/* Interactive */
hover:bg-muted            /* Hover state for cards/items */
hover:text-foreground      /* Hover state for text */

/* Status */
text-destructive         /* Error text */
bg-destructive           /* Error background */
border-destructive       /* Error borders */
```

## ❌ Avoid: Hardcoded Color Classes

```tsx
/* BAD - Hardcoded slate colors */
<div className="text-slate-900 bg-slate-50 border-slate-200">
<p className="text-slate-500">
```

## ✅ Correct: Semantic Tokens

```tsx
/* GOOD - Semantic color tokens */
<div className="text-foreground bg-muted border-border">
<p className="text-muted-foreground">
```

## Typography Scale with Color Tokens

```tsx
<h1 className="text-2xl font-bold text-foreground">           {/* Page titles */}
<h2 className="text-lg font-semibold text-foreground">          {/* Section headers */}
<h3 className="text-base font-medium text-foreground">         {/* Card titles */}
<p className="text-sm text-muted-foreground">                  {/* Body text */}
<label className="text-sm font-medium text-foreground">       {/* Form labels */}
<small className="text-xs text-muted-foreground">             {/* Helper text */}
```

## Component Examples

### Cards
```tsx
<Card className="bg-card border-border">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">Description</CardDescription>
  </CardHeader>
  <CardContent className="text-foreground">
    {/* Content */}
  </CardContent>
</Card>
```

### Buttons
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
<Button variant="outline" className="border-border hover:bg-muted">
<Button variant="ghost" className="hover:bg-muted hover:text-foreground">
```

### Form Elements
```tsx
<Input className="bg-background border-border text-foreground" />
<Label className="text-foreground">Label</Label>
<p className="text-xs text-muted-foreground">Helper text</p>
```

### Tables
```tsx
<thead className="border-border bg-muted">
  <tr className="border-border">
    <th className="text-foreground">Header</th>
<tbody className="text-foreground bg-background">
  <tr className="border-border hover:bg-muted">
    <td className="text-muted-foreground">Cell</td>
```

## Status Colors

```tsx
{/* Success */}
<div className="text-green-600 dark:text-green-400">
<div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">

{/* Warning */}
<div className="text-amber-600 dark:text-amber-400">
<div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">

{/* Error */}
<div className="text-destructive">
<div className="bg-destructive/10 text-destructive">

{/* Info */}
<div className="text-blue-600 dark:text-blue-400">
<div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
```

## Dark Mode Compatibility

Using semantic tokens ensures proper dark mode support:

- `text-foreground` automatically switches between light/dark text
- `bg-card` adjusts for dark mode
- `border-border` provides appropriate contrast

## Migration Examples

### Before (Hardcoded)
```tsx
<div className="bg-slate-50 text-slate-900 border-slate-200 p-4 rounded-lg">
  <h3 className="text-slate-800 font-semibold">Title</h3>
  <p className="text-slate-500">Description</p>
</div>
```

### After (Semantic)
```tsx
<div className="bg-muted text-foreground border-border p-4 rounded-lg">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

## Checklist for New Components

When creating new UI components, ensure:

- [ ] Use `text-foreground` for primary text
- [ ] Use `text-muted-foreground` for secondary text
- [ ] Use `bg-card` for card backgrounds
- [ ] Use `bg-muted` for subtle sections
- [ ] Use `border-border` for borders
- [ ] Avoid hardcoded `text-slate-*` classes
- [ ] Avoid hardcoded `bg-slate-*` classes
- [ ] Test in both light and dark modes

## Benefits

1. **Dark Mode Support**: Automatic dark mode compatibility
2. **Consistency**: Unified color system across the app
3. **Theming**: Easy to change color schemes
4. **Accessibility**: Better contrast ratios
5. **Maintainability**: Single source of truth for colors
