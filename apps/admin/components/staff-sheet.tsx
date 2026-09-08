"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";
import {
  UserPlus,
  Mail,
  User,
  Crown,
  Wrench,
  Store,
  Users,
  Truck,
  Eye,
  Key,
  Copy,
  Check,
  Loader2,
  Building2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Headphones,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersService } from "@mymeddevices/shared-core";

const staffSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string().min(1, "Please select a role"),
  department: z.string().min(1, "Please select a department"),
});

type StaffFormValues = z.infer<typeof staffSchema>;

interface StaffSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface CreatedStaffResult {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  temp_password?: string;
}

interface RoleCategory {
  label: string;
  options: {
    value: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const ROLE_CATEGORIES: RoleCategory[] = [
  {
    label: "Platform Administration",
    options: [
      {
        value: "admin",
        label: "Administrator",
        description: "Full system administration, user management & system settings",
        icon: Crown,
      },
      {
        value: "worker",
        label: "Operations Worker",
        description: "General staff, order processing & catalog workflows",
        icon: Wrench,
      },
    ],
  },
  {
    label: "Operations & Specialized Access",
    options: [
      {
        value: "finance",
        label: "Finance & Accounts",
        description: "Payouts, reconciliations, invoices, VAT & financial reports",
        icon: CreditCard,
      },
      {
        value: "compliance",
        label: "Compliance & Regulatory",
        description: "PPB / KMPDB medical device approvals & quality auditing",
        icon: ShieldCheck,
      },
      {
        value: "support",
        label: "Customer Support Agent",
        description: "Support tickets, return processing & buyer dispute resolution",
        icon: Headphones,
      },
      {
        value: "logistics",
        label: "Warehouse & Logistics",
        description: "Inventory dispatch, stock tracking & delivery hub management",
        icon: Package,
      },
    ],
  },
  {
    label: "External & Marketplace Roles",
    options: [
      {
        value: "vendor",
        label: "Vendor Partner",
        description: "Vendor portal access, product listing & store management",
        icon: Store,
      },
      {
        value: "driver",
        label: "Delivery Driver",
        description: "Mobile delivery app access, package drop-offs & dispatch",
        icon: Truck,
      },
      {
        value: "customer",
        label: "Procurement / Customer",
        description: "Healthcare facility, hospital or individual buyer account",
        icon: Users,
      },
      {
        value: "viewer",
        label: "Auditor / Read-Only Viewer",
        description: "Read-only access for compliance, inspection & audits",
        icon: Eye,
      },
    ],
  },
];

const DEPARTMENTS = [
  "Operations",
  "Finance & Accounting",
  "Clinical & Regulatory Affairs",
  "Quality Assurance & Compliance",
  "Customer Support & Experience",
  "Logistics & Supply Chain",
  "Warehouse & Inventory",
  "IT & Cybersecurity",
  "Sales & Vendor Relations",
  "Executive Management",
];

export function StaffSheet({ open, onOpenChange, onSuccess }: StaffSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<CreatedStaffResult | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: standardSchemaResolver(staffSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "worker",
      department: "Operations",
    },
  });

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTimeout(() => {
        reset();
        setCreatedStaff(null);
        setCopiedPassword(false);
        setCopiedAll(false);
      }, 200);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (values: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await usersService.createStaff({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
      });

      toast.success("User created successfully!");
      setCreatedStaff({
        id: response.id,
        email: response.email || values.email,
        role: response.role || values.role,
        first_name: values.first_name,
        last_name: values.last_name,
        temp_password: response.temp_password,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to create user:", error);
      const errorMsg =
        error?.response?.data?.detail ||
        error?.message ||
        "Failed to create user";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    if (!createdStaff?.temp_password) return;
    navigator.clipboard.writeText(createdStaff.temp_password);
    setCopiedPassword(true);
    toast.success("Temporary password copied to clipboard");
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleCopyFullCredentials = () => {
    if (!createdStaff) return;
    const portalUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
    const text = `MyMedDevices Account Credentials:\n\nName: ${createdStaff.first_name} ${createdStaff.last_name}\nEmail: ${createdStaff.email}\nRole: ${createdStaff.role.toUpperCase()}\nTemporary Password: ${createdStaff.temp_password || "(sent via email)"}\nLogin URL: ${portalUrl}/auth/login`;

    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("Full credentials copied to clipboard");
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleInviteAnother = () => {
    reset({
      first_name: "",
      last_name: "",
      email: "",
      role: "worker",
      department: "Operations",
    });
    setCreatedStaff(null);
    setCopiedPassword(false);
    setCopiedAll(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 gap-1 font-medium">
            <Crown className="h-3 w-3" /> Administrator
          </Badge>
        );
      case "finance":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <CreditCard className="h-3 w-3" /> Finance
          </Badge>
        );
      case "compliance":
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 gap-1 font-medium">
            <ShieldCheck className="h-3 w-3" /> Compliance
          </Badge>
        );
      case "support":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 gap-1 font-medium">
            <Headphones className="h-3 w-3" /> Support
          </Badge>
        );
      case "logistics":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 gap-1 font-medium">
            <Package className="h-3 w-3" /> Logistics
          </Badge>
        );
      case "worker":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 gap-1 font-medium">
            <Wrench className="h-3 w-3" /> Worker
          </Badge>
        );
      case "vendor":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <Store className="h-3 w-3" /> Vendor
          </Badge>
        );
      case "driver":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 gap-1 font-medium">
            <Truck className="h-3 w-3" /> Driver
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 gap-1 font-medium">
            <Users className="h-3 w-3" /> Customer
          </Badge>
        );
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 gap-0 flex flex-col bg-card overflow-hidden">
        {/* Sheet Header */}
        <div className="p-6 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs border border-primary/20 shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-semibold tracking-tight">
                {createdStaff ? "Member Added Successfully" : "Add Staff / User Member"}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {createdStaff
                  ? "Account created. Share the access details securely with the member."
                  : "Invite a new member with role-based access to the platform."}
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {createdStaff ? (
          /* Success View */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground">
                  Account Created Successfully
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  An invitation has been created. You can share the temporary access credentials below directly.
                </p>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="rounded-xl border bg-background p-4 flex flex-col gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Profile Summary
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-[11px] text-muted-foreground">Full Name</div>
                  <div className="text-sm font-medium text-foreground">
                    {createdStaff.first_name} {createdStaff.last_name}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-muted-foreground">Assigned Role</div>
                  <div className="mt-0.5">
                    {getRoleBadge(createdStaff.role)}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-[11px] text-muted-foreground">Email Address</div>
                  <div className="text-sm font-medium text-foreground break-all">
                    {createdStaff.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Temporary Password Box */}
            {createdStaff.temp_password && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                    <Key className="h-3.5 w-3.5" />
                    Temporary Password
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    One-time setup
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-background border rounded-lg p-2.5">
                  <code className="flex-1 font-mono text-base font-semibold tracking-wider text-foreground select-all">
                    {createdStaff.temp_password}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 shrink-0"
                    onClick={handleCopyPassword}
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Actions */}
            <Button
              variant="outline"
              className="w-full gap-2 mt-1"
              onClick={handleCopyFullCredentials}
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  <span>Copied Full Login Info</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Full Invitation & Login Info</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Form View */
          <form
            id="staff-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="first_name" className="text-xs font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="e.g. Jane"
                    className="h-9"
                    {...register("first_name")}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="last_name" className="text-xs font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="e.g. Mwangi"
                    className="h-9"
                    {...register("last_name")}
                  />
                  {errors.last_name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane.mwangi@mymeddevices.com"
                    className="h-9 pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Role Dropdown */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role" className="text-xs font-medium">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger id="role" className="w-full h-9">
                        <SelectValue placeholder="Select member role" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="max-h-72">
                        {ROLE_CATEGORIES.map((category, categoryIdx) => (
                          <SelectGroup key={category.label}>
                            {categoryIdx > 0 && <SelectSeparator />}
                            <SelectLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-1">
                              {category.label}
                            </SelectLabel>
                            {category.options.map((option) => {
                              const Icon = option.icon;
                              return (
                                <SelectItem key={option.value} value={option.value}>
                                  <div className="flex items-center gap-2.5 py-0.5">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <div className="flex flex-col text-left">
                                      <span className="font-medium text-xs text-foreground">
                                        {option.label}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Department Dropdown */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department" className="text-xs font-medium">
                  Department / Team <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <SelectTrigger id="department" className="w-full h-9">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="max-h-60">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            <div className="flex items-center gap-2 py-0.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs">{dept}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.department && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.department.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Sheet Footer */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2.5">
          {createdStaff ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleInviteAnother}
              >
                Add Another
              </Button>
              <Button
                size="sm"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="staff-form"
                size="sm"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Add Member</span>
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
