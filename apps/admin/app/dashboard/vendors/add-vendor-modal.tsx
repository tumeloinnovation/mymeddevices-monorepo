"use client"

import React, { useState } from "react"
import { Building2, Mail, Phone, Store, Package, MapPin, CreditCard, CheckCircle, Wand2, Check } from "lucide-react"
import { useAuthStore, CreateVendorData } from "@mymeddevices/shared-core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface AddVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddVendorModal({ open, onOpenChange, onSuccess }: AddVendorModalProps) {
  const { createVendor } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CreateVendorData>({
    email: "",
    password: "",
    company_name: "",
    store_name: "",
    store_description: "",
    business_email: "",
    business_phone: "",
    phone: "",
    vat_number: "",
    address_street: "",
    address_city: "",
    address_region: "",
    address_country: "KE",
    mpesa_phone: "",
    mpesa_business_name: "",
    mpesa_till_number: "",
    mpesa_paybill_number: "",
    approval_status: "pending",
    auto_approve: false,
  })

  const steps = [
    { id: 1, label: "Account" },
    { id: 2, label: "Company" },
    { id: 3, label: "Address" },
    { id: 4, label: "Payment & Settings" },
  ]

  // Reset step on open/close
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (currentStep < 4) {
      handleNext()
      return
    }

    setLoading(true)
    try {
      await createVendor(formData)
      toast.success("Vendor created successfully")
      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        email: "",
        password: "",
        company_name: "",
        store_name: "",
        store_description: "",
        business_email: "",
        business_phone: "",
        phone: "",
        vat_number: "",
        address_street: "",
        address_city: "",
        address_region: "",
        address_country: "KE",
        mpesa_phone: "",
        mpesa_business_name: "",
        mpesa_till_number: "",
        mpesa_paybill_number: "",
        approval_status: "pending",
        auto_approve: false,
      })
    } catch (error) {
      // Toast already handled by store
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.email || !formData.email.includes("@")) {
        toast.error("Please enter a valid email address")
        return
      }
      if (!formData.password || formData.password.length < 8) {
        toast.error("Password must be at least 8 characters")
        return
      }
    } else if (currentStep === 2) {
      if (!formData.company_name || formData.company_name.length < 2) {
        toast.error("Company name must be at least 2 characters")
        return
      }
      if (!formData.store_name || formData.store_name.length < 2) {
        toast.error("Store name must be at least 2 characters")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId)
      return
    }

    let tempStep = currentStep
    while (tempStep < stepId) {
      if (tempStep === 1) {
        if (!formData.email || !formData.email.includes("@")) {
          toast.error("Please enter a valid email address")
          return
        }
        if (!formData.password || formData.password.length < 8) {
          toast.error("Password must be at least 8 characters")
          return
        }
      } else if (tempStep === 2) {
        if (!formData.company_name || formData.company_name.length < 2) {
          toast.error("Company name must be at least 2 characters")
          return
        }
        if (!formData.store_name || formData.store_name.length < 2) {
          toast.error("Store name must be at least 2 characters")
          return
        }
      }
      tempStep++
    }

    setCurrentStep(stepId)
  }

  const updateField = (field: keyof CreateVendorData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Sample data arrays for generation
  const companyNames = [
    "MedTech Solutions", "Healthcare Plus", "Medical Supplies Ltd",
    "PharmaCore Distributors", "HealthEquip Kenya", "MediCare Express",
    "VitalMed Supplies", "Clinical Essentials", "MediVendor Kenya"
  ]

  const storeNames = [
    "MedTech Store", "HealthCare Hub", "Medical Depot",
    "PharmaCentral", "HealthEquip Outlet", "MediCare Shop",
    "VitalMed Store", "Clinical Supplies", "MediVendor Shop"
  ]

  const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"]
  const regions = ["Nairobi County", "Mombasa County", "Kisumu County", "Nakuru County", "Uasin Gishu County"]
  const streetAddresses = [
    "Moi Avenue, Tower Building",
    "Kenyatta Avenue, Medical Plaza",
    "Industrial Area, Warehouse District",
    "Westlands, Mall Plaza",
    "CBD, Commerce House"
  ]

  const generateRandomData = () => {
    const randomSuffix = Math.floor(Math.random() * 10000)
    const companyIndex = Math.floor(Math.random() * companyNames.length)
    const cityIndex = Math.floor(Math.random() * cities.length)

    const generatedData: CreateVendorData = {
      email: `vendor${randomSuffix}@example.com`,
      password: "TestPassword123!",
      company_name: companyNames[companyIndex],
      store_name: storeNames[companyIndex],
      store_description: `Leading provider of quality medical equipment and supplies in ${cities[cityIndex]}. Specializing in diagnostic tools, surgical instruments, and healthcare products.`,
      business_email: `business${randomSuffix}@example.com`,
      business_phone: `+2547${Math.floor(Math.random() * 90000000 + 10000000)}`,
      phone: `+2547${Math.floor(Math.random() * 90000000 + 10000000)}`,
      vat_number: `VAT${Math.floor(Math.random() * 1000000)}`,
      address_street: streetAddresses[Math.floor(Math.random() * streetAddresses.length)],
      address_city: cities[cityIndex],
      address_region: regions[cityIndex],
      address_country: "KE",
      mpesa_phone: `+2547${Math.floor(Math.random() * 90000000 + 10000000)}`,
      mpesa_business_name: companyNames[companyIndex],
      mpesa_till_number: `${Math.floor(Math.random() * 900000 + 100000)}`,
      mpesa_paybill_number: `${Math.floor(Math.random() * 900000 + 100000)}`,
      approval_status: "pending",
      auto_approve: false,
    }

    setFormData(generatedData)
    toast.success("Test data generated! Review and submit.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Add New Vendor
              </DialogTitle>
              <DialogDescription>
                Create a new vendor account. The vendor will be able to access their portal once approved.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateRandomData}
              className="flex items-center gap-2"
            >
              <Wand2 className="h-4 w-4" />
              Generate Test Data
            </Button>
          </div>
        </DialogHeader>

        {/* Stepper */}
        <div className="py-2 border-b">
          <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id
              const isActive = currentStep === step.id
              return (
                <React.Fragment key={step.id}>
                  {index > 0 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-colors duration-200",
                        currentStep > index ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      className={cn(
                        "h-8 w-8 rounded-full border flex items-center justify-center text-xs font-medium transition-all duration-200 cursor-pointer",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                          ? "border-primary text-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-muted-foreground/30 text-muted-foreground bg-transparent"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs font-medium transition-colors duration-200 text-center",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Account Information</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="vendor@company.com"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+2547XXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Format: +2547XXXXXXXX or 07XXXXXXXX</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vat_number">VAT Number</Label>
                      <Input
                        id="vat_number"
                        placeholder="Optional"
                        value={formData.vat_number}
                        onChange={(e) => updateField("vat_number", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Company & Store</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        placeholder="Acme Medical Supplies Ltd"
                        value={formData.company_name}
                        onChange={(e) => updateField("company_name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store_name">Store Name *</Label>
                      <Input
                        id="store_name"
                        placeholder="Acme Medical Store"
                        value={formData.store_name}
                        onChange={(e) => updateField("store_name", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_description">Store Description</Label>
                    <Textarea
                      id="store_description"
                      placeholder="Brief description of the business..."
                      rows={3}
                      value={formData.store_description}
                      onChange={(e) => updateField("store_description", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Business Email</Label>
                      <Input
                        id="business_email"
                        type="email"
                        placeholder="business@company.com"
                        value={formData.business_email}
                        onChange={(e) => updateField("business_email", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business_phone">Business Phone</Label>
                      <Input
                        id="business_phone"
                        type="tel"
                        placeholder="+2547XXXXXXXX"
                        value={formData.business_phone}
                        onChange={(e) => updateField("business_phone", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Address</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address_street">Street Address</Label>
                    <Input
                      id="address_street"
                      placeholder="123 Main Street, Building Name"
                      value={formData.address_street}
                      onChange={(e) => updateField("address_street", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_city">City</Label>
                      <Input
                        id="address_city"
                        placeholder="Nairobi"
                        value={formData.address_city}
                        onChange={(e) => updateField("address_city", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_region">Region/County</Label>
                      <Input
                        id="address_region"
                        placeholder="Nairobi County"
                        value={formData.address_region}
                        onChange={(e) => updateField("address_region", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address_country">Country</Label>
                      <Input
                        id="address_country"
                        value={formData.address_country}
                        onChange={(e) => updateField("address_country", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Payment Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">M-Pesa Payment Details</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mpesa_phone">M-Pesa Phone</Label>
                        <Input
                          id="mpesa_phone"
                          type="tel"
                          placeholder="+2547XXXXXXXX"
                          value={formData.mpesa_phone}
                          onChange={(e) => updateField("mpesa_phone", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mpesa_business_name">M-Pesa Business Name</Label>
                        <Input
                          id="mpesa_business_name"
                          placeholder="Acme Medical Supplies"
                          value={formData.mpesa_business_name}
                          onChange={(e) => updateField("mpesa_business_name", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mpesa_till_number">Till Number</Label>
                        <Input
                          id="mpesa_till_number"
                          placeholder="123456"
                          value={formData.mpesa_till_number}
                          onChange={(e) => updateField("mpesa_till_number", e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mpesa_paybill_number">Paybill Number</Label>
                        <Input
                          id="mpesa_paybill_number"
                          placeholder="123456"
                          value={formData.mpesa_paybill_number}
                          onChange={(e) => updateField("mpesa_paybill_number", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Approval Settings */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold">Approval Settings</h3>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="auto_approve">Auto-approve Vendor</Label>
                        <p className="text-sm text-muted-foreground">
                          Skip pending approval and activate vendor immediately
                        </p>
                      </div>
                      <Switch
                        id="auto_approve"
                        checked={formData.auto_approve}
                        onCheckedChange={(checked) => updateField("auto_approve", checked)}
                      />
                    </div>

                    {!formData.auto_approve && (
                      <div className="space-y-2">
                        <Label htmlFor="approval_status">Initial Status</Label>
                        <Select
                          value={formData.approval_status}
                          onValueChange={(value) => updateField("approval_status", value as "pending" | "approved" | "suspended" | "rejected")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <DialogFooter className="flex flex-row justify-between items-center w-full gap-2 mt-6">
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div>
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Vendor"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
