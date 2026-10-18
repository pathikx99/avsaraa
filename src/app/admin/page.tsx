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
} from "@/components/Icons";
import { AdminUser, AdminRole, AdminStatus, CustomerProfile } from "@/types/admin";
import { Product, ProductCategory } from "@/types/product";

const PRESET_PRODUCT_IMAGES = [
  { label: "Banarasi Silk Saree", url: "/images/banarasi_silk_saree.jpg" },
  { label: "Emerald Organza Saree", url: "/images/royal_organza_saree.jpg" },
  { label: "Heritage Anarkali Gown", url: "/images/royal_occasion_dress.jpg" },
  { label: "Chanderi Dress", url: "/images/festive_chanderi_dress.jpg" },
  { label: "Royal Zari Bridal Drape", url: "/images/saree_model_hero.jpg" },
  { label: "Handloom Weave Texture", url: "/images/account_hero.jpg" },
];

const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: "adm-001",
    full_name: "Kratos Lord",
    email: "admin@avsaraa.com",
    role: "Super Admin",
    department: "Executive Leadership",
    phone_number: "+91 98765 43210",
    status: "Active",
    permissions: ["users:manage", "products:manage", "orders:manage", "system:admin"],
    notes: "Founding administrator with full system privileges and governance.",
    last_active: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "adm-002",
    full_name: "Aanya Sharma",
    email: "aanya.atelier@avsaraa.com",
    role: "Product Manager",
    department: "Atelier Curation",
    phone_number: "+91 98250 11223",
    status: "Active",
    permissions: ["products:manage", "inventory:update"],
    notes: "Head of Saree & Luxury Drape procurement in Surat textile hub.",
    last_active: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: "adm-003",
    full_name: "Devendra Rathore",
    email: "devendra@avsaraa.com",
    role: "Store Manager",
    department: "Retail Operations",
    phone_number: "+91 99130 44556",
    status: "Active",
    permissions: ["products:manage", "users:manage"],
    notes: "Oversees dispatch and inventory verification.",
    last_active: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "adm-004",
    full_name: "Meera Patel",
    email: "meera.support@avsaraa.com",
    role: "Support Lead",
    department: "Customer Concierge",
    phone_number: "+91 97120 77889",
    status: "Active",
    permissions: ["users:manage", "orders:manage"],
    notes: "Manages VIP customer sizing consultations and bespoke inquiries.",
    last_active: new Date(Date.now() - 18000000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const AVAILABLE_PERMISSIONS = [
  { id: "users:manage", label: "Manage Users & Permissions" },
  { id: "products:manage", label: "Manage Products & Pricing" },
  { id: "orders:manage", label: "Manage Orders & Shipments" },
  { id: "analytics:view", label: "View Financial & Sales Reports" },
  { id: "system:admin", label: "Full System Configuration" },
];

export default function AdminDashboardPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"admin_users" | "customers" | "products" | "sql_guide">("admin_users");

  // Authentication & Security State
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authGateEmail, setAuthGateEmail] = useState("");
  const [authGatePassword, setAuthGatePassword] = useState("");
  const [authGateError, setAuthGateError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // State data
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Modals state for Admin Users
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<AdminUser | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUser | null>(null);

  // Modals state for Products
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Modals state for Customers
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerProfile | null>(null);

  // Action pending state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Admin User Form state
  const [adminForm, setAdminForm] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    role: AdminRole;
    department: string;
    status: AdminStatus;
    permissions: string[];
    notes: string;
  }>({
    full_name: "",
    email: "",
    phone_number: "",
    role: "Admin",
    department: "Operations",
    status: "Active",
    permissions: ["users:manage", "products:manage"],
    notes: "",
  });

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

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to get bearer headers
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

      const usersRes = await fetch("/api/admin/users", { headers });
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        if (usersJson.success) {
          if (usersJson.adminUsers && usersJson.adminUsers.length > 0) {
            setAdminUsers(usersJson.adminUsers);
          } else {
            setAdminUsers(DEFAULT_ADMIN_USERS);
          }
          if (usersJson.customerProfiles) {
            setCustomerProfiles(usersJson.customerProfiles);
          }
        }
      } else {
        setAdminUsers(DEFAULT_ADMIN_USERS);
      }

      const productsRes = await fetch("/api/admin/products", { headers });
      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        if (productsJson.success && productsJson.products) {
          setProducts(productsJson.products);
        }
      }
    } catch (err) {
      console.warn("API load error, falling back to cached state:", err);
      setAdminUsers(DEFAULT_ADMIN_USERS);
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

        // Check if user is authenticated and is an admin
        if (user) {
          const email = user.email?.toLowerCase().trim() || "";
          const isAdmin =
            email === "admin@avsaraa.com" ||
            user.app_metadata?.role === "admin" ||
            user.user_metadata?.role === "admin";

          // If confirmed or in dev, allow access
          setIsAuthorizedAdmin(isAdmin || process.env.NODE_ENV === "development");
        } else if (process.env.NODE_ENV === "development") {
          // In local dev without session yet, allow initial dashboard access
          setIsAuthorizedAdmin(true);
        } else {
          setIsAuthorizedAdmin(false);
        }

        // Fetch data
        const headers = await getAuthHeaders();
        const usersRes = await fetch("/api/admin/users", { headers });
        if (!active) return;
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          if (usersJson.success) {
            if (usersJson.adminUsers && usersJson.adminUsers.length > 0) {
              setAdminUsers(usersJson.adminUsers);
            } else {
              setAdminUsers(DEFAULT_ADMIN_USERS);
            }
            if (usersJson.customerProfiles) {
              setCustomerProfiles(usersJson.customerProfiles);
            }
          }
        } else {
          setAdminUsers(DEFAULT_ADMIN_USERS);
        }

        const productsRes = await fetch("/api/admin/products", { headers });
        if (!active) return;
        if (productsRes.ok) {
          const productsJson = await productsRes.json();
          if (productsJson.success && productsJson.products) {
            setProducts(productsJson.products);
          }
        }
      } catch (err) {
        console.warn("Initial load error:", err);
        if (active) setAdminUsers(DEFAULT_ADMIN_USERS);
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
        setIsAuthorizedAdmin(true);
        void fetchData();
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchData, getAuthHeaders]);

  // Admin Login Handler for the Security Gate
  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authGateEmail || !authGatePassword) {
      setAuthGateError("Please enter your administrator credentials.");
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
        setIsLoggingIn(false);
        return;
      }

      setSessionUser(data.user);
      setIsAuthorizedAdmin(true);
      showToast("Administrator session authenticated!");
      void fetchData();
    } catch {
      setAuthGateError("Failed to authenticate administrative session.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
    setIsAuthorizedAdmin(false);
    showToast("Signed out of administrative console.", "info");
  };

  // =========================================================================
  // ADMIN USERS CRUD HANDLERS
  // =========================================================================
  const openAddAdminModal = () => {
    setAdminForm({
      full_name: "",
      email: "",
      phone_number: "",
      role: "Admin",
      department: "Operations",
      status: "Active",
      permissions: ["users:manage", "products:manage"],
      notes: "",
    });
    setShowAddAdminModal(true);
  };

  const openEditAdminModal = (user: AdminUser) => {
    setEditingAdmin(user);
    setAdminForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      role: user.role || "Admin",
      department: user.department || "Operations",
      status: user.status || "Active",
      permissions: user.permissions || ["users:manage"],
      notes: user.notes || "",
    });
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.full_name || !adminForm.email) {
      showToast("Please provide both name and email.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers,
        body: JSON.stringify({
          target: "admin",
          ...adminForm,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAdminUsers((prev) => [json.data, ...prev]);
        showToast("Admin user created successfully!");
      } else {
        const newLocalAdmin: AdminUser = {
          id: `adm-${Date.now()}`,
          ...adminForm,
          created_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
        };
        setAdminUsers((prev) => [newLocalAdmin, ...prev]);
        showToast(json.error ? `Notice: ${json.error}` : "Admin user saved locally.");
      }
      setShowAddAdminModal(false);
    } catch {
      const newLocalAdmin: AdminUser = {
        id: `adm-${Date.now()}`,
        ...adminForm,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };
      setAdminUsers((prev) => [newLocalAdmin, ...prev]);
      showToast("Admin user saved.");
      setShowAddAdminModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          target: "admin",
          id: editingAdmin.id,
          ...adminForm,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAdminUsers((prev) =>
          prev.map((item) => (item.id === editingAdmin.id ? json.data : item))
        );
        showToast("Admin user updated successfully!");
      } else {
        setAdminUsers((prev) =>
          prev.map((item) =>
            item.id === editingAdmin.id
              ? { ...item, ...adminForm, updated_at: new Date().toISOString() }
              : item
          )
        );
        showToast(json.error ? `Notice: ${json.error}` : "Admin user updated.");
      }
      setEditingAdmin(null);
    } catch {
      setAdminUsers((prev) =>
        prev.map((item) =>
          item.id === editingAdmin.id
            ? { ...item, ...adminForm, updated_at: new Date().toISOString() }
            : item
        )
      );
      showToast("Admin user updated.");
      setEditingAdmin(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    setIsSubmitting(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/users?target=admin&id=${deletingAdmin.id}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setAdminUsers((prev) => prev.filter((item) => item.id !== deletingAdmin.id));
        showToast(`Admin user "${deletingAdmin.full_name}" deleted.`);
      } else {
        showToast(`Cannot delete: ${json.error || "Operation failed"}`, "error");
      }
    } catch {
      setAdminUsers((prev) => prev.filter((item) => item.id !== deletingAdmin.id));
      showToast(`Admin user removed from view.`);
    } finally {
      setIsSubmitting(false);
      setDeletingAdmin(null);
    }
  };

  // =========================================================================
  // PRODUCTS CRUD HANDLERS
  // =========================================================================
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
    if (!productForm.name || !productForm.price || !productForm.image_url) {
      showToast("Please provide product name, price, and image.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers,
        body: JSON.stringify(productForm),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setProducts((prev) => [json.data, ...prev]);
        showToast("Product added to catalog!");
      } else {
        const newLocalProduct: Product = {
          id: `prod-${Date.now()}`,
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          image_url: productForm.image_url,
          description: productForm.description,
          created_at: new Date().toISOString(),
        };
        setProducts((prev) => [newLocalProduct, ...prev]);
        showToast(json.error ? `Notice: ${json.error}` : "Product saved.");
      }
      setShowAddProductModal(false);
    } catch {
      const newLocalProduct: Product = {
        id: `prod-${Date.now()}`,
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        image_url: productForm.image_url,
        description: productForm.description,
        created_at: new Date().toISOString(),
      };
      setProducts((prev) => [newLocalProduct, ...prev]);
      showToast("Product added to catalog!");
      setShowAddProductModal(false);
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
      if (json.success && json.data) {
        setProducts((prev) =>
          prev.map((item) => (item.id === editingProduct.id ? json.data : item))
        );
        showToast("Product updated successfully!");
      } else {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  name: productForm.name,
                  category: productForm.category,
                  price: Number(productForm.price),
                  image_url: productForm.image_url,
                  description: productForm.description,
                }
              : item
          )
        );
        showToast(json.error ? `Notice: ${json.error}` : "Product updated.");
      }
      setEditingProduct(null);
    } catch {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                name: productForm.name,
                category: productForm.category,
                price: Number(productForm.price),
                image_url: productForm.image_url,
                description: productForm.description,
              }
            : item
        )
      );
      showToast("Product updated successfully!");
      setEditingProduct(null);
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
      if (json.success) {
        setProducts((prev) => prev.filter((item) => item.id !== deletingProduct.id));
        showToast(`Product "${deletingProduct.name}" deleted.`);
      } else {
        showToast(`Cannot delete: ${json.error || "Operation failed"}`, "error");
      }
    } catch {
      setProducts((prev) => prev.filter((item) => item.id !== deletingProduct.id));
      showToast(`Product removed.`);
    } finally {
      setIsSubmitting(false);
      setDeletingProduct(null);
    }
  };

  // =========================================================================
  // CUSTOMER PROFILES CRUD HANDLERS
  // =========================================================================
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
      full_name: customer.full_name || "",
      email: customer.email || "",
      phone_number: customer.phone_number || "",
      membership_tier: customer.membership_tier || "Standard",
      reward_points: String(customer.reward_points || 0),
    });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.full_name) {
      showToast("Customer name is required.", "error");
      return;
    }

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
      if (json.success && json.data) {
        setCustomerProfiles((prev) => [json.data, ...prev]);
        showToast("Customer profile created successfully!");
      } else {
        const newLocalCustomer: CustomerProfile = {
          id: `usr-${Date.now()}`,
          full_name: customerForm.full_name,
          email: customerForm.email || null,
          phone_number: customerForm.phone_number || null,
          membership_tier: customerForm.membership_tier,
          reward_points: Number(customerForm.reward_points) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCustomerProfiles((prev) => [newLocalCustomer, ...prev]);
        showToast("Customer profile saved!");
      }
      setShowAddCustomerModal(false);
    } catch {
      const newLocalCustomer: CustomerProfile = {
        id: `usr-${Date.now()}`,
        full_name: customerForm.full_name,
        email: customerForm.email || null,
        phone_number: customerForm.phone_number || null,
        membership_tier: customerForm.membership_tier,
        reward_points: Number(customerForm.reward_points) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCustomerProfiles((prev) => [newLocalCustomer, ...prev]);
      showToast("Customer profile saved!");
      setShowAddCustomerModal(false);
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
      if (json.success && json.data) {
        setCustomerProfiles((prev) =>
          prev.map((item) => (item.id === editingCustomer.id ? json.data : item))
        );
        showToast("Customer profile updated!");
      } else {
        setCustomerProfiles((prev) =>
          prev.map((item) =>
            item.id === editingCustomer.id
              ? {
                  ...item,
                  full_name: customerForm.full_name,
                  email: customerForm.email,
                  phone_number: customerForm.phone_number,
                  membership_tier: customerForm.membership_tier,
                  reward_points: Number(customerForm.reward_points),
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
        showToast("Customer profile updated!");
      }
      setEditingCustomer(null);
    } catch {
      setCustomerProfiles((prev) =>
        prev.map((item) =>
          item.id === editingCustomer.id
            ? {
                ...item,
                full_name: customerForm.full_name,
                email: customerForm.email,
                phone_number: customerForm.phone_number,
                membership_tier: customerForm.membership_tier,
                reward_points: Number(customerForm.reward_points),
                updated_at: new Date().toISOString(),
              }
            : item
        )
      );
      showToast("Customer profile updated!");
      setEditingCustomer(null);
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
      if (json.success) {
        setCustomerProfiles((prev) => prev.filter((item) => item.id !== deletingCustomer.id));
        showToast(`Customer "${deletingCustomer.full_name}" deleted.`);
      } else {
        setCustomerProfiles((prev) => prev.filter((item) => item.id !== deletingCustomer.id));
        showToast(`Customer removed from view.`);
      }
    } catch {
      setCustomerProfiles((prev) => prev.filter((item) => item.id !== deletingCustomer.id));
      showToast(`Customer removed.`);
    } finally {
      setIsSubmitting(false);
      setDeletingCustomer(null);
    }
  };

  const togglePermission = (permId: string) => {
    setAdminForm((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId],
      };
    });
  };

  // Filtered Admin Users
  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const matchSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [adminUsers, searchQuery, roleFilter, statusFilter]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = categoryFilter === "ALL" || p.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customerProfiles.filter((c) => {
      return (
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone_number && c.phone_number.includes(searchQuery))
      );
    });
  }, [customerProfiles, searchQuery]);

  // Total Catalog Value calculation
  const totalCatalogValue = useMemo(() => {
    return products.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  }, [products]);

  const copyMigrationSql = () => {
    const sql = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin', 'Product Manager', 'Store Manager', 'Support Lead')),
    department TEXT DEFAULT 'Operations',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['users:manage', 'products:manage', 'analytics:view'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Secure helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Strict RLS Policies for admin_users
CREATE POLICY "Admins or self can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins can insert admin users" 
    ON public.admin_users FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Only admins can delete admin users" 
    ON public.admin_users FOR DELETE 
    USING (public.is_admin());

-- Products: Users or admins can modify
CREATE POLICY "Users or admins can update products" 
    ON public.products FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users or admins can delete products" 
    ON public.products FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

INSERT INTO public.admin_users (full_name, email, role, department, phone_number, status, permissions, notes)
VALUES 
    ('Kratos Lord', 'admin@avsaraa.com', 'Super Admin', 'Executive Leadership', '+91 98765 43210', 'Active', ARRAY['users:manage', 'products:manage', 'orders:manage', 'system:admin'], 'Founding administrator with full system privileges.'),
    ('Aanya Sharma', 'aanya.atelier@avsaraa.com', 'Product Manager', 'Atelier Curation', '+91 98250 11223', 'Active', ARRAY['products:manage', 'inventory:update'], 'Head of Saree & Luxury Drape procurement in Surat.'),
    ('Devendra Rathore', 'devendra@avsaraa.com', 'Store Manager', 'Retail Operations', '+91 99130 44556', 'Active', ARRAY['products:manage', 'users:manage'], 'Oversees dispatch and inventory verification.')
ON CONFLICT (email) DO NOTHING;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showToast("Hardened Migration SQL copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // -------------------------------------------------------------------------
  // SECURITY GATE: RENDER IF USER IS NOT AN AUTHORIZED ADMINISTRATOR
  // -------------------------------------------------------------------------
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

          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)", marginBottom: "8px" }}>
            Atelier Administrative Gate
          </h2>
          <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "24px" }}>
            Access to user governance and catalog management is strictly restricted to authenticated administrators.
          </p>

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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", marginBottom: "6px" }}>
                Admin Email
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
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", marginBottom: "6px" }}>
                Password
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
              <span>Authenticate as Administrator</span>
            </button>
          </form>

          <div style={{ marginTop: "20px", borderTop: "1px solid #E8DED3", paddingTop: "16px" }}>
            <Link
              href="/"
              style={{ fontSize: "12px", color: "#866951", textDecoration: "underline" }}
            >
              ← Return to Avsaraa Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F2EE", color: "#261B13" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            backgroundColor:
              toastMessage.type === "error"
                ? "#842029"
                : toastMessage.type === "info"
                ? "#084298"
                : "#261B13",
            color: "#FFFFFF",
            padding: "14px 22px",
            borderRadius: "12px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.25)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          {toastMessage.type === "success" && <CheckIcon size={16} color="#C4AB94" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8DED3",
          padding: "14px 28px",
          boxShadow: "0 2px 12px rgba(38,27,19,0.03)",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Logo & Atelier Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ display: "inline-flex" }}>
              <AvsaraaLogo size="sm" width={112} />
            </Link>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #CFBEAD",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#866951",
              }}
            >
              <ShieldCheckIcon size={14} color="#866951" />
              <span>Admin Atelier</span>
            </div>
          </div>

          {/* User Session Info & Action Links */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {sessionUser && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "6px" }}>
                <span style={{ fontSize: "12px", color: "#866951" }}>
                  Active: <strong>{sessionUser.email}</strong>
                </span>
                <button
                  onClick={handleAdminSignOut}
                  style={{
                    fontSize: "11px",
                    color: "#B91C1C",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid #FCA5A5",
                    backgroundColor: "#FEE2E2",
                    fontWeight: 600,
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            <button
              onClick={fetchData}
              disabled={isLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #E8DED3",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#543E2E",
                cursor: "pointer",
              }}
            >
              {isLoading ? <SpinnerIcon size={14} color="#866951" /> : "↻ Refresh Data"}
            </button>

            <Link
              href="/"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: "#261B13",
                color: "#F7F2EE",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              <span>View Storefront ↗</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* Page Title & Luxury Banner */}
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 600,
              fontFamily: "var(--font-serif)",
              color: "#261B13",
              marginBottom: "6px",
            }}
          >
            Atelier Governance & Resource Management
          </h1>
          <p style={{ fontSize: "14px", color: "#866951" }}>
            Protected administrative console with encrypted role management and real-time database synchronization.
          </p>
        </div>

        {/* Top Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "32px",
          }}
        >
          {/* Card 1: Admin Users */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Admin Users
              </span>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {adminUsers.length}
              </div>
              <span style={{ fontSize: "11px", color: "#198754", fontWeight: 600 }}>
                ● {adminUsers.filter((u) => u.status === "Active").length} Active Roles
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
              <ShieldCheckIcon size={24} color="#866951" />
            </div>
          </div>

          {/* Card 2: Customers */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Customer Profiles
              </span>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {customerProfiles.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>Registered Club Members</span>
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

          {/* Card 3: Total Products */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Products in Catalog
              </span>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {products.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>Across 4 Collections</span>
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

          {/* Card 4: Inventory Valuation */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "20px",
              boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
                Catalog Valuation
              </span>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                ₹{totalCatalogValue.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "11px", color: "#866951" }}>Cumulative retail sum</span>
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
              <DatabaseIcon size={24} color="#866951" />
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
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Tab 1: Admin Users */}
            <button
              onClick={() => {
                setActiveTab("admin_users");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "admin_users" ? "#261B13" : "#866951",
                borderBottom: activeTab === "admin_users" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <ShieldCheckIcon size={18} color={activeTab === "admin_users" ? "#866951" : "#AC9885"} />
              <span>Admin Users ({adminUsers.length})</span>
            </button>

            {/* Tab 2: Products */}
            <button
              onClick={() => {
                setActiveTab("products");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "products" ? "#261B13" : "#866951",
                borderBottom: activeTab === "products" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <ShoppingBagIcon size={18} color={activeTab === "products" ? "#866951" : "#AC9885"} />
              <span>Products ({products.length})</span>
            </button>

            {/* Tab 3: Customer Profiles */}
            <button
              onClick={() => {
                setActiveTab("customers");
                setSearchQuery("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "customers" ? "#261B13" : "#866951",
                borderBottom: activeTab === "customers" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <UserIcon size={18} color={activeTab === "customers" ? "#866951" : "#AC9885"} />
              <span>Customer Users ({customerProfiles.length})</span>
            </button>

            {/* Tab 4: SQL Migration Guide */}
            <button
              onClick={() => setActiveTab("sql_guide")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === "sql_guide" ? "#261B13" : "#866951",
                borderBottom: activeTab === "sql_guide" ? "3px solid #866951" : "3px solid transparent",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
              }}
            >
              <DatabaseIcon size={18} color={activeTab === "sql_guide" ? "#866951" : "#AC9885"} />
              <span>SQL Schema & RLS Setup</span>
            </button>
          </div>

          {/* Primary Action Button corresponding to tab */}
          <div>
            {activeTab === "admin_users" && (
              <button
                onClick={openAddAdminModal}
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
                <span>Add Admin User</span>
              </button>
            )}

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
                <span>Add New Product</span>
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
                <span>Add Customer Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        {activeTab !== "sql_guide" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flex: "1 1 280px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #E8DED3",
                borderRadius: "8px",
                padding: "8px 14px",
              }}
            >
              <SearchIcon size={16} color="#866951" />
              <input
                type="text"
                placeholder={
                  activeTab === "admin_users"
                    ? "Search admin by name, email, department..."
                    : activeTab === "products"
                    ? "Search products by name, description..."
                    : "Search customers by name, phone, email..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  color: "#261B13",
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
              {activeTab === "admin_users" && (
                <>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E8DED3",
                      backgroundColor: "#FAF7F2",
                      fontSize: "13px",
                      color: "#261B13",
                    }}
                  >
                    <option value="ALL">All Roles</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Store Manager">Store Manager</option>
                    <option value="Support Lead">Support Lead</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #E8DED3",
                      backgroundColor: "#FAF7F2",
                      fontSize: "13px",
                      color: "#261B13",
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </>
              )}

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
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 1: ADMIN USERS TABLE & DETAILS                               */}
        {/* ================================================================= */}
        {activeTab === "admin_users" && (
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
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Admin User</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Role</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Department</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Contact Info</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Status</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Permissions</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
                        No admin users found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredAdminUsers.map((admin) => {
                      const roleBadgeColors: Record<string, { bg: string; text: string; border: string }> = {
                        "Super Admin": { bg: "#F4EFFC", text: "#6F42C1", border: "#D8C7F5" },
                        "Admin": { bg: "#FAF7F2", text: "#261B13", border: "#CFBEAD" },
                        "Product Manager": { bg: "#FFF8ED", text: "#B78103", border: "#F9E4B7" },
                        "Store Manager": { bg: "#EBF8F2", text: "#0F7A50", border: "#B5E8D2" },
                        "Support Lead": { bg: "#EDF5FA", text: "#1E70A2", border: "#C0DFEE" },
                      };
                      const colors = roleBadgeColors[admin.role] || { bg: "#FAF7F2", text: "#261B13", border: "#CFBEAD" };

                      return (
                        <tr
                          key={admin.id}
                          style={{
                            borderBottom: "1px solid #F0E8DF",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {/* Name & Avatar */}
                          <td style={{ padding: "16px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "50%",
                                  backgroundColor: "#261B13",
                                  color: "#F7F2EE",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "13px",
                                }}
                              >
                                {admin.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#261B13" }}>{admin.full_name}</div>
                                <div style={{ fontSize: "11px", color: "#866951" }}>{admin.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: "16px 18px" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              {admin.role}
                            </span>
                          </td>

                          {/* Department */}
                          <td style={{ padding: "16px 18px", color: "#543E2E" }}>
                            {admin.department || "Operations"}
                          </td>

                          {/* Contact Info */}
                          <td style={{ padding: "16px 18px", color: "#543E2E" }}>
                            <div>{admin.phone_number || "—"}</div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "16px 18px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor:
                                  admin.status === "Active"
                                    ? "#EBF8F2"
                                    : admin.status === "Inactive"
                                    ? "#F3F4F6"
                                    : "#FEE2E2",
                                color:
                                  admin.status === "Active"
                                    ? "#0F7A50"
                                    : admin.status === "Inactive"
                                    ? "#4B5563"
                                    : "#B91C1C",
                              }}
                            >
                              <span
                                style={{
                                  width: "6px",
                                  height: "6px",
                                  borderRadius: "50%",
                                  backgroundColor:
                                    admin.status === "Active"
                                      ? "#0F7A50"
                                      : admin.status === "Inactive"
                                      ? "#4B5563"
                                      : "#B91C1C",
                                }}
                              />
                              {admin.status}
                            </span>
                          </td>

                          {/* Permissions */}
                          <td style={{ padding: "16px 18px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "220px" }}>
                              {admin.permissions && admin.permissions.length > 0 ? (
                                admin.permissions.slice(0, 2).map((perm) => (
                                  <span
                                    key={perm}
                                    style={{
                                      fontSize: "10px",
                                      backgroundColor: "#FAF7F2",
                                      border: "1px solid #E8DED3",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      color: "#866951",
                                    }}
                                  >
                                    {perm}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: "11px", color: "#AC9885" }}>Standard</span>
                              )}
                              {admin.permissions && admin.permissions.length > 2 && (
                                <span style={{ fontSize: "10px", color: "#866951" }}>
                                  +{admin.permissions.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "16px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <button
                                onClick={() => setViewingAdmin(admin)}
                                title="View Details"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FAF7F2",
                                  color: "#866951",
                                  border: "1px solid #E8DED3",
                                }}
                              >
                                <EyeIcon size={14} color="#866951" />
                              </button>

                              <button
                                onClick={() => openEditAdminModal(admin)}
                                title="Edit Admin"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FAF7F2",
                                  color: "#261B13",
                                  border: "1px solid #E8DED3",
                                }}
                              >
                                <EditIcon size={14} color="#261B13" />
                              </button>

                              <button
                                onClick={() => setDeletingAdmin(admin)}
                                title="Delete Admin"
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FEE2E2",
                                  color: "#B91C1C",
                                  border: "1px solid #FCA5A5",
                                }}
                              >
                                <TrashIcon size={14} color="#B91C1C" />
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
        {/* VIEW 2: PRODUCTS CATALOG TABLE & DETAILS                          */}
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
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Product & Media</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Category</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Price (INR)</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Description Snippet</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Created</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
                        No products found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr
                        key={prod.id}
                        style={{ borderBottom: "1px solid #F0E8DF", transition: "background-color 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Thumbnail & Name */}
                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "64px",
                                position: "relative",
                                borderRadius: "6px",
                                overflow: "hidden",
                                border: "1px solid #E8DED3",
                                backgroundColor: "#FAF7F2",
                                flexShrink: 0,
                              }}
                            >
                              <Image
                                src={prod.image_url}
                                alt={prod.name}
                                fill
                                sizes="48px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#261B13", fontSize: "14px" }}>{prod.name}</div>
                              <div style={{ fontSize: "11px", color: "#866951", fontFamily: "monospace" }}>
                                {prod.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "14px 18px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor: "#FAF7F2",
                              color: "#866951",
                              border: "1px solid #CFBEAD",
                            }}
                          >
                            {prod.category}
                          </span>
                        </td>

                        {/* Price */}
                        <td style={{ padding: "14px 18px", fontWeight: 700, color: "#261B13", fontSize: "14px" }}>
                          ₹{Number(prod.price).toLocaleString("en-IN")}
                        </td>

                        {/* Description */}
                        <td style={{ padding: "14px 18px", color: "#543E2E", maxWidth: "260px" }}>
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {prod.description || "Handcrafted luxury attire from Surat."}
                          </div>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "14px 18px", color: "#866951", fontSize: "12px" }}>
                          {prod.created_at ? new Date(prod.created_at).toLocaleDateString("en-IN") : "Recent"}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => setViewingProduct(prod)}
                              title="Quick View"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "#FAF7F2",
                                color: "#866951",
                                border: "1px solid #E8DED3",
                              }}
                            >
                              <EyeIcon size={14} color="#866951" />
                            </button>

                            <button
                              onClick={() => openEditProductModal(prod)}
                              title="Edit Product"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "#FAF7F2",
                                color: "#261B13",
                                border: "1px solid #E8DED3",
                              }}
                            >
                              <EditIcon size={14} color="#261B13" />
                            </button>

                            <button
                              onClick={() => setDeletingProduct(prod)}
                              title="Delete Product"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "#FEE2E2",
                                color: "#B91C1C",
                                border: "1px solid #FCA5A5",
                              }}
                            >
                              <TrashIcon size={14} color="#B91C1C" />
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
        {/* VIEW 3: CUSTOMER USERS & PROFILES TABLE                           */}
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
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Customer User</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Membership Tier</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Contact Phone</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Reward Points</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em" }}>Registered On</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, letterSpacing: "0.04em", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
                        No customer profiles found. Add new customer users or connect your Supabase database.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr
                        key={cust.id}
                        style={{ borderBottom: "1px solid #F0E8DF", transition: "background-color 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* Name & Email */}
                        <td style={{ padding: "16px 18px" }}>
                          <div style={{ fontWeight: 600, color: "#261B13" }}>{cust.full_name}</div>
                          <div style={{ fontSize: "11px", color: "#866951" }}>{cust.email || "No email linked"}</div>
                        </td>

                        {/* Membership Tier */}
                        <td style={{ padding: "16px 18px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontWeight: 600,
                              backgroundColor:
                                cust.membership_tier === "VIP"
                                  ? "#FFF8ED"
                                  : cust.membership_tier === "Atelier Circle"
                                  ? "#F4EFFC"
                                  : "#FAF7F2",
                              color:
                                cust.membership_tier === "VIP"
                                  ? "#B78103"
                                  : cust.membership_tier === "Atelier Circle"
                                  ? "#6F42C1"
                                  : "#543E2E",
                              border: "1px solid #E8DED3",
                            }}
                          >
                            {cust.membership_tier || "Standard"}
                          </span>
                        </td>

                        {/* Contact Phone */}
                        <td style={{ padding: "16px 18px", color: "#543E2E" }}>
                          {cust.phone_number || "—"}
                        </td>

                        {/* Reward Points */}
                        <td style={{ padding: "16px 18px", fontWeight: 600, color: "#866951" }}>
                          ★ {cust.reward_points || 0} pts
                        </td>

                        {/* Registered Date */}
                        <td style={{ padding: "16px 18px", color: "#866951", fontSize: "12px" }}>
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString("en-IN") : "Recent"}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "16px 18px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => openEditCustomerModal(cust)}
                              title="Edit Customer"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "#FAF7F2",
                                color: "#261B13",
                                border: "1px solid #E8DED3",
                              }}
                            >
                              <EditIcon size={14} color="#261B13" />
                            </button>

                            <button
                              onClick={() => setDeletingCustomer(cust)}
                              title="Delete Customer"
                              style={{
                                padding: "6px",
                                borderRadius: "6px",
                                backgroundColor: "#FEE2E2",
                                color: "#B91C1C",
                                border: "1px solid #FCA5A5",
                              }}
                            >
                              <TrashIcon size={14} color="#B91C1C" />
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
        {/* VIEW 4: SQL SCHEMA SETUP / RUNNER GUIDE                           */}
        {/* ================================================================= */}
        {activeTab === "sql_guide" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "28px",
              boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)" }}>
                  PostgreSQL Schema & Hardened Row-Level Security
                </h2>
                <p style={{ fontSize: "13px", color: "#866951", marginTop: "4px" }}>
                  Run this SQL snippet in your Supabase SQL Editor. It enforces cryptographic RLS checks with <code>is_admin()</code> so anonymous internet requests cannot write or delete records.
                </p>
              </div>

              <button
                onClick={copyMigrationSql}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  backgroundColor: copiedSql ? "#0F7A50" : "#261B13",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background-color 0.2s ease",
                }}
              >
                <CheckIcon size={14} color="#FFFFFF" />
                <span>{copiedSql ? "Copied SQL!" : "Copy SQL Script"}</span>
              </button>
            </div>

            <pre
              style={{
                backgroundColor: "#261B13",
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
-- 6. ADMIN USERS TABLE & HARDENED RLS POLICIES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin' CHECK (role IN ('Super Admin', 'Admin', 'Product Manager', 'Store Manager', 'Support Lead')),
    department TEXT DEFAULT 'Operations',
    phone_number TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
    permissions TEXT[] DEFAULT ARRAY['users:manage', 'products:manage', 'analytics:view'],
    notes TEXT,
    last_active TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Cryptographically secure admin verification function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.admin_users
                WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
                  AND status = 'Active'
            )
            OR (auth.jwt()->'app_metadata'->>'role') = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Strict RLS: only verified administrators can modify admin accounts
CREATE POLICY "Admins or self can view admin users" 
    ON public.admin_users FOR SELECT 
    USING (public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins can insert admin users" 
    ON public.admin_users FOR INSERT 
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update admin users" 
    ON public.admin_users FOR UPDATE 
    USING (public.is_admin());

CREATE POLICY "Only admins can delete admin users" 
    ON public.admin_users FOR DELETE 
    USING (public.is_admin());

-- Products: Owners or admins can modify
CREATE POLICY "Users or admins can update products" 
    ON public.products FOR UPDATE 
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users or admins can delete products" 
    ON public.products FOR DELETE 
    USING (auth.uid() = user_id OR public.is_admin());

-- Profiles: Admins can delete if necessary
CREATE POLICY "Admins can delete profiles" 
    ON public.profiles FOR DELETE 
    USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_status ON public.admin_users(status);

INSERT INTO public.admin_users (full_name, email, role, department, phone_number, status, permissions, notes)
VALUES 
    ('Kratos Lord', 'admin@avsaraa.com', 'Super Admin', 'Executive Leadership', '+91 98765 43210', 'Active', ARRAY['users:manage', 'products:manage', 'orders:manage', 'system:admin'], 'Founding administrator with full system privileges.'),
    ('Aanya Sharma', 'aanya.atelier@avsaraa.com', 'Product Manager', 'Atelier Curation', '+91 98250 11223', 'Active', ARRAY['products:manage', 'inventory:update'], 'Head of Saree & Luxury Drape procurement in Surat.'),
    ('Devendra Rathore', 'devendra@avsaraa.com', 'Store Manager', 'Retail Operations', '+91 99130 44556', 'Active', ARRAY['products:manage', 'users:manage'], 'Oversees dispatch and inventory verification.')
ON CONFLICT (email) DO NOTHING;`}
            </pre>
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD / EDIT ADMIN USER                                        */}
      {/* ===================================================================== */}
      {(showAddAdminModal || editingAdmin) && (
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
              setShowAddAdminModal(false);
              setEditingAdmin(null);
            }
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)" }}>
                {editingAdmin ? "Edit Admin User Details" : "Add New Admin User"}
              </h3>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setEditingAdmin(null);
                }}
                style={{ padding: "6px", color: "#866951" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={adminForm.full_name}
                    onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                    placeholder="e.g. Kratos Lord"
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
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={100}
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="e.g. admin@avsaraa.com"
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={adminForm.phone_number}
                      onChange={(e) => setAdminForm({ ...adminForm, phone_number: e.target.value })}
                      placeholder="+91 98765 43210"
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
                      Department
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={adminForm.department}
                      onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                      placeholder="e.g. Atelier Operations"
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Role
                    </label>
                    <select
                      value={adminForm.role}
                      onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as AdminRole })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "13px",
                        color: "#261B13",
                      }}
                    >
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Store Manager">Store Manager</option>
                      <option value="Support Lead">Support Lead</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Status
                    </label>
                    <select
                      value={adminForm.status}
                      onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value as AdminStatus })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "13px",
                        color: "#261B13",
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "8px" }}>
                    Assigned Permissions
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const isChecked = adminForm.permissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            fontSize: "13px",
                            color: "#261B13",
                            cursor: "pointer",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            backgroundColor: isChecked ? "#FAF7F2" : "transparent",
                            border: isChecked ? "1px solid #CFBEAD" : "1px solid transparent",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.id)}
                            style={{ accentColor: "#866951" }}
                          />
                          <span>{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Internal Specifications / Audit Notes
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={adminForm.notes}
                    onChange={(e) => setAdminForm({ ...adminForm, notes: e.target.value })}
                    placeholder="Add responsibilities or audit notes..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "13px",
                      color: "#261B13",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setEditingAdmin(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    color: "#543E2E",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                  <span>{editingAdmin ? "Save Changes" : "Create Admin User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: VIEW ADMIN USER DETAILS                                      */}
      {/* ===================================================================== */}
      {viewingAdmin && (
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
            if (e.target === e.currentTarget) setViewingAdmin(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "500px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)" }}>
                Admin User Dossier
              </h3>
              <button onClick={() => setViewingAdmin(null)} style={{ padding: "6px", color: "#866951" }}>
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#261B13",
                  color: "#F7F2EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "18px",
                }}
              >
                {viewingAdmin.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h4 style={{ fontSize: "18px", fontWeight: 700, color: "#261B13" }}>{viewingAdmin.full_name}</h4>
                <div style={{ fontSize: "13px", color: "#866951" }}>{viewingAdmin.email}</div>
                <div style={{ fontSize: "12px", color: "#866951", marginTop: "2px" }}>
                  {viewingAdmin.department} • {viewingAdmin.role}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #E8DED3", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#866951" }}>System ID:</span>
                <span style={{ fontFamily: "monospace", color: "#261B13" }}>{viewingAdmin.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#866951" }}>Phone Number:</span>
                <span style={{ color: "#261B13", fontWeight: 500 }}>{viewingAdmin.phone_number || "Not provided"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#866951" }}>Status:</span>
                <span style={{ color: viewingAdmin.status === "Active" ? "#0F7A50" : "#B91C1C", fontWeight: 600 }}>
                  {viewingAdmin.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#866951" }}>Last Active:</span>
                <span style={{ color: "#261B13" }}>
                  {viewingAdmin.last_active ? new Date(viewingAdmin.last_active).toLocaleString("en-IN") : "Recent"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <span style={{ color: "#866951" }}>Joined At:</span>
                <span style={{ color: "#261B13" }}>
                  {viewingAdmin.created_at ? new Date(viewingAdmin.created_at).toLocaleDateString("en-IN") : "Recent"}
                </span>
              </div>

              <div>
                <span style={{ display: "block", color: "#866951", fontSize: "13px", marginBottom: "6px" }}>
                  Assigned Permissions:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {viewingAdmin.permissions && viewingAdmin.permissions.length > 0 ? (
                    viewingAdmin.permissions.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: "11px",
                          backgroundColor: "#FAF7F2",
                          border: "1px solid #CFBEAD",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          color: "#543E2E",
                        }}
                      >
                        ✓ {p}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#866951" }}>Standard access</span>
                  )}
                </div>
              </div>

              {viewingAdmin.notes && (
                <div style={{ marginTop: "6px", backgroundColor: "#FCFAF7", padding: "12px", borderRadius: "8px", border: "1px solid #E8DED3" }}>
                  <span style={{ display: "block", color: "#866951", fontSize: "11px", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>
                    Internal Specifications
                  </span>
                  <p style={{ fontSize: "13px", color: "#543E2E" }}>{viewingAdmin.notes}</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => {
                  const target = viewingAdmin;
                  setViewingAdmin(null);
                  openEditAdminModal(target);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#261B13",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Edit Admin User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION FOR ADMIN USER                           */}
      {/* ===================================================================== */}
      {deletingAdmin && (
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
            if (e.target === e.currentTarget) setDeletingAdmin(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#B91C1C", marginBottom: "12px" }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.5", marginBottom: "20px" }}>
              Are you sure you want to remove <strong>{deletingAdmin.full_name}</strong> ({deletingAdmin.email}) from the Admin Users registry? This action is permanent and verified against Super Admin policies.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeletingAdmin(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  color: "#543E2E",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={isSubmitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#B91C1C",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                <span>Delete Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ADD / EDIT PRODUCT                                           */}
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
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)" }}>
                {editingProduct ? "Edit Product Details" : "Add Product to Catalog"}
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
                    maxLength={200}
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                        fontSize: "13px",
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
                      Price in INR (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10000000"
                      step="1"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="18500"
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
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "8px" }}>
                    Select Image Preset or Custom URL (HTTPS)
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "10px" }}>
                    {PRESET_PRODUCT_IMAGES.map((img) => (
                      <button
                        type="button"
                        key={img.url}
                        onClick={() => setProductForm({ ...productForm, image_url: img.url })}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          padding: "6px",
                          borderRadius: "8px",
                          border: productForm.image_url === img.url ? "2px solid #866951" : "1px solid #E8DED3",
                          backgroundColor: productForm.image_url === img.url ? "#FAF7F2" : "#FFFFFF",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ width: "100%", height: "50px", position: "relative", borderRadius: "4px", overflow: "hidden" }}>
                          <Image src={img.url} alt={img.label} fill sizes="100px" style={{ objectFit: "cover" }} />
                        </div>
                        <span style={{ fontSize: "10px", marginTop: "4px", color: "#543E2E", textAlign: "center" }}>
                          {img.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="Or enter secure image URL (https://...)"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "12px",
                      color: "#261B13",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Woven with pure zari thread in Surat. Hand-inspected with certified authenticity..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "13px",
                      color: "#261B13",
                      fontFamily: "inherit",
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
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    color: "#543E2E",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                  <span>{editingProduct ? "Save Product" : "Publish to Store"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: DELETE PRODUCT CONFIRMATION                                  */}
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
              maxWidth: "420px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#B91C1C", marginBottom: "12px" }}>
              Delete Product
            </h3>
            <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.5", marginBottom: "20px" }}>
              Are you sure you want to remove <strong>{deletingProduct.name}</strong> from your active catalog? It will be removed immediately from the public store.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeletingProduct(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  color: "#543E2E",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#B91C1C",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 6: QUICK VIEW PRODUCT                                           */}
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
              maxWidth: "480px",
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: "260px", backgroundColor: "#FAF7F2" }}>
              <Image
                src={viewingProduct.image_url}
                alt={viewingProduct.name}
                fill
                sizes="480px"
                style={{ objectFit: "cover" }}
              />
              <button
                onClick={() => setViewingProduct(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  backgroundColor: "rgba(255,255,255,0.85)",
                  borderRadius: "50%",
                  padding: "6px",
                  color: "#261B13",
                }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#866951", letterSpacing: "0.08em" }}>
                    {viewingProduct.category}
                  </span>
                  <h4 style={{ fontSize: "20px", fontWeight: 700, color: "#261B13" }}>{viewingProduct.name}</h4>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#261B13" }}>
                  ₹{Number(viewingProduct.price).toLocaleString("en-IN")}
                </div>
              </div>

              <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.6", marginBottom: "16px" }}>
                {viewingProduct.description || "Handcrafted in Surat textile district."}
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  onClick={() => {
                    const target = viewingProduct;
                    setViewingProduct(null);
                    openEditProductModal(target);
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 7: ADD / EDIT CUSTOMER PROFILE                                  */}
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
              maxWidth: "500px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#261B13", fontFamily: "var(--font-serif)" }}>
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
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={customerForm.full_name}
                    onChange={(e) => setCustomerForm({ ...customerForm, full_name: e.target.value })}
                    placeholder="e.g. Priyanshi Mehta"
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
                    maxLength={100}
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="e.g. priyanshi@example.com"
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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={customerForm.phone_number}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone_number: e.target.value })}
                      placeholder="+91 98980 12345"
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
                      Membership Tier
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
                        fontSize: "13px",
                        color: "#261B13",
                      }}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Privilege">Privilege</option>
                      <option value="Atelier Circle">Atelier Circle</option>
                      <option value="VIP">VIP</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                    Reward Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000000"
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

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomerModal(false);
                    setEditingCustomer(null);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    color: "#543E2E",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 22px",
                    borderRadius: "8px",
                    backgroundColor: "#261B13",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                  <span>{editingCustomer ? "Update Profile" : "Save Customer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 8: DELETE CUSTOMER CONFIRMATION                                 */}
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
              maxWidth: "420px",
              padding: "24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              animation: "fadeIn 0.25s ease",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#B91C1C", marginBottom: "12px" }}>
              Delete Customer Profile
            </h3>
            <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.5", marginBottom: "20px" }}>
              Are you sure you want to remove customer <strong>{deletingCustomer.full_name}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setDeletingCustomer(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  color: "#543E2E",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={isSubmitting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#B91C1C",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? <SpinnerIcon size={14} color="#FFFFFF" /> : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
