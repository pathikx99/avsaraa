"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "@/components/AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  UserIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  CloseIcon,
  EyeIcon,
  DatabaseIcon,
  SpinnerIcon,
  CheckIcon,
  MailIcon,
} from "@/components/Icons";
import { AdminUser, CustomerProfile, ContactInquiry, NewsletterSubscriber } from "@/types/admin";
import { Product, ProductCategory } from "@/types/product";

const PRESET_PRODUCT_IMAGES = [
  { label: "Banarasi Silk Saree", url: "/images/banarasi_silk_saree.jpg" },
  { label: "Emerald Organza Saree", url: "/images/royal_organza_saree.jpg" },
  { label: "Heritage Anarkali Gown", url: "/images/royal_occasion_dress.jpg" },
  { label: "Chanderi Dress", url: "/images/festive_chanderi_dress.jpg" },
  { label: "Royal Zari Bridal Drape", url: "/images/saree_model_hero.jpg" },
  { label: "Handloom Weave Texture", url: "/images/account_hero.jpg" },
];

// Single Super Admin Default
const DEFAULT_SUPER_ADMIN: AdminUser = {
  id: "adm-001",
  full_name: "Kratos Lord",
  email: "admin@avsaraa.com",
  role: "Super Admin",
  department: "Executive Leadership",
  phone_number: "+91 98765 43210",
  status: "Active",
  permissions: [
    "all:super_admin",
    "products:manage",
    "customers:manage",
    "inquiries:manage",
    "database:governance",
    "system:admin",
  ],
  notes: "Sole Master Super Administrator with complete, unrestricted system authority.",
  last_active: new Date().toISOString(),
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export default function AdminDashboardPage() {
  // Navigation tabs - Products is the primary store control
  const [activeTab, setActiveTab] = useState<
    "products" | "customers" | "inquiries" | "super_admin" | "sql_guide"
  >("products");

  // Authentication & Security State
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authGateEmail, setAuthGateEmail] = useState("");
  const [authGatePassword, setAuthGatePassword] = useState("");
  const [authGateError, setAuthGateError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Platform Data
  const [superAdmin, setSuperAdmin] = useState<AdminUser>(DEFAULT_SUPER_ADMIN);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>("ALL");

  // Modals state for Products
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Modals state for Customers
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerProfile | null>(null);

  // Modals state for Super Admin & Inquiries
  const [showEditSuperAdminModal, setShowEditSuperAdminModal] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<ContactInquiry | null>(null);
  const [deletingInquiry, setDeletingInquiry] = useState<ContactInquiry | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Product Form state
  const [productForm, setProductForm] = useState<{
    name: string;
    category: ProductCategory;
    price: string;
    image_url: string;
    description: string;
  }>({
    name: "",
    category: "Sarees",
    price: "",
    image_url: PRESET_PRODUCT_IMAGES[0].url,
    description: "",
  });

  // Customer Form state
  const [customerForm, setCustomerForm] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    membership_tier: string;
    reward_points: string;
  }>({
    full_name: "",
    email: "",
    phone_number: "",
    membership_tier: "Standard",
    reward_points: "100",
  });

  // Super Admin Edit Form state
  const [superAdminForm, setSuperAdminForm] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    notes: string;
  }>({
    full_name: DEFAULT_SUPER_ADMIN.full_name,
    email: DEFAULT_SUPER_ADMIN.email,
    phone_number: DEFAULT_SUPER_ADMIN.phone_number || "",
    notes: DEFAULT_SUPER_ADMIN.notes || "",
  });

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return headers;
  }, []);

  // Fetch all administrative data with auth headers
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();

      // 1. Fetch Users
      const usersRes = await fetch("/api/admin/users", { headers });
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success) {
          if (usersJson.adminUsers && usersJson.adminUsers.length > 0) {
            setSuperAdmin(usersJson.adminUsers[0]);
          }
          if (usersJson.customerProfiles) {
            setCustomerProfiles(usersJson.customerProfiles);
          }
        }
      }

      // 2. Fetch Products
      const productsRes = await fetch("/api/admin/products", { headers });
      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        if (productsJson.success && productsJson.products) {
          setProducts(productsJson.products);
        }
      }

      // 3. Fetch Inquiries & Newsletter
      const inqRes = await fetch("/api/admin/inquiries", { headers });
      if (inqRes.ok) {
        const inqJson = await inqRes.json();
        if (inqJson.success) {
          setInquiries(inqJson.inquiries || []);
          setSubscribers(inqJson.subscribers || []);
        }
      }
    } catch (err) {
      console.warn("API load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // Initial authentication check & data mount
  useEffect(() => {
    let active = true;

    const checkSecurityAndLoad = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!active) return;

        const user = authData?.user ?? null;
        setSessionUser(user);

        if (user) {
          const email = user.email?.toLowerCase().trim() || "";
          const isSuperAdmin =
            email === "admin@avsaraa.com" ||
            user.app_metadata?.role === "super_admin" ||
            user.app_metadata?.role === "admin" ||
            user.user_metadata?.role === "super_admin";

          setIsAuthorizedAdmin(isSuperAdmin);

          if (isSuperAdmin) {
            // Fetch data securely for authenticated admin
            const headers = await getAuthHeaders();

            const [usersRes, productsRes, inqRes] = await Promise.all([
              fetch("/api/admin/users", { headers }),
              fetch("/api/admin/products", { headers }),
              fetch("/api/admin/inquiries", { headers }),
            ]);

            if (!active) return;

            if (usersRes.ok) {
              const usersJson = await usersRes.json();
              if (usersJson.success) {
                if (usersJson.adminUsers && usersJson.adminUsers.length > 0) {
                  setSuperAdmin(usersJson.adminUsers[0]);
                }
                if (usersJson.customerProfiles) {
                  setCustomerProfiles(usersJson.customerProfiles);
                }
              }
            }

            if (productsRes.ok) {
              const productsJson = await productsRes.json();
              if (productsJson.success && productsJson.products) {
                setProducts(productsJson.products);
              }
            }

            if (inqRes.ok) {
              const inqJson = await inqRes.json();
              if (inqJson.success) {
                setInquiries(inqJson.inquiries || []);
                setSubscribers(inqJson.subscribers || []);
              }
            }
          }
        } else {
          setIsAuthorizedAdmin(false);
        }
      } catch (err) {
        console.warn("Initial load error:", err);
      } finally {
        if (active) {
          setAuthChecking(false);
          setIsLoading(false);
        }
      }
    };

    void checkSecurityAndLoad();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      const user = session?.user ?? null;
      setSessionUser(user);
      if (user) {
        const email = user.email?.toLowerCase().trim() || "";
        const isSuperAdmin =
          email === "admin@avsaraa.com" ||
          user.app_metadata?.role === "super_admin" ||
          user.app_metadata?.role === "admin" ||
          user.user_metadata?.role === "super_admin";
        setIsAuthorizedAdmin(isSuperAdmin);
        if (isSuperAdmin) {
          void fetchData();
        }
      } else {
        setIsAuthorizedAdmin(false);
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchData, getAuthHeaders]);

  // Admin Login Handler for the Security Gate (Login on /admin route only)
  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authGateEmail || !authGatePassword) {
      setAuthGateError("Please enter your Super Admin credentials.");
      return;
    }

    setIsLoggingIn(true);
    setAuthGateError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authGateEmail.trim().toLowerCase(),
        password: authGatePassword,
      });

      if (error) {
        setAuthGateError(error.message);
        return;
      }

      if (data?.user) {
        const email = data.user.email?.toLowerCase().trim() || "";
        const isSuperAdmin =
          email === "admin@avsaraa.com" ||
          data.user.app_metadata?.role === "super_admin" ||
          data.user.app_metadata?.role === "admin" ||
          data.user.user_metadata?.role === "super_admin";

        if (!isSuperAdmin) {
          setAuthGateError("Access Denied: Only the Super Admin is authorized to access this console.");
          await supabase.auth.signOut();
          setSessionUser(null);
          setIsAuthorizedAdmin(false);
          return;
        }

        setSessionUser(data.user);
        setIsAuthorizedAdmin(true);
        showToast("Super Admin Authenticated. Master Console Unlocked.");
        void fetchData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setAuthGateError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setIsAuthorizedAdmin(false);
    showToast("Super Admin signed out securely.", "info");
  };

  // ---------------------------------------------------------------------------
  // Super Admin Profile Management
  // ---------------------------------------------------------------------------
  const openEditSuperAdminModal = () => {
    setSuperAdminForm({
      full_name: superAdmin.full_name,
      email: superAdmin.email,
      phone_number: superAdmin.phone_number || "",
      notes: superAdmin.notes || "",
    });
    setShowEditSuperAdminModal(true);
  };

  const handleUpdateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          target: "admin",
          id: superAdmin.id,
          full_name: superAdminForm.full_name,
          email: superAdminForm.email,
          phone_number: superAdminForm.phone_number,
          notes: superAdminForm.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update Super Admin profile.");
      }

      setSuperAdmin({
        ...superAdmin,
        full_name: superAdminForm.full_name,
        email: superAdminForm.email,
        phone_number: superAdminForm.phone_number,
        notes: superAdminForm.notes,
      });

      setShowEditSuperAdminModal(false);
      showToast("Super Admin profile updated successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Product CRUD
  // ---------------------------------------------------------------------------
  const openAddProductModal = () => {
    setProductForm({
      name: "",
      category: "Sarees",
      price: "",
      image_url: PRESET_PRODUCT_IMAGES[0].url,
      description: "",
    });
    setShowAddProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      image_url: product.image_url,
      description: product.description || "",
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers,
        body: JSON.stringify(productForm),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create product");
      }

      const created: Product = json.data || {
        id: crypto.randomUUID(),
        ...productForm,
        price: Number(productForm.price),
        created_at: new Date().toISOString(),
      };

      setProducts([created, ...products]);
      setShowAddProductModal(false);
      showToast(`Product "${created.name}" created successfully.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Creation failed";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id: editingProduct.id,
          ...productForm,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update product");
      }

      const updated: Product = json.data || {
        ...editingProduct,
        ...productForm,
        price: Number(productForm.price),
      };

      setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
      showToast(`Product "${updated.name}" updated successfully.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/products?id=${deletingProduct.id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== deletingProduct.id));
      showToast(`Product "${deletingProduct.name}" removed from catalog.`);
      setDeletingProduct(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Customer Profile CRUD
  // ---------------------------------------------------------------------------
  const openAddCustomerModal = () => {
    setCustomerForm({
      full_name: "",
      email: "",
      phone_number: "",
      membership_tier: "Standard",
      reward_points: "100",
    });
    setShowAddCustomerModal(true);
  };

  const openEditCustomerModal = (customer: CustomerProfile) => {
    setEditingCustomer(customer);
    setCustomerForm({
      full_name: customer.full_name,
      email: customer.email || "",
      phone_number: customer.phone_number || "",
      membership_tier: customer.membership_tier,
      reward_points: String(customer.reward_points || 0),
    });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          target: "customer",
          ...customerForm,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create customer");
      }

      const created: CustomerProfile = json.data || {
        id: crypto.randomUUID(),
        ...customerForm,
        reward_points: Number(customerForm.reward_points),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCustomerProfiles([created, ...customerProfiles]);
      setShowAddCustomerModal(false);
      showToast(`Customer account for "${created.full_name}" created.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create customer";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          target: "customer",
          id: editingCustomer.id,
          ...customerForm,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update customer");
      }

      const updated: CustomerProfile = json.data || {
        ...editingCustomer,
        ...customerForm,
        reward_points: Number(customerForm.reward_points),
      };

      setCustomerProfiles(customerProfiles.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCustomer(null);
      showToast(`Customer account for "${updated.full_name}" updated.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update customer";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users?target=customer&id=${deletingCustomer.id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete customer");
      }

      setCustomerProfiles(customerProfiles.filter((c) => c.id !== deletingCustomer.id));
      showToast(`Customer "${deletingCustomer.full_name}" profile deleted.`);
      setDeletingCustomer(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete customer";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Inquiries & Newsletter Management
  // ---------------------------------------------------------------------------
  const handleUpdateInquiryStatus = async (id: string, newStatus: ContactInquiry["status"]) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInquiries(inquiries.map((inq) => (inq.id === id ? { ...inq, status: newStatus } : inq)));
        if (viewingInquiry && viewingInquiry.id === id) {
          setViewingInquiry({ ...viewingInquiry, status: newStatus });
        }
        showToast(`Inquiry status updated to ${newStatus}.`);
      } else {
        throw new Error(json.error || "Failed to update inquiry status");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      showToast(message, "error");
    }
  };

  const handleDeleteInquiry = async () => {
    if (!deletingInquiry) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/inquiries?id=${deletingInquiry.id}&target=inquiry`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInquiries(inquiries.filter((inq) => inq.id !== deletingInquiry.id));
        setDeletingInquiry(null);
        showToast("Inquiry deleted.");
      } else {
        throw new Error(json.error || "Failed to delete inquiry");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deletion failed";
      showToast(message, "error");
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/inquiries?id=${id}&target=subscriber`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSubscribers(subscribers.filter((s) => s.id !== id));
        showToast("Subscriber removed from list.");
      } else {
        throw new Error(json.error || "Failed to remove subscriber");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Removal failed";
      showToast(message, "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered Lists
  // ---------------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === "ALL" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const filteredCustomers = useMemo(() => {
    return customerProfiles.filter((c) => {
      return (
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone_number && c.phone_number.includes(searchQuery))
      );
    });
  }, [customerProfiles, searchQuery]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchSearch =
        inq.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inq.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = inquiryStatusFilter === "ALL" || inq.status === inquiryStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [inquiries, searchQuery, inquiryStatusFilter]);

  const totalCatalogValue = useMemo(() => {
    return products.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  }, [products]);

  const copyMigrationSql = () => {
    const sql = `-- ==============================================================================
-- AVSARAA - SINGLE SUPER ADMIN ARCHITECTURE & ROW LEVEL SECURITY
-- Run this in your Supabase SQL Editor:
-- ==============================================================================

-- 1. SUPER ADMIN REGISTRY & AUTH HELPER (Must be created first for RLS policies)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Super Admin' CHECK (role = 'Super Admin'),
    department TEXT DEFAULT 'Executive Leadership',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
                  AND role = 'Super Admin'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
            OR LOWER(auth.jwt()->>'email') = 'admin@avsaraa.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Super admin can view admin users" ON public.admin_users;
CREATE POLICY "Super admin can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can update admin users" ON public.admin_users;
CREATE POLICY "Super admin can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

-- Cleanup secondary admins and seed ONLY the single Super Admin
DELETE FROM public.admin_users WHERE email != 'admin@avsaraa.com';

INSERT INTO public.admin_users (full_name, email, role, department, phone_number, status, permissions, notes)
VALUES 
    ('Kratos Lord', 'admin@avsaraa.com', 'Super Admin', 'Executive Leadership', '+91 98765 43210', 'Active', ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'], 'Founding Super Administrator with full system control and supreme authority.')
ON CONFLICT (email) DO UPDATE SET
    role = 'Super Admin',
    status = 'Active';

-- 2. PRODUCTS: ONLY Super Admin can add, edit, or delete products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Only signed-in users can add products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can add products" ON public.products;
CREATE POLICY "Only super admin can add products" 
    ON public.products FOR INSERT 
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can update products" ON public.products;
CREATE POLICY "Only super admin can update products" 
    ON public.products FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can delete products" ON public.products;
CREATE POLICY "Only super admin can delete products" 
    ON public.products FOR DELETE 
    USING (public.is_admin());

-- 3. CONTACT INQUIRIES & NEWSLETTER: Public can submit; Super Admin controls all
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit a contact inquiry" 
    ON public.contact_inquiries FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Users can view their own contact inquiries" 
    ON public.contact_inquiries FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Super admin can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can update contact inquiries" 
    ON public.contact_inquiries FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can delete contact inquiries" 
    ON public.contact_inquiries FOR DELETE 
    USING (public.is_admin());

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to the newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to the newsletter" 
    ON public.newsletter_subscribers FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can view subscribers" 
    ON public.newsletter_subscribers FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can delete subscribers" 
    ON public.newsletter_subscribers FOR DELETE 
    USING (public.is_admin());`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast("Hardened Single Super Admin SQL copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // ---------------------------------------------------------------------------
  // SECURITY GATE: RENDER IF USER IS NOT AN AUTHORIZED SUPER ADMINISTRATOR
  // ---------------------------------------------------------------------------
  if (!authChecking && !isAuthorizedAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F7F2EE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            border: "1px solid #E8DED3",
            padding: "36px 32px",
            boxShadow: "0 16px 40px rgba(38,27,19,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: "16px" }}>
            <AvsaraaLogo size="md" width={130} />
          </div>

          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#FAF7F2",
              border: "1px solid #CFBEAD",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <ShieldCheckIcon size={26} color="#866951" />
          </div>

          <h2
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#261B13",
              fontFamily: "var(--font-serif)",
              marginBottom: "8px",
            }}
          >
            Super Admin Security Gate
          </h2>
          <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "20px" }}>
            Restricted Master Access. Only the single Super Administrator possesses authority over the Avsaraa platform.
          </p>

          {sessionUser && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
                padding: "12px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                marginBottom: "16px",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "3px" }}>Customer Session Detected</div>
              You are signed in as <strong>{sessionUser.email}</strong>. Administrative routes require Super Admin authentication. Sign in with your Super Admin credentials below.
            </div>
          )}

          {authGateError && (
            <div
              style={{
                backgroundColor: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#B91C1C",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              {authGateError}
            </div>
          )}

          <form onSubmit={handleAdminGateLogin} style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#866951",
                  marginBottom: "6px",
                }}
              >
                Super Admin Email
              </label>
              <input
                type="email"
                required
                value={authGateEmail}
                onChange={(e) => setAuthGateEmail(e.target.value)}
                placeholder="admin@avsaraa.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FCFAF7",
                  fontSize: "14px",
                  color: "#261B13",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#866951",
                  marginBottom: "6px",
                }}
              >
                Master Password
              </label>
              <input
                type="password"
                required
                value={authGatePassword}
                onChange={(e) => setAuthGatePassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FCFAF7",
                  fontSize: "14px",
                  color: "#261B13",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "10px",
                backgroundColor: "#261B13",
                color: "#F7F2EE",
                fontSize: "13px",
                fontWeight: 600,
                marginTop: "10px",
                boxShadow: "0 4px 14px rgba(38,27,19,0.2)",
              }}
            >
              {isLoggingIn ? <SpinnerIcon size={16} color="#FFFFFF" /> : <ShieldCheckIcon size={16} color="#C4AB94" />}
              <span>Authenticate as Super Admin</span>
            </button>
          </form>

          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #E8DED3",
              paddingTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: "12px",
                color: "#866951",
                textDecoration: "underline",
              }}
            >
              ← Return to Boutique Storefront
            </Link>
            {sessionUser && (
              <button
                type="button"
                onClick={handleAdminSignOut}
                style={{
                  fontSize: "12px",
                  color: "#B91C1C",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN DASHBOARD: AUTHENTICATED SUPER ADMIN COMMAND CENTER
  // ---------------------------------------------------------------------------
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F2EE", color: "#261B13", fontFamily: "var(--font-sans)" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 1000,
            padding: "12px 22px",
            borderRadius: "12px",
            backgroundColor:
              toastMessage.type === "error"
                ? "#B91C1C"
                : toastMessage.type === "info"
                ? "#1E70A2"
                : "#261B13",
            color: "#FFFFFF",
            fontSize: "13.5px",
            fontWeight: 500,
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {toastMessage.type === "success" && <CheckIcon size={16} color="#4ADE80" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8DED3",
          padding: "14px 28px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "1440px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ display: "inline-block" }}>
              <AvsaraaLogo size="sm" width={115} />
            </Link>
            <div
              style={{
                height: "22px",
                width: "1px",
                backgroundColor: "#E8DED3",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  backgroundColor: "#F4EFFC",
                  color: "#6F42C1",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  border: "1px solid #D8C7F5",
                }}
              >
                <ShieldCheckIcon size={12} color="#6F42C1" />
                SUPER ADMIN CONSOLE
              </span>
              <span style={{ fontSize: "12px", color: "#866951", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span>Master Governance</span>
                {isLoading && <SpinnerIcon size={12} color="#866951" />}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <Link
              href="/"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                color: "#866951",
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#FCFAF7",
                border: "1px solid #E8DED3",
              }}
            >
              <span>View Storefront</span>
              <span style={{ fontSize: "11px" }}>↗</span>
            </Link>

            {/* Super Admin Badge & Sign Out */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 14px",
                borderRadius: "30px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #CFBEAD",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                KL
              </div>
              <div style={{ fontSize: "12px" }}>
                <span style={{ fontWeight: 600, color: "#261B13" }}>{superAdmin.full_name}</span>
                <span style={{ color: "#6F42C1", fontWeight: 700, marginLeft: "6px", fontSize: "10px" }}>
                  [Super Admin]
                </span>
              </div>
              <button
                onClick={handleAdminSignOut}
                title="Sign out of Super Admin Console"
                style={{
                  marginLeft: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  color: "#866951",
                  borderRadius: "6px",
                  border: "1px solid #E8DED3",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1440px", margin: "0 auto", padding: "28px 24px" }}>
        {/* Top Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          {/* Card 1: Super Admin Master Authority */}
          <div
            onClick={() => setActiveTab("super_admin")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D8C7F5",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(111,66,193,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#6F42C1", fontWeight: 700 }}>
                Master Authority
              </span>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {superAdmin.full_name}
              </div>
              <span style={{ fontSize: "11px", color: "#198754", fontWeight: 600 }}>
                ● Sole Super Admin (Active)
              </span>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#F4EFFC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6F42C1",
              }}
            >
              <ShieldCheckIcon size={24} color="#6F42C1" />
            </div>
          </div>

          {/* Card 2: Products */}
          <div
            onClick={() => setActiveTab("products")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Products in Catalog
              </span>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {products.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>
                ₹{totalCatalogValue.toLocaleString("en-IN")} Total Value
              </span>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#F7F2EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#866951",
              }}
            >
              <ShoppingBagIcon size={24} color="#866951" />
            </div>
          </div>

          {/* Card 3: Customers */}
          <div
            onClick={() => setActiveTab("customers")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Customer Accounts
              </span>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {customerProfiles.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>
                Registered Club Members
              </span>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#F7F2EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#866951",
              }}
            >
              <UserIcon size={24} color="#866951" />
            </div>
          </div>

          {/* Card 4: Inquiries & Subscribers */}
          <div
            onClick={() => setActiveTab("inquiries")}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Inquiries & Subscribers
              </span>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {inquiries.length + subscribers.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>
                {inquiries.filter((i) => i.status === "Unread").length} Unread Messages
              </span>
            </div>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#F7F2EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#866951",
              }}
            >
              <MailIcon size={24} color="#866951" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "2px solid #E8DED3",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Tab 1: Products */}
            <button
              onClick={() => {
                setActiveTab("products");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "products" ? "#261B13" : "#866951",
                borderBottom: activeTab === "products" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <ShoppingBagIcon size={18} color={activeTab === "products" ? "#866951" : "#AC9885"} />
              <span>Products & Catalog ({products.length})</span>
            </button>

            {/* Tab 2: Customer Profiles */}
            <button
              onClick={() => {
                setActiveTab("customers");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "customers" ? "#261B13" : "#866951",
                borderBottom: activeTab === "customers" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <UserIcon size={18} color={activeTab === "customers" ? "#866951" : "#AC9885"} />
              <span>Customer Accounts ({customerProfiles.length})</span>
            </button>

            {/* Tab 3: Inquiries & Newsletter */}
            <button
              onClick={() => {
                setActiveTab("inquiries");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "inquiries" ? "#261B13" : "#866951",
                borderBottom: activeTab === "inquiries" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <MailIcon size={18} color={activeTab === "inquiries" ? "#866951" : "#AC9885"} />
              <span>Inquiries & Leads ({inquiries.length + subscribers.length})</span>
            </button>

            {/* Tab 4: Super Admin Master Profile */}
            <button
              onClick={() => setActiveTab("super_admin")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "super_admin" ? "#6F42C1" : "#866951",
                borderBottom: activeTab === "super_admin" ? "3px solid #6F42C1" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <ShieldCheckIcon size={18} color={activeTab === "super_admin" ? "#6F42C1" : "#AC9885"} />
              <span>Super Admin Master</span>
            </button>

            {/* Tab 5: SQL Migration Guide */}
            <button
              onClick={() => setActiveTab("sql_guide")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "sql_guide" ? "#261B13" : "#866951",
                borderBottom: activeTab === "sql_guide" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <DatabaseIcon size={18} color={activeTab === "sql_guide" ? "#866951" : "#AC9885"} />
              <span>SQL & RLS Setup</span>
            </button>
          </div>

          {/* Tab Action Buttons */}
          <div>
            {activeTab === "products" && (
              <button
                onClick={openAddProductModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(38,27,19,0.15)",
                }}
              >
                <PlusIcon size={16} color="#C4AB94" />
                <span>Add Luxury Product</span>
              </button>
            )}

            {activeTab === "customers" && (
              <button
                onClick={openAddCustomerModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(38,27,19,0.15)",
                }}
              >
                <PlusIcon size={16} color="#C4AB94" />
                <span>Add Customer Account</span>
              </button>
            )}

            {activeTab === "super_admin" && (
              <button
                onClick={openEditSuperAdminModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: "#6F42C1",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(111,66,193,0.25)",
                }}
              >
                <EditIcon size={15} color="#FFFFFF" />
                <span>Edit Super Admin Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {activeTab !== "super_admin" && activeTab !== "sql_guide" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
              <SearchIcon size={16} color="#866951" />
              <input
                type="text"
                placeholder={
                  activeTab === "products"
                    ? "Search products by title, description..."
                    : activeTab === "customers"
                    ? "Search customers by name, phone, email..."
                    : "Search inquiries by sender, subject, message..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  color: "#261B13",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <CloseIcon size={14} color="#866951" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {activeTab === "products" && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E8DED3",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                  }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Sarees">Sarees</option>
                  <option value="Dresses">Dresses</option>
                  <option value="New Arrivals">New Arrivals</option>
                  <option value="Occasion Wear">Occasion Wear</option>
                </select>
              )}

              {activeTab === "inquiries" && (
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid #E8DED3",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                  }}
                >
                  <option value="ALL">All Inquiry Statuses</option>
                  <option value="Unread">Unread</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Archived">Archived</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: PRODUCTS TABLE (LUXURY CATALOG INVENTORY)                  */}
        {/* ================================================================= */}
        {activeTab === "products" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAF7F2", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Item</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Category</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Price</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Description</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
                        No products found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        style={{ borderBottom: "1px solid #F0E8DF", transition: "background-color 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "64px",
                                position: "relative",
                                borderRadius: "6px",
                                overflow: "hidden",
                                backgroundColor: "#FAF7F2",
                                border: "1px solid #E8DED3",
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="48px"
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#261B13" }}>{product.name}</div>
                              <div style={{ fontSize: "11px", color: "#866951", marginTop: "2px" }}>
                                Added: {product.created_at ? new Date(product.created_at).toLocaleDateString() : "Catalog Item"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11.5px",
                              fontWeight: 600,
                              backgroundColor: "#FAF7F2",
                              color: "#866951",
                              border: "1px solid #CFBEAD",
                            }}
                          >
                            {product.category}
                          </span>
                        </td>

                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "#261B13" }}>
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </td>

                        <td style={{ padding: "14px 18px", color: "#543E2E", maxWidth: "340px" }}>
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              fontSize: "12.5px",
                              lineHeight: "1.4",
                            }}
                          >
                            {product.description || "—"}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => setViewingProduct(product)}
                              title="View Product"
                              style={{
                                padding: "7px",
                                borderRadius: "8px",
                                border: "1px solid #E8DED3",
                                backgroundColor: "#FFFFFF",
                                color: "#866951",
                              }}
                            >
                              <EyeIcon size={14} />
                            </button>
                            <button
                              onClick={() => openEditProductModal(product)}
                              title="Edit Product"
                              style={{
                                padding: "7px",
                                borderRadius: "8px",
                                border: "1px solid #E8DED3",
                                backgroundColor: "#FFFFFF",
                                color: "#261B13",
                              }}
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(product)}
                              title="Delete Product"
                              style={{
                                padding: "7px",
                                borderRadius: "8px",
                                border: "1px solid #FCA5A5",
                                backgroundColor: "#FFF5F5",
                                color: "#DC2626",
                              }}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: CUSTOMER PROFILES TABLE                                   */}
        {/* ================================================================= */}
        {activeTab === "customers" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAF7F2", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Customer Name</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Contact Info</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Membership Tier</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Reward Points</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Joined Date</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
                        No customer accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const tierBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
                        VIP: { bg: "#FFF8ED", text: "#B78103", border: "#F9E4B7" },
                        "Atelier Circle": { bg: "#F4EFFC", text: "#6F42C1", border: "#D8C7F5" },
                        Privilege: { bg: "#EBF8F2", text: "#0F7A50", border: "#B5E8D2" },
                        Standard: { bg: "#FAF7F2", text: "#543E2E", border: "#E8DED3" },
                      };
                      const colors = tierBadgeColors[customer.membership_tier] || tierBadgeColors.Standard;

                      return (
                        <tr
                          key={customer.id}
                          style={{ borderBottom: "1px solid #F0E8DF", transition: "background-color 0.15s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td style={{ padding: "16px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  borderRadius: "50%",
                                  backgroundColor: "#FAF7F2",
                                  border: "1px solid #CFBEAD",
                                  color: "#866951",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 600,
                                  fontSize: "12px",
                                }}
                              >
                                {customer.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <span style={{ fontWeight: 600, color: "#261B13" }}>{customer.full_name}</span>
                            </div>
                          </td>

                          <td style={{ padding: "16px 18px", color: "#543E2E" }}>
                            <div>{customer.email || "—"}</div>
                            <div style={{ fontSize: "11px", color: "#866951" }}>{customer.phone_number || "—"}</div>
                          </td>

                          <td style={{ padding: "16px 18px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              ★ {customer.membership_tier}
                            </span>
                          </td>

                          <td style={{ padding: "16px 18px", fontWeight: 600, color: "#866951" }}>
                            {(customer.reward_points ?? 0).toLocaleString()} pts
                          </td>

                          <td style={{ padding: "16px 18px", color: "#866951" }}>
                            {new Date(customer.created_at).toLocaleDateString()}
                          </td>

                          <td style={{ padding: "16px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => openEditCustomerModal(customer)}
                                title="Edit Customer"
                                style={{
                                  padding: "7px",
                                  borderRadius: "8px",
                                  border: "1px solid #E8DED3",
                                  backgroundColor: "#FFFFFF",
                                  color: "#261B13",
                                }}
                              >
                                <EditIcon size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingCustomer(customer)}
                                title="Delete Customer Account"
                                style={{
                                  padding: "7px",
                                  borderRadius: "8px",
                                  border: "1px solid #FCA5A5",
                                  backgroundColor: "#FFF5F5",
                                  color: "#DC2626",
                                }}
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: INQUIRIES & NEWSLETTER LEADS                              */}
        {/* ================================================================= */}
        {activeTab === "inquiries" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Sub-section 1: Contact Inquiries */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #E8DED3",
                  backgroundColor: "#FAF7F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#261B13" }}>
                  Customer Inquiries & Concierge Messages ({inquiries.length})
                </h3>
                <span style={{ fontSize: "12px", color: "#866951" }}>
                  Direct messages submitted from the boutique Contact page
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#FCFAF7", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Sender</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Subject</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Date</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#866951" }}>
                          No inquiries found.
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq) => (
                        <tr
                          key={inq.id}
                          style={{ borderBottom: "1px solid #F0E8DF" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <td style={{ padding: "14px 18px" }}>
                            <div style={{ fontWeight: 600, color: "#261B13" }}>{inq.full_name}</div>
                            <div style={{ fontSize: "11px", color: "#866951" }}>{inq.email} {inq.phone_number ? `• ${inq.phone_number}` : ""}</div>
                          </td>

                          <td style={{ padding: "14px 18px", maxWidth: "320px" }}>
                            <div style={{ fontWeight: 600, color: "#261B13" }}>{inq.subject}</div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#543E2E",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {inq.message}
                            </div>
                          </td>

                          <td style={{ padding: "14px 18px" }}>
                            <select
                              value={inq.status}
                              onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as ContactInquiry["status"])}
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                border: "1px solid #E8DED3",
                                backgroundColor:
                                  inq.status === "Unread"
                                    ? "#FFF8ED"
                                    : inq.status === "Resolved"
                                    ? "#EBF8F2"
                                    : "#FFFFFF",
                                color:
                                  inq.status === "Unread"
                                    ? "#B78103"
                                    : inq.status === "Resolved"
                                    ? "#0F7A50"
                                    : "#261B13",
                              }}
                            >
                              <option value="Unread">Unread</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </td>

                          <td style={{ padding: "14px 18px", color: "#866951", fontSize: "12px" }}>
                            {new Date(inq.created_at).toLocaleDateString()}
                          </td>

                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                onClick={() => setViewingInquiry(inq)}
                                title="View Message"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #E8DED3",
                                  backgroundColor: "#FFFFFF",
                                  color: "#866951",
                                }}
                              >
                                <EyeIcon size={14} />
                              </button>
                              <button
                                onClick={() => setDeletingInquiry(inq)}
                                title="Delete Inquiry"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  border: "1px solid #FCA5A5",
                                  backgroundColor: "#FFF5F5",
                                  color: "#DC2626",
                                }}
                              >
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-section 2: Newsletter Subscribers */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #E8DED3",
                  backgroundColor: "#FAF7F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#261B13" }}>
                  Newsletter Subscribers ({subscribers.length})
                </h3>
                <span style={{ fontSize: "12px", color: "#866951" }}>
                  Subscribed via boutique footer for seasonal drape updates
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#FCFAF7", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Subscriber Email</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Source</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700 }}>Date Subscribed</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#866951" }}>
                          No newsletter subscribers recorded yet.
                        </td>
                      </tr>
                    ) : (
                      subscribers.map((sub) => (
                        <tr key={sub.id} style={{ borderBottom: "1px solid #F0E8DF" }}>
                          <td style={{ padding: "14px 18px", fontWeight: 600, color: "#261B13" }}>
                            {sub.email}
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#EBF8F2",
                                color: "#0F7A50",
                              }}
                            >
                              ● {sub.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", color: "#866951" }}>
                            {sub.source || "Website Footer"}
                          </td>
                          <td style={{ padding: "14px 18px", color: "#866951", fontSize: "12px" }}>
                            {new Date(sub.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              title="Remove Subscriber"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                border: "1px solid #FCA5A5",
                                backgroundColor: "#FFF5F5",
                                color: "#DC2626",
                              }}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 4: SUPER ADMIN MASTER PROFILE & SECURITY                     */}
        {/* ================================================================= */}
        {activeTab === "super_admin" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
            {/* Master Super Admin Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D8C7F5",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 6px 24px rgba(111,66,193,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "#261B13",
                      color: "#F7F2EE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: 700,
                      boxShadow: "0 4px 12px rgba(38,27,19,0.2)",
                    }}
                  >
                    KL
                  </div>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#261B13" }}>
                      {superAdmin.full_name}
                    </h2>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        backgroundColor: "#F4EFFC",
                        color: "#6F42C1",
                        fontSize: "11px",
                        fontWeight: 700,
                        border: "1px solid #D8C7F5",
                        marginTop: "4px",
                      }}
                    >
                      <ShieldCheckIcon size={12} color="#6F42C1" />
                      SOLE SUPER ADMIN
                    </span>
                  </div>
                </div>

                <button
                  onClick={openEditSuperAdminModal}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    color: "#261B13",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  <EditIcon size={13} />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#FCFAF7",
                  border: "1px solid #E8DED3",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Email Address:</span>
                  <span style={{ fontWeight: 600, color: "#261B13" }}>{superAdmin.email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Phone Number:</span>
                  <span style={{ fontWeight: 600, color: "#261B13" }}>{superAdmin.phone_number || "+91 98765 43210"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Department:</span>
                  <span style={{ fontWeight: 600, color: "#261B13" }}>{superAdmin.department}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Status:</span>
                  <span style={{ fontWeight: 600, color: "#0F7A50" }}>● {superAdmin.status}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Verified Session:</span>
                  <span style={{ color: "#543E2E", fontWeight: 500 }}>
                    {sessionUser?.email || "Master Super Admin Key"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#866951" }}>Last Active Session:</span>
                  <span style={{ color: "#543E2E" }}>{new Date().toLocaleString()}</span>
                </div>
              </div>

              {superAdmin.notes && (
                <div style={{ marginTop: "16px", fontSize: "12.5px", color: "#543E2E", fontStyle: "italic" }}>
                  &ldquo;{superAdmin.notes}&rdquo;
                </div>
              )}
            </div>

            {/* Platform Master Privileges Card */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "16px",
                padding: "28px",
                boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#261B13", marginBottom: "8px" }}>
                Super Admin Absolute Privileges
              </h3>
              <p style={{ fontSize: "12.5px", color: "#866951", lineHeight: "1.5", marginBottom: "18px" }}>
                Avsaraa runs under a unified single-administrator model. The Super Admin holds absolute authority over all store functions.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { title: "Catalog & Product Governance", desc: "Unrestricted authority to add, edit, price, and delete all luxury garments." },
                  { title: "Customer Account Administration", desc: "Full control over registered member profiles, VIP tier upgrades, and points." },
                  { title: "Concierge Inquiries & Messaging", desc: "Oversee and resolve customer inquiries and manage newsletter mailing lists." },
                  { title: "Row Level Security & Database Master", desc: "Cryptographically authenticated bypass policies and schema governance." },
                  { title: "Single Admin Lockdown", desc: "Multi-staff delegation is disabled. No secondary administrators can be created." },
                ].map((priv, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      backgroundColor: "#FAF7F2",
                      border: "1px solid #E8DED3",
                    }}
                  >
                    <div style={{ marginTop: "2px" }}>
                      <CheckIcon size={15} color="#0F7A50" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#261B13" }}>{priv.title}</div>
                      <div style={{ fontSize: "11.5px", color: "#866951" }}>{priv.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 5: DATABASE ARCHITECTURE & SQL MIGRATION                     */}
        {/* ================================================================= */}
        {activeTab === "sql_guide" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "16px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#261B13" }}>
                  Single Super Admin SQL Architecture
                </h3>
                <p style={{ fontSize: "13px", color: "#866951", marginTop: "4px" }}>
                  Run this SQL in your Supabase SQL Editor to enforce single Super Admin authority and RLS policies.
                </p>
              </div>

              <button
                onClick={copyMigrationSql}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  backgroundColor: copiedSql ? "#0F7A50" : "#261B13",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background-color 0.2s ease",
                }}
              >
                <CheckIcon size={16} color="#FFFFFF" />
                <span>{copiedSql ? "Copied to Clipboard!" : "Copy SQL Script"}</span>
              </button>
            </div>

            <pre
              style={{
                backgroundColor: "#1C140E",
                color: "#E6DACF",
                padding: "20px",
                borderRadius: "10px",
                fontSize: "12px",
                lineHeight: "1.6",
                overflowX: "auto",
                fontFamily: "monospace",
              }}
            >
{`-- ==============================================================================
-- AVSARAA - SINGLE SUPER ADMIN ARCHITECTURE & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. SUPER ADMIN REGISTRY & AUTH HELPER (Must be created first for RLS policies)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Super Admin' CHECK (role = 'Super Admin'),
    department TEXT DEFAULT 'Executive Leadership',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
                  AND role = 'Super Admin'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'super_admin'
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
            OR LOWER(auth.jwt()->>'email') = 'admin@avsaraa.com'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Super admin can view admin users" ON public.admin_users;
CREATE POLICY "Super admin can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can update admin users" ON public.admin_users;
CREATE POLICY "Super admin can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

-- Cleanup secondary admins and seed ONLY the single Super Admin
DELETE FROM public.admin_users WHERE email != 'admin@avsaraa.com';

INSERT INTO public.admin_users (full_name, email, role, department, phone_number, status, permissions, notes)
VALUES 
    ('Kratos Lord', 'admin@avsaraa.com', 'Super Admin', 'Executive Leadership', '+91 98765 43210', 'Active', ARRAY['all:super_admin', 'products:manage', 'customers:manage', 'inquiries:manage', 'system:admin'], 'Founding Super Administrator with full system control and supreme authority.')
ON CONFLICT (email) DO UPDATE SET
    role = 'Super Admin',
    status = 'Active';

-- 2. PRODUCTS: ONLY Super Admin can add, edit, or delete products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" 
    ON public.products FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Only signed-in users can add products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can add products" ON public.products;
CREATE POLICY "Only super admin can add products" 
    ON public.products FOR INSERT 
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can update products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can update products" ON public.products;
CREATE POLICY "Only super admin can update products" 
    ON public.products FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users or admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Only super admin can delete products" ON public.products;
CREATE POLICY "Only super admin can delete products" 
    ON public.products FOR DELETE 
    USING (public.is_admin());

-- 3. CONTACT INQUIRIES & NEWSLETTER: Public can submit; Super Admin controls all
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit a contact inquiry" 
    ON public.contact_inquiries FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Users can view their own contact inquiries" 
    ON public.contact_inquiries FOR SELECT 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Super admin can update contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can update contact inquiries" 
    ON public.contact_inquiries FOR UPDATE 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Super admin can delete contact inquiries" 
    ON public.contact_inquiries FOR DELETE 
    USING (public.is_admin());

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to the newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to the newsletter" 
    ON public.newsletter_subscribers FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can view subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can view subscribers" 
    ON public.newsletter_subscribers FOR SELECT 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Super admin can delete subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Super admin can delete subscribers" 
    ON public.newsletter_subscribers FOR DELETE 
    USING (public.is_admin());`}
            </pre>
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: EDIT SUPER ADMIN DETAILS                                     */}
      {/* ===================================================================== */}
      {showEditSuperAdminModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditSuperAdminModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#261B13" }}>
                Edit Super Admin Profile
              </h3>
              <button onClick={() => setShowEditSuperAdminModal(false)} style={{ padding: "6px", color: "#866951" }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSuperAdmin}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={superAdminForm.full_name}
                    onChange={(e) => setSuperAdminForm({ ...superAdminForm, full_name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={superAdminForm.email}
                    onChange={(e) => setSuperAdminForm({ ...superAdminForm, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={superAdminForm.phone_number}
                    onChange={(e) => setSuperAdminForm({ ...superAdminForm, phone_number: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Governance Notes
                  </label>
                  <textarea
                    rows={3}
                    value={superAdminForm.notes}
                    onChange={(e) => setSuperAdminForm({ ...superAdminForm, notes: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "13px",
                      color: "#261B13",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditSuperAdminModal(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#866951",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "#6F42C1",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADD / EDIT PRODUCT                                           */}
      {/* ===================================================================== */}
      {(showAddProductModal || editingProduct) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddProductModal(false);
              setEditingProduct(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13" }}>
                {editingProduct ? "Edit Luxury Garment" : "Add Luxury Garment"}
              </h3>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  setEditingProduct(null);
                }}
                style={{ padding: "6px", color: "#866951" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Royal Banarasi Katan Silk Saree"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Collection Category *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "14px",
                        color: "#261B13",
                      }}
                    >
                      <option value="Sarees">Sarees</option>
                      <option value="Dresses">Dresses</option>
                      <option value="New Arrivals">New Arrivals</option>
                      <option value="Occasion Wear">Occasion Wear</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Price (₹ INR) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="e.g. 24999"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "14px",
                        color: "#261B13",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Garment Imagery URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="/images/banarasi_silk_saree.jpg"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                  <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {PRESET_PRODUCT_IMAGES.map((preset) => (
                      <button
                        key={preset.url}
                        type="button"
                        onClick={() => setProductForm({ ...productForm, image_url: preset.url })}
                        style={{
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #E8DED3",
                          backgroundColor: productForm.image_url === preset.url ? "#261B13" : "#FAF7F2",
                          color: productForm.image_url === preset.url ? "#F7F2EE" : "#866951",
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Drape Craft & Description
                  </label>
                  <textarea
                    rows={4}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Weave specifications, zari highlights, silk grade, bespoke tailoring notes..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "13px",
                      color: "#261B13",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setEditingProduct(null);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#866951",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#F7F2EE",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Processing..." : editingProduct ? "Update Garment" : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW PRODUCT DETAILS                                         */}
      {/* ===================================================================== */}
      {viewingProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingProduct(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase" }}>
                  {viewingProduct.category}
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#261B13", marginTop: "2px" }}>
                  {viewingProduct.name}
                </h3>
              </div>
              <button onClick={() => setViewingProduct(null)} style={{ padding: "6px", color: "#866951" }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div
              style={{
                width: "100%",
                height: "260px",
                position: "relative",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "18px",
                backgroundColor: "#FAF7F2",
              }}
            >
              <Image
                src={viewingProduct.image_url}
                alt={viewingProduct.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#261B13" }}>
                ₹{Number(viewingProduct.price).toLocaleString("en-IN")}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "#EBF8F2",
                  color: "#0F7A50",
                  fontWeight: 600,
                }}
              >
                In Catalog
              </span>
            </div>

            <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.6" }}>
              {viewingProduct.description || "No specific weave notes provided for this drape."}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                onClick={() => setViewingProduct(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: DELETE PRODUCT CONFIRMATION                                  */}
      {/* ===================================================================== */}
      {deletingProduct && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingProduct(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <TrashIcon size={22} color="#DC2626" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginBottom: "8px" }}>
              Remove from Catalog?
            </h3>
            <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "24px" }}>
              Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#866951",
                }}
              >
                Keep Product
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteProduct}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: ADD / EDIT CUSTOMER                                          */}
      {/* ===================================================================== */}
      {(showAddCustomerModal || editingCustomer) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddCustomerModal(false);
              setEditingCustomer(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#261B13" }}>
                {editingCustomer ? "Edit Customer Profile" : "Add Customer Profile"}
              </h3>
              <button
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setEditingCustomer(null);
                }}
                style={{ padding: "6px", color: "#866951" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerForm.full_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                    placeholder="e.g. Priyadarshini Mehta"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="priya@domain.com"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={customerForm.phone_number}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                    placeholder="+91 98230 44556"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Club Tier
                    </label>
                    <select
                      value={customerForm.membership_tier}
                      onChange={(e) => setCustomerForm({ ...customerForm, membership_tier: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "14px",
                        color: "#261B13",
                      }}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Privilege">Privilege</option>
                      <option value="Atelier Circle">Atelier Circle</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Reward Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customerForm.reward_points}
                      onChange={(e) => setCustomerForm({ ...customerForm, reward_points: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "14px",
                        color: "#261B13",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setEditingCustomer(null);
                  }}
                  style={{
                    padding: "10px 16px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#866951",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#F7F2EE",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Saving..." : editingCustomer ? "Update Profile" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: DELETE CUSTOMER CONFIRMATION                                 */}
      {/* ===================================================================== */}
      {deletingCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCustomer(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <TrashIcon size={22} color="#DC2626" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginBottom: "8px" }}>
              Delete Customer Account?
            </h3>
            <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "24px" }}>
              Are you sure you want to delete the profile for <strong>{deletingCustomer.full_name}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#866951",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteCustomer}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 7: VIEW INQUIRY DETAILS                                         */}
      {/* ===================================================================== */}
      {viewingInquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingInquiry(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "12px",
                    backgroundColor: viewingInquiry.status === "Unread" ? "#FFF8ED" : "#EBF8F2",
                    color: viewingInquiry.status === "Unread" ? "#B78103" : "#0F7A50",
                  }}
                >
                  {viewingInquiry.status}
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginTop: "8px" }}>
                  {viewingInquiry.subject}
                </h3>
              </div>
              <button onClick={() => setViewingInquiry(null)} style={{ padding: "6px", color: "#866951" }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #E8DED3",
                marginBottom: "16px",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: 600, color: "#261B13" }}>From: {viewingInquiry.full_name}</div>
              <div style={{ color: "#866951" }}>Email: {viewingInquiry.email}</div>
              {viewingInquiry.phone_number && <div style={{ color: "#866951" }}>Phone: {viewingInquiry.phone_number}</div>}
              <div style={{ color: "#866951", fontSize: "11px", marginTop: "4px" }}>
                Received: {new Date(viewingInquiry.created_at).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "6px" }}>
                Message Content
              </label>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "#FCFAF7",
                  border: "1px solid #CFBEAD",
                  fontSize: "13.5px",
                  color: "#261B13",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {viewingInquiry.message}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => handleUpdateInquiryStatus(viewingInquiry.id, "Resolved")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#0F7A50",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Mark as Resolved
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateInquiryStatus(viewingInquiry.id, "In Progress")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    color: "#261B13",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  Mark In Progress
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingInquiry(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 8: DELETE INQUIRY CONFIRMATION                                  */}
      {/* ===================================================================== */}
      {deletingInquiry && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingInquiry(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "440px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <TrashIcon size={22} color="#DC2626" />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginBottom: "8px" }}>
              Delete Inquiry?
            </h3>
            <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "24px" }}>
              Delete message from <strong>{deletingInquiry.full_name}</strong> (&ldquo;{deletingInquiry.subject}&rdquo;)?
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setDeletingInquiry(null)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#866951",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteInquiry}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Delete Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
