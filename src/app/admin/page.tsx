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
  SpinnerIcon,
  CheckIcon,
  MailIcon,
  CameraIcon,
  StarIcon,
  DeliveryVanIcon,
  TagIcon,
  DiamondCrownIcon,
  RefreshIcon,
} from "@/components/Icons";
import { AdminUser, CustomerProfile, ContactInquiry, NewsletterSubscriber, ProductReview } from "@/types/admin";
import { Product, ProductCategory } from "@/types/product";
import { Order } from "@/types/order";
import OrdersAdminTab from "@/components/admin/OrdersAdminTab";
import CouponsAdminTab from "@/components/admin/CouponsAdminTab";
import { ADMIN_EMAIL, isSuperAdminUser } from "@/lib/adminConstants";

// Single Super Admin Default
const DEFAULT_SUPER_ADMIN: AdminUser = {
  id: "adm-001",
  full_name: "Kratos Lord",
  email: ADMIN_EMAIL,
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
  // Navigation tabs - Orders & Fulfillment, Customer Accounts, etc.
  const [activeTab, setActiveTab] = useState<
    "orders" | "customers" | "reviews" | "super_admin" | "products" | "inquiries" | "coupons"
  >("orders");

  // Authentication & Security State
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [authGatePassword, setAuthGatePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authGateError, setAuthGateError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Platform Data
  const [superAdmin, setSuperAdmin] = useState<AdminUser>(DEFAULT_SUPER_ADMIN);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>("ALL");
  const [reviewFilter, setReviewFilter] = useState<"ALL" | "WITH_MEDIA" | "5_STAR" | "FLAGGED">("ALL");

  // Reviews Modals & Actions
  const [isDeletingReviewId, setIsDeletingReviewId] = useState<string | null>(null);
  const [previewMediaModal, setPreviewMediaModal] = useState<{ url: string; title?: string } | null>(null);

  // Modals state for Products
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Modals state for Customers & CRM
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerProfile | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerProfile | null>(null);
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState<string>("ALL");
  const [customerDetailSubTab, setCustomerDetailSubTab] = useState<"orders" | "addresses" | "inquiries" | "notes">("orders");
  const [crmNoteDraft, setCrmNoteDraft] = useState("");
  const [isSavingCrmNote, setIsSavingCrmNote] = useState(false);
  const [isConvertingGuest, setIsConvertingGuest] = useState(false);

  // Modals state for Super Admin & Inquiries
  const [showEditSuperAdminModal, setShowEditSuperAdminModal] = useState(false);
  const [viewingInquiry, setViewingInquiry] = useState<ContactInquiry | null>(null);
  const [deletingInquiry, setDeletingInquiry] = useState<ContactInquiry | null>(null);
  const [sendingAckId, setSendingAckId] = useState<string | null>(null);

  // Bulk Product Ingestion & Image Upload States
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkParsedProducts, setBulkParsedProducts] = useState<Array<Record<string, unknown>>>([]);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);
  const [productPhotoUploadNotice, setProductPhotoUploadNotice] = useState<string | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadNotice, setGalleryUploadNotice] = useState<string | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product Form state (with Promotional, Stock, Sizes, Colourways & Atelier Craftsmanship capabilities)
  const [productForm, setProductForm] = useState<{
    name: string;
    category: ProductCategory;
    price: string;
    mrp: string;
    discount_percent: string;
    stock_count: string;
    promo_tag: string;
    image_url: string;
    gallery_images: string[];
    available_sizes: string[];
    size_inventory: Record<string, number>;
    color_variants: Array<{
      name: string;
      hex: string;
      image_url: string;
      gallery_images?: string[];
      stock?: number;
      sizes?: Array<{
        size: string;
        stock: number;
      }>;
    }>;
    description: string;
    fabric: string;
    weave: string;
    video_url: string;
    sku: string;
    hsn_code: string;
    cluster_origin: string;
  }>({
    name: "",
    category: "Sarees",
    price: "",
    mrp: "",
    discount_percent: "0",
    stock_count: "10",
    promo_tag: "",
    image_url: "",
    gallery_images: [],
    available_sizes: ["Free Size"],
    size_inventory: { "Free Size": 10 },
    color_variants: [],
    description: "",
    fabric: "",
    weave: "",
    video_url: "",
    sku: "",
    hsn_code: "",
    cluster_origin: "",
  });

  const [customSizeInput, setCustomSizeInput] = useState("");
  const [uploadingColorVariantIdx, setUploadingColorVariantIdx] = useState<number | null>(null);

  // Customer Form state (with Concierge Notes)
  const [customerForm, setCustomerForm] = useState<{
    full_name: string;
    email: string;
    phone_number: string;
    status: string;
    membership_tier: string;
    reward_points: string;
    concierge_notes: string;
  }>({
    full_name: "",
    email: "",
    phone_number: "",
    status: "Active",
    membership_tier: "Standard",
    reward_points: "100",
    concierge_notes: "",
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

  // Drag-and-Drop Catalog Showcase Ordering State
  const [draggedProductIndex, setDraggedProductIndex] = useState<number | null>(null);
  const [dragOverProductIndex, setDragOverProductIndex] = useState<number | null>(null);
  const [isReorderingShowcase, setIsReorderingShowcase] = useState(false);

  const saveShowcaseOrder = async (orderedList: Product[]) => {
    setIsReorderingShowcase(true);
    try {
      const headers = await getAuthHeaders();
      const orderedIds = orderedList.map((p) => p.id);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ orderedIds, action: "reorder" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✨ Catalog Showcase Order updated & published live!");
      } else {
        showToast(`Error: ${data.error || "Failed to save order"}`, "error");
      }
    } catch {
      showToast("Failed to save showcase ordering.", "error");
    } finally {
      setIsReorderingShowcase(false);
    }
  };

  const handleProductDragStart = (e: React.DragEvent, index: number) => {
    setDraggedProductIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleProductDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverProductIndex !== index) {
      setDragOverProductIndex(index);
    }
  };

  const handleProductDragEnd = () => {
    setDraggedProductIndex(null);
    setDragOverProductIndex(null);
  };

  const handleProductDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedProductIndex === null || draggedProductIndex === targetIndex) {
      setDraggedProductIndex(null);
      setDragOverProductIndex(null);
      return;
    }

    const reordered = [...products];
    const [moved] = reordered.splice(draggedProductIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setProducts(reordered);
    setDraggedProductIndex(null);
    setDragOverProductIndex(null);
    void saveShowcaseOrder(reordered);
  };

  const handleNudgeProductOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const reordered = [...products];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    setProducts(reordered);
    void saveShowcaseOrder(reordered);
  };

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

      // 4. Fetch Customer Reviews (photos)
      const reviewsRes = await fetch("/api/admin/reviews", { headers });
      if (reviewsRes.ok) {
        const reviewsJson = await reviewsRes.json();
        if (reviewsJson.success && reviewsJson.reviews) {
          setReviews(reviewsJson.reviews);
        }
      }

      // 5. Fetch Orders & Fulfillment
      const ordersRes = await fetch("/api/admin/orders", { headers });
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        if (ordersJson.success && ordersJson.orders) {
          setAdminOrders(ordersJson.orders);
        }
      }
    } catch (err) {
      console.warn("API load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // Live Dashboard Refresh Handler
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      showToast("Live dashboard synchronized with database!", "success");
    } catch {
      showToast("Failed to refresh dashboard data", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial authentication check & data mount
  useEffect(() => {
    let active = true;

    const checkSecurityAndLoad = async () => {
      try {
        // 1. Primary check: verify standalone HttpOnly JWT session ('admin-auth' cookie)
        const authRes = await fetch("/api/admin/auth");
        if (authRes.ok) {
          const authJson = await authRes.json();
          if (authJson.authenticated && authJson.admin) {
            if (!active) return;
            const mockAdminUser: User = {
              id: "admin-master",
              email: authJson.admin.email || ADMIN_EMAIL,
              app_metadata: { role: "super_admin" },
              user_metadata: { role: "super_admin", full_name: authJson.admin.full_name || "Super Admin" },
              aud: "authenticated",
              created_at: new Date().toISOString(),
            } as User;
            setSessionUser(mockAdminUser);
            setIsAuthorizedAdmin(true);
            void fetchData();
            return;
          }
        }

        // 2. Fallback check: Supabase Auth session
        const { data: authData } = await supabase.auth.getUser();
        if (!active) return;

        const user = authData?.user ?? null;
        setSessionUser(user);

        if (user && isSuperAdminUser(user)) {
          setIsAuthorizedAdmin(true);
          void fetchData();
          return;
        }

        setIsAuthorizedAdmin(false);
      } catch (err) {
        console.warn("Initial admin auth verification error:", err);
        if (active) {
          setIsAuthorizedAdmin(false);
        }
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
        const isSuperAdmin = isSuperAdminUser(user);
        setIsAuthorizedAdmin(isSuperAdmin);
        if (isSuperAdmin) {
          void fetchData();
        }
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [fetchData, getAuthHeaders]);

  // Admin Login Handler for the Security Gate (Login on /admin route with master password)
  const handleAdminGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authGatePassword) {
      setAuthGateError("Please enter the master password.");
      return;
    }

    setIsLoggingIn(true);
    setAuthGateError(null);

    try {
      // Direct verification against backend master credential authority
      const syncRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: authGatePassword,
        }),
      });

      const syncJson = await syncRes.json();

      if (!syncRes.ok || !syncJson.success) {
        setAuthGateError(syncJson.error || "Invalid master password. Access denied.");
        return;
      }

      // Successful verification: HttpOnly admin-auth cookie is set
      const mockAdminUser: User = {
        id: "admin-master",
        email: ADMIN_EMAIL,
        app_metadata: { role: "super_admin" },
        user_metadata: { role: "super_admin", full_name: "Super Admin" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;

      setSessionUser(mockAdminUser);
      setIsAuthorizedAdmin(true);
      showToast("Master Password Verified. Admin Console Unlocked.");
      void fetchData();

      // Background attempt to sync client-side Supabase auth session
      try {
        await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: authGatePassword,
        });
      } catch {
        // Standalone JWT cookie handles all admin route authorization
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setAuthGateError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setSessionUser(null);
    setIsAuthorizedAdmin(false);
    setAuthGatePassword("");
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
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "Sarees",
      price: "",
      mrp: "",
      discount_percent: "0",
      stock_count: "10",
      promo_tag: "",
      image_url: "",
      gallery_images: [],
      available_sizes: ["Free Size"],
      size_inventory: { "Free Size": 10 },
      color_variants: [],
      description: "",
      fabric: "",
      weave: "",
      video_url: "",
      sku: "",
      hsn_code: "",
      cluster_origin: "",
    });
    setCustomSizeInput("");
    setProductPhotoUploadNotice(null);
    setGalleryUploadNotice(null);
    setShowAddProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    const promoTag = (product.occasion_tags || []).find((t) =>
      ["Special Promo", "Festive Offer", "Sale", "Under ₹1,299", "Flash Deal", "Limited Deal"].includes(t)
    ) || "";

    const sizes = Array.isArray(product.available_sizes) && product.available_sizes.length > 0
      ? product.available_sizes
      : product.category === "Sarees"
      ? ["Free Size"]
      : ["S", "M", "L", "XL"];

    const existingSizeInv: Record<string, number> =
      product.size_inventory ||
      (product.specifications?.size_inventory as Record<string, number> | undefined) ||
      {};

    const sizeInv: Record<string, number> = {};
    sizes.forEach((sz) => {
      sizeInv[sz] = existingSizeInv[sz] !== undefined ? existingSizeInv[sz] : 10;
    });

    const colors = Array.isArray(product.color_variants)
      ? product.color_variants.map((v) => ({
          name: v.name || "",
          hex: v.hex || "#8B0000",
          image_url: v.image_url || v.primary_image || "",
          gallery_images: Array.isArray(v.gallery_images) ? v.gallery_images : [],
          stock: v.stock !== undefined ? v.stock : undefined,
          sizes: Array.isArray(v.sizes)
            ? v.sizes.map((s) => ({
                size: s.size || "",
                stock: s.stock !== undefined ? s.stock : 5,
              }))
            : [],
        }))
      : [];

    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      mrp: product.mrp ? String(product.mrp) : "",
      discount_percent: product.discount_percent !== undefined ? String(product.discount_percent) : "0",
      stock_count: product.stock_count !== undefined ? String(product.stock_count) : "10",
      promo_tag: promoTag,
      image_url: product.image_url,
      gallery_images: Array.isArray(product.gallery_images) ? product.gallery_images : [],
      available_sizes: sizes,
      size_inventory: sizeInv,
      color_variants: colors,
      description: product.description || "",
      fabric: product.fabric || (typeof product.specifications?.fabric === "string" ? product.specifications.fabric : ""),
      weave: product.weave || (typeof product.specifications?.work === "string" ? product.specifications.work : ""),
      video_url: product.video_url || "",
      sku: product.sku || (typeof product.specifications?.sku === "string" ? product.specifications.sku : ""),
      hsn_code: product.hsn_code || (typeof product.specifications?.hsn_code === "string" ? product.specifications.hsn_code : ""),
      cluster_origin: product.cluster_origin || (typeof product.specifications?.cluster_origin === "string" ? product.specifications.cluster_origin : ""),
    });
    setCustomSizeInput("");
    setProductPhotoUploadNotice(null);
    setGalleryUploadNotice(null);
  };

  const openCloneProductModal = (product: Product) => {
    openEditProductModal(product);
    setEditingProduct(null);
    setProductForm((prev) => ({
      ...prev,
      name: `${prev.name} (Copy)`,
      sku: prev.sku ? `${prev.sku}-COPY` : "",
    }));
    setShowAddProductModal(true);
    showToast(`Garment "${product.name}" duplicated into creation form.`);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeaders();
      const numPrice = Number(productForm.price);
      const numMrp = productForm.mrp ? Number(productForm.mrp) : undefined;
      const numDiscount = Number(productForm.discount_percent) || 0;
      const numStock = Number(productForm.stock_count) || 10;
      const occasionTags = productForm.promo_tag && productForm.promo_tag !== "None"
        ? [productForm.promo_tag]
        : [];

      const cleanColors = (productForm.color_variants || [])
        .filter((c) => c.name.trim().length > 0)
        .map((c) => {
          const cleanSizes = (c.sizes || [])
            .filter((s) => s.size.trim().length > 0)
            .map((s) => ({
              size: s.size.trim(),
              stock: Math.max(0, Number(s.stock) || 0),
            }));
          const colorStock = cleanSizes.length > 0
            ? cleanSizes.reduce((sum, s) => sum + s.stock, 0)
            : c.stock !== undefined
            ? Math.max(0, Number(c.stock) || 0)
            : undefined;
          return {
            name: c.name.trim(),
            hex: c.hex.trim() || "#8B0000",
            image_url: c.image_url.trim(),
            primary_image: c.image_url.trim(),
            gallery_images: c.gallery_images || [],
            ...(cleanSizes.length > 0 ? { sizes: cleanSizes } : {}),
            ...(colorStock !== undefined ? { stock: colorStock } : {}),
          };
        });

      const payload = {
        name: productForm.name,
        category: productForm.category,
        price: numPrice,
        mrp: numMrp,
        discount_percent: numDiscount,
        stock_count: numStock,
        occasion_tags: occasionTags,
        image_url: productForm.image_url,
        gallery_images: productForm.gallery_images,
        available_sizes: productForm.available_sizes,
        size_inventory: productForm.size_inventory,
        color_variants: cleanColors,
        description: productForm.description,
        fabric: productForm.fabric?.trim() || undefined,
        weave: productForm.weave?.trim() || undefined,
        video_url: productForm.video_url?.trim() || undefined,
        sku: productForm.sku?.trim() || undefined,
        hsn_code: productForm.hsn_code?.trim() || undefined,
        cluster_origin: productForm.cluster_origin?.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create product");
      }

      const created: Product = json.data || {
        id: crypto.randomUUID(),
        ...payload,
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
      const numPrice = Number(productForm.price);
      const numMrp = productForm.mrp ? Number(productForm.mrp) : undefined;
      const numDiscount = Number(productForm.discount_percent) || 0;
      const numStock = Number(productForm.stock_count) || 10;
      const occasionTags = productForm.promo_tag && productForm.promo_tag !== "None"
        ? [productForm.promo_tag]
        : [];

      const cleanColors = (productForm.color_variants || [])
        .filter((c) => c.name.trim().length > 0)
        .map((c) => {
          const cleanSizes = (c.sizes || [])
            .filter((s) => s.size.trim().length > 0)
            .map((s) => ({
              size: s.size.trim(),
              stock: Math.max(0, Number(s.stock) || 0),
            }));
          const colorStock = cleanSizes.length > 0
            ? cleanSizes.reduce((sum, s) => sum + s.stock, 0)
            : c.stock !== undefined
            ? Math.max(0, Number(c.stock) || 0)
            : undefined;
          return {
            name: c.name.trim(),
            hex: c.hex.trim() || "#8B0000",
            image_url: c.image_url.trim(),
            primary_image: c.image_url.trim(),
            gallery_images: c.gallery_images || [],
            ...(cleanSizes.length > 0 ? { sizes: cleanSizes } : {}),
            ...(colorStock !== undefined ? { stock: colorStock } : {}),
          };
        });

      const payload = {
        id: editingProduct.id,
        name: productForm.name,
        category: productForm.category,
        price: numPrice,
        mrp: numMrp,
        discount_percent: numDiscount,
        stock_count: numStock,
        occasion_tags: occasionTags,
        image_url: productForm.image_url,
        gallery_images: productForm.gallery_images,
        available_sizes: productForm.available_sizes,
        size_inventory: productForm.size_inventory,
        color_variants: cleanColors,
        description: productForm.description,
        fabric: productForm.fabric?.trim() || undefined,
        weave: productForm.weave?.trim() || undefined,
        video_url: productForm.video_url?.trim() || undefined,
        sku: productForm.sku?.trim() || undefined,
        hsn_code: productForm.hsn_code?.trim() || undefined,
        cluster_origin: productForm.cluster_origin?.trim() || undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update product");
      }

      const updated: Product = json.data || {
        ...editingProduct,
        ...payload,
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

  // Upload Product Photo (Auto-renamed & organized to Cloudflare)
  const handleUploadProductPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProductPhoto(true);
    setProductPhotoUploadNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "products");
      if (productForm.name) formData.append("product_name", productForm.name);
      if (productForm.category) formData.append("category", productForm.category);
      formData.append("role", "hero");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Failed to upload photo");
      }

      setProductForm((prev) => ({ ...prev, image_url: data.url }));
      const sizeKb = Math.round(data.sizeBytes / 1024);
      setProductPhotoUploadNotice(
        `✓ Organized to Cloudflare: ${sizeKb} KB WebP (${data.path || "compressed"}).`
      );
      showToast(`Hero photo organized to Cloudflare (${sizeKb} KB WebP)!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error";
      showToast(msg, "error");
    } finally {
      setIsUploadingProductPhoto(false);
      e.target.value = "";
    }
  };

  // Upload Multiple Gallery Photos (Auto-renamed & organized to Cloudflare)
  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    setGalleryUploadNotice(null);
    const newUrls: string[] = [];
    let uploadCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        if (productForm.name) formData.append("product_name", productForm.name);
        if (productForm.category) formData.append("category", productForm.category);
        const roleIndex = (productForm.gallery_images?.length || 0) + i + 1;
        formData.append("role", `gallery-${roleIndex}`);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          newUrls.push(data.url);
          uploadCount++;
        }
      }

      if (newUrls.length > 0) {
        setProductForm((prev) => ({
          ...prev,
          gallery_images: [...(prev.gallery_images || []), ...newUrls],
        }));
        setGalleryUploadNotice(`✓ Added ${uploadCount} gallery image(s) organized in Cloudflare.`);
        showToast(`${uploadCount} gallery image(s) organized to Cloudflare!`);
      } else {
        throw new Error("Failed to upload gallery images");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gallery upload error";
      showToast(msg, "error");
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      gallery_images: (prev.gallery_images || []).filter((_, i) => i !== indexToRemove),
    }));
  };

  // CSV Parsing and Bulk Ingestion
  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    const items: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || values.every((v) => !v)) continue;

      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      if (row.name && row.price) {
        items.push({
          name: row.name,
          category: row.category || "Sarees",
          price: Number(row.price),
          mrp: row.mrp ? Number(row.mrp) : Number(row.price),
          stock_count: row.stock_count ? Number(row.stock_count) : 10,
          fabric: row.fabric || undefined,
          weave: row.weave || undefined,
          available_sizes: row.available_sizes
            ? String(row.available_sizes).split(",").map((s) => s.trim()).filter(Boolean)
            : ["Free Size"],
          image_url: row.image_url || "/images/products/hero-default.webp",
          description: row.description || undefined,
        });
      }
    }
    return items;
  };

  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkCsvFile(file);
    setBulkImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = String(evt.target?.result || "");
        const parsed = parseCsvText(text);
        if (parsed.length === 0) {
          setBulkImportError("No valid product rows found in the CSV. Please ensure headers match the template.");
          setBulkParsedProducts([]);
        } else {
          setBulkParsedProducts(parsed);
        }
      } catch {
        setBulkImportError("Failed to parse CSV file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = async () => {
    if (bulkParsedProducts.length === 0) return;

    setBulkImporting(true);
    setBulkImportError(null);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers,
        body: JSON.stringify({ bulk: bulkParsedProducts }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Bulk import failed");
      }

      showToast(`Successfully imported ${json.count || bulkParsedProducts.length} products!`);
      setShowBulkImportModal(false);
      setBulkCsvFile(null);
      setBulkParsedProducts([]);
      
      const prodRes = await fetch("/api/admin/products", { headers });
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && prodData.products) {
          setProducts(prodData.products);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setBulkImportError(msg);
      showToast(msg, "error");
    } finally {
      setBulkImporting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Customer Profile & CRM Operations
  // ---------------------------------------------------------------------------
  const openAddCustomerModal = () => {
    setCustomerForm({
      full_name: "",
      email: "",
      phone_number: "",
      status: "Active",
      membership_tier: "Standard",
      reward_points: "100",
      concierge_notes: "",
    });
    setShowAddCustomerModal(true);
  };

  const openEditCustomerModal = (customer: CustomerProfile) => {
    setEditingCustomer(customer);
    setCustomerForm({
      full_name: customer.full_name,
      email: customer.email || "",
      phone_number: customer.phone_number || "",
      status: customer.status || "Active",
      membership_tier: customer.membership_tier,
      reward_points: String(customer.reward_points || 0),
      concierge_notes: customer.concierge_notes || "",
    });
  };

  const openViewCustomerModal = (customer: CustomerProfile) => {
    setViewingCustomer(customer);
    setCrmNoteDraft(customer.concierge_notes || "");
    setCustomerDetailSubTab("orders");
  };

  const handleSaveCrmNote = async () => {
    if (!viewingCustomer) return;
    setIsSavingCrmNote(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          target: "customer",
          id: viewingCustomer.id,
          concierge_notes: crmNoteDraft,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save concierge notes");
      }
      const updatedNotes = crmNoteDraft;
      setCustomerProfiles((prev) =>
        prev.map((c) =>
          c.id === viewingCustomer.id ? { ...c, concierge_notes: updatedNotes } : c
        )
      );
      setViewingCustomer((prev) => (prev ? { ...prev, concierge_notes: updatedNotes } : null));
      showToast("Patron concierge notes saved.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save notes";
      showToast(message, "error");
    } finally {
      setIsSavingCrmNote(false);
    }
  };

  const handleConvertGuestToPatron = async () => {
    if (!viewingCustomer) return;
    setIsConvertingGuest(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          target: "customer",
          id: viewingCustomer.id,
          full_name: viewingCustomer.full_name,
          email: viewingCustomer.email,
          phone_number: viewingCustomer.phone_number,
          status: "Active",
          membership_tier: viewingCustomer.membership_tier || "Standard",
          reward_points: 100,
          concierge_notes: crmNoteDraft || viewingCustomer.concierge_notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to convert guest to permanent patron");
      }
      const newProfile: CustomerProfile = json.data;
      setCustomerProfiles((prev) =>
        prev.map((c) =>
          c.id === viewingCustomer.id ? { ...c, ...newProfile, is_guest: false } : c
        )
      );
      setViewingCustomer((prev) => (prev ? { ...prev, ...newProfile, is_guest: false } : null));
      showToast(`Guest account converted to registered patron.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to convert guest";
      showToast(message, "error");
    } finally {
      setIsConvertingGuest(false);
    }
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

  const handleSendInquiryAcknowledgement = async (inq: ContactInquiry) => {
    try {
      setSendingAckId(inq.id);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "acknowledge", id: inq.id }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Acknowledgement email dispatched to ${inq.email} from support@avsaraa.in`, "success");
      } else {
        showToast(json.error || "Failed to send acknowledgement email", "error");
      }
    } catch {
      showToast("Error sending acknowledgement email", "error");
    } finally {
      setSendingAckId(null);
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
  // Customer Review Management Handlers
  // ---------------------------------------------------------------------------
  const handleDeleteReview = async (reviewId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this customer review? All patron photos will be removed."
      )
    ) {
      return;
    }

    setIsDeletingReviewId(reviewId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: "DELETE",
        headers,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast("Customer review deleted permanently.", "success");
      } else {
        throw new Error(json.error || "Failed to delete review");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deletion failed";
      showToast(msg, "error");
    } finally {
      setIsDeletingReviewId(null);
    }
  };

  const handleToggleReviewStatus = async (review: ProductReview) => {
    const nextStatus = review.status === "published" ? "hidden" : "published";
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: review.id,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, status: nextStatus } : r))
        );
        showToast(`Review marked as ${nextStatus}.`, "success");
      } else {
        throw new Error(json.error || "Failed to update review status");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      showToast(msg, "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Filtered Lists
  // ---------------------------------------------------------------------------
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        r.customer_name.toLowerCase().includes(query) ||
        (r.title && r.title.toLowerCase().includes(query)) ||
        r.comment.toLowerCase().includes(query) ||
        (r.product_name && r.product_name.toLowerCase().includes(query)) ||
        (r.customer_city && r.customer_city.toLowerCase().includes(query));

      let matchFilter = true;
      if (reviewFilter === "WITH_MEDIA") {
        matchFilter = Boolean(r.photos && r.photos.length > 0);
      } else if (reviewFilter === "5_STAR") {
        matchFilter = r.rating === 5;
      } else if (reviewFilter === "FLAGGED") {
        matchFilter = r.status === "flagged" || r.status === "hidden";
      }

      return matchSearch && matchFilter;
    });
  }, [reviews, searchQuery, reviewFilter]);
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.occasion_tags && p.occasion_tags.some((t) => t.toLowerCase().includes(q)));

      let matchCategory = true;
      if (categoryFilter === "PROMO") {
        matchCategory = Boolean(
          (p.mrp && p.mrp > p.price) ||
          (p.discount_percent && p.discount_percent > 0) ||
          (p.occasion_tags && p.occasion_tags.some((t) => t.toLowerCase().includes("promo") || t.toLowerCase().includes("sale")))
        );
      } else if (categoryFilter === "UNDER_1299") {
        matchCategory = p.price <= 1299;
      } else if (categoryFilter === "LOW_STOCK") {
        matchCategory = Boolean(p.stock_count !== undefined && p.stock_count > 0 && p.stock_count <= 3);
      } else if (categoryFilter === "OUT_OF_STOCK") {
        matchCategory = p.stock_count === 0;
      } else if (categoryFilter !== "ALL") {
        matchCategory = p.category === categoryFilter;
      }
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  const filteredCustomers = useMemo(() => {
    return customerProfiles.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone_number && c.phone_number.includes(q)) ||
        (c.primary_city && c.primary_city.toLowerCase().includes(q));

      const matchSegment =
        customerSegmentFilter === "ALL" ||
        (customerSegmentFilter === "GUEST" && c.is_guest) ||
        (customerSegmentFilter === "REGISTERED" && !c.is_guest) ||
        c.rfm_segment === customerSegmentFilter ||
        c.membership_tier === customerSegmentFilter;

      return matchSearch && matchSegment;
    });
  }, [customerProfiles, searchQuery, customerSegmentFilter]);

  const crmMetrics = useMemo(() => {
    const totalCustomers = customerProfiles.length;
    const totalSpend = customerProfiles.reduce((acc, c) => acc + (c.total_spend || 0), 0);
    const vipCount = customerProfiles.filter((c) => c.membership_tier === "VIP" || c.membership_tier === "Atelier Circle").length;
    const repeatBuyers = customerProfiles.filter((c) => (c.order_count || 0) > 1).length;
    const guestCount = customerProfiles.filter((c) => c.is_guest).length;
    return {
      totalCustomers,
      totalSpend,
      vipCount,
      repeatBuyers,
      guestCount,
    };
  }, [customerProfiles]);

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

  // Executive KPI Aggregations
  const orderStats = useMemo(() => {
    const totalOrders = adminOrders.length;
    const paidOrders = adminOrders.filter((o) => o.payment_status === "Paid");
    const totalRevenue = paidOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
    const exchangeRequestedCount = adminOrders.filter((o) => o.order_status === "Exchange Requested").length;
    const inTransitCount = adminOrders.filter((o) => o.order_status === "Dispatched" || o.order_status === "Out for Delivery").length;
    const deliveredCount = adminOrders.filter((o) => o.order_status === "Delivered").length;
    return {
      totalOrders,
      paidOrdersCount: paidOrders.length,
      totalRevenue,
      avgOrderValue,
      exchangeRequestedCount,
      inTransitCount,
      deliveredCount,
    };
  }, [adminOrders]);

  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stock_count !== undefined && p.stock_count > 0 && p.stock_count <= 3).length;
    const outOfStockCount = products.filter((p) => p.stock_count === 0).length;
    const totalStockSum = products.reduce((acc, p) => acc + (Number(p.stock_count) || 0), 0);
    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalStockSum,
    };
  }, [products]);

  const inquiryStats = useMemo(() => {
    const unreadCount = inquiries.filter((i) => i.status === "Unread").length;
    return {
      unreadCount,
      total: inquiries.length,
    };
  }, [inquiries]);

  // ---------------------------------------------------------------------------
  // AUTH CHECKING: CLEAN MINIMAL SPINNER WHILE VERIFYING SECURITY CREDENTIALS
  // ---------------------------------------------------------------------------
  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F7F2EE",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        <AvsaraaLogo size="md" width={140} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#866951", fontSize: "13.5px" }}>
          <SpinnerIcon size={18} color="#866951" />
          <span>Verifying administrative authorization...</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECURITY GATE: RENDER IF USER IS NOT AN AUTHORIZED SUPER ADMINISTRATOR
  // ---------------------------------------------------------------------------
  if (!isAuthorizedAdmin) {
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
            maxWidth: "420px",
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
            Admin Console Access
          </h2>
          <p style={{ fontSize: "13px", color: "#866951", lineHeight: "1.5", marginBottom: "22px" }}>
            Restricted Master Access. Please enter the master password to unlock the Avsaraa Admin Console.
          </p>

          {sessionUser && sessionUser.email && sessionUser.id !== "admin-master" && sessionUser.id !== "admin-env-user" && (
            <div
              style={{
                backgroundColor: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                marginBottom: "16px",
                textAlign: "left",
                lineHeight: "1.5",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "2px" }}>Customer Session Active</div>
              Signed in as <strong>{sessionUser.email}</strong>. Enter master password below to unlock admin privileges.
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

          <form onSubmit={handleAdminGateLogin} style={{ display: "flex", flexDirection: "column", gap: "16px", textAlign: "left" }}>
            <div>
              <label
                htmlFor="admin-password-input"
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
              <div style={{ position: "relative" }}>
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  value={authGatePassword}
                  onChange={(e) => setAuthGatePassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: "100%",
                    padding: "12px 42px 12px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FCFAF7",
                    fontSize: "14px",
                    color: "#261B13",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#866951",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon size={18} color="#866951" />
                </button>
              </div>
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
                marginTop: "4px",
                cursor: isLoggingIn ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(38,27,19,0.2)",
                border: "none",
              }}
            >
              {isLoggingIn ? <SpinnerIcon size={16} color="#FFFFFF" /> : <ShieldCheckIcon size={16} color="#C4AB94" />}
              <span>{isLoggingIn ? "Verifying..." : "Unlock Admin Console"}</span>
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

      {/* Top Header / Executive Command Bar */}
      <header
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(232, 222, 211, 0.8)",
          padding: "12px 28px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 14px rgba(38,27,19,0.03)",
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
          {/* Left: Brand Wordmark & Security Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" style={{ display: "inline-block", transition: "opacity 0.15s" }}>
              <AvsaraaLogo size="sm" width={118} />
            </Link>
            <div style={{ height: "24px", width: "1px", backgroundColor: "#E8DED3" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  backgroundColor: "#EBF8F2",
                  border: "1px solid #B5E8D2",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0F7A50",
                }}
                title="Storefront and admin APIs are healthy and responsive"
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                    display: "inline-block",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.25)",
                  }}
                />
                <span>Store Operational</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions & Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Live Data Refresh Button */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing || isLoading}
              title="Synchronize live dashboard data with database"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6E5B4E",
                padding: "7px 12px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CFBEAD",
                cursor: isRefreshing || isLoading ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                {isRefreshing ? <SpinnerIcon size={14} color="#866951" /> : <RefreshIcon size={14} color="#866951" />}
              </span>
              <span>{isRefreshing ? "Syncing..." : "Sync Live Data"}</span>
            </button>

            {/* Storefront Link */}
            <Link
              href="/"
              target="_blank"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 600,
                color: "#261B13",
                padding: "7px 12px",
                borderRadius: "8px",
                backgroundColor: "#FAF7F2",
                border: "1px solid #CFBEAD",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              title="Open customer storefront in a new tab"
            >
              <span>View Storefront</span>
              <span style={{ fontSize: "11px", color: "#866951" }}>↗</span>
            </Link>

            {/* Super Admin Profile Pill & Sign Out */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 6px 4px 10px",
                borderRadius: "30px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #CFBEAD",
                boxShadow: "0 2px 6px rgba(38,27,19,0.03)",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: "#261B13",
                  color: "#C5A059",
                  border: "1.5px solid #C5A059",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {superAdmin.full_name ? superAdmin.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "SA"}
              </div>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#261B13" }}>
                {superAdmin.full_name}
              </span>
              <button
                onClick={handleAdminSignOut}
                title="Sign out of Super Admin Console"
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#B91C1C",
                  borderRadius: "6px",
                  border: "1px solid #FCA5A5",
                  backgroundColor: "#FEF2F2",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
        {/* Executive KPI Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "14px",
            marginBottom: "24px",
          }}
        >
          {/* Card 1: Gross Revenue */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("orders")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab("orders"); } }}
            style={{
              backgroundColor: "#FFFFFF",
              border: activeTab === "orders" ? "2px solid #866951" : "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: activeTab === "orders" ? "0 8px 24px rgba(134,105,81,0.12)" : "0 3px 12px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 700 }}>
                Gross Revenue
              </span>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                ₹{orderStats.totalRevenue.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "11px", color: "#0F7A50", fontWeight: 600 }}>
                {orderStats.paidOrdersCount} Paid Orders · ₹{orderStats.avgOrderValue} AOV
              </span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#FAF5E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#C5A059",
                flexShrink: 0,
              }}
            >
              <DiamondCrownIcon size={22} color="#C5A059" />
            </div>
          </div>

          {/* Card 2: Orders & Fulfillment Pipeline */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("orders")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab("orders"); } }}
            style={{
              backgroundColor: "#FFFFFF",
              border: activeTab === "orders" ? "2px solid #866951" : "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: activeTab === "orders" ? "0 8px 24px rgba(134,105,81,0.12)" : "0 3px 12px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 700 }}>
                Orders &amp; Logistics
              </span>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {adminOrders.length}
              </div>
              <span style={{ fontSize: "11px", color: orderStats.exchangeRequestedCount > 0 ? "#B37A2C" : "#1E5E3A", fontWeight: 600 }}>
                {orderStats.exchangeRequestedCount > 0
                  ? `${orderStats.exchangeRequestedCount} Exchange Action Req.`
                  : `${orderStats.inTransitCount} In Transit · ${orderStats.deliveredCount} Delivered`}
              </span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#F7F2EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#866951",
                flexShrink: 0,
              }}
            >
              <DeliveryVanIcon size={22} color="#866951" />
            </div>
          </div>

          {/* Card 3: Products in Catalog */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("products")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab("products"); } }}
            style={{
              backgroundColor: "#FFFFFF",
              border: activeTab === "products" ? "2px solid #866951" : "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: activeTab === "products" ? "0 8px 24px rgba(134,105,81,0.12)" : "0 3px 12px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 700 }}>
                Catalog &amp; Stock
              </span>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {products.length} Items
              </div>
              <span style={{ fontSize: "11px", color: inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0 ? "#B91C1C" : "#866951", fontWeight: 600 }}>
                {inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0
                  ? `${inventoryStats.outOfStockCount} OOS · ${inventoryStats.lowStockCount} Low Stock`
                  : `${inventoryStats.totalStockSum} Units in Stock`}
              </span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#EBF8F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F7A50",
                flexShrink: 0,
              }}
            >
              <ShoppingBagIcon size={22} color="#0F7A50" />
            </div>
          </div>

          {/* Card 4: Customer Accounts */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("customers")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab("customers"); } }}
            style={{
              backgroundColor: "#FFFFFF",
              border: activeTab === "customers" ? "2px solid #866951" : "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: activeTab === "customers" ? "0 8px 24px rgba(134,105,81,0.12)" : "0 3px 12px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 700 }}>
                Patrons &amp; CRM
              </span>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {customerProfiles.length}
              </div>
              <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600 }}>
                {crmMetrics.vipCount} VIP · {crmMetrics.repeatBuyers} Repeat Buyers
              </span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
                flexShrink: 0,
              }}
            >
              <UserIcon size={22} color="#2563EB" />
            </div>
          </div>

          {/* Card 5: Inquiries & Leads */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab("inquiries")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveTab("inquiries"); } }}
            style={{
              backgroundColor: "#FFFFFF",
              border: activeTab === "inquiries" ? "2px solid #866951" : "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "18px 20px",
              boxShadow: activeTab === "inquiries" ? "0 8px 24px rgba(134,105,81,0.12)" : "0 3px 12px rgba(38,27,19,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 700 }}>
                Concierge Inquiries
              </span>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                {inquiries.length + subscribers.length}
              </div>
              <span style={{ fontSize: "11px", color: inquiryStats.unreadCount > 0 ? "#B91C1C" : "#866951", fontWeight: 600 }}>
                {inquiryStats.unreadCount > 0 ? `${inquiryStats.unreadCount} Unread Messages` : "All Inquiries Replied"}
              </span>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#F5F3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <MailIcon size={22} color="#7C3AED" />
            </div>
          </div>
        </div>

        {/* Segmented Luxury Tab Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          {/* Tabs Container */}
          <div
            role="tablist"
            aria-label="Admin Management Sections"
            className="admin-tabs-scroll"
            style={{
              alignItems: "center",
              gap: "4px",
              backgroundColor: "#EFE8E1",
              borderRadius: "14px",
              padding: "4px",
              maxWidth: "100%",
              boxShadow: "inset 0 1px 3px rgba(38,27,19,0.06)",
            }}
          >
            {[
              { id: "orders", label: "Orders & Logistics", count: adminOrders.length, icon: <DeliveryVanIcon size={16} /> },
              { id: "products", label: "Products & Catalog", count: products.length, icon: <ShoppingBagIcon size={16} /> },
              { id: "customers", label: "Customer CRM", count: customerProfiles.length, icon: <UserIcon size={16} /> },
              { id: "coupons", label: "Promotions & Offers", icon: <TagIcon size={16} /> },
              { id: "inquiries", label: "Concierge Inquiries", count: inquiries.length, icon: <MailIcon size={16} /> },
              { id: "reviews", label: "Patron Reviews", count: reviews.length, icon: <StarIcon size={16} /> },
              { id: "super_admin", label: "Authority & Security", icon: <ShieldCheckIcon size={16} /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    setSearchQuery("");
                    if (tab.id === "products") setCategoryFilter("ALL");
                    if (tab.id === "customers") setCustomerSegmentFilter("ALL");
                    if (tab.id === "inquiries") setInquiryStatusFilter("ALL");
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "#FAF7F2" : "#6E5B4E",
                    backgroundColor: isActive ? "#261B13" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 2px 8px rgba(38,27,19,0.18)" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ color: isActive ? "#C5A059" : "inherit" }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "10px",
                        backgroundColor: isActive ? "#C5A059" : "rgba(110,91,78,0.14)",
                        color: isActive ? "#261B13" : "#6E5B4E",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons for Active Tab */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {activeTab === "products" && (
              <>
                <button
                  type="button"
                  onClick={() => saveShowcaseOrder(products)}
                  disabled={isReorderingShowcase}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    backgroundColor: "#FAF7F2",
                    color: "#866951",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    border: "1px solid #C5A059",
                    cursor: isReorderingShowcase ? "not-allowed" : "pointer",
                  }}
                  title="Save and publish current showcase sequence"
                >
                  <span>{isReorderingShowcase ? "⏳ Saving..." : "✦ Save Showcase Order"}</span>
                </button>

                <a
                  href="/api/admin/products/template"
                  download="avsaraa-products-template.csv"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 13px",
                    backgroundColor: "#FFFFFF",
                    color: "#866951",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    border: "1px solid #CFBEAD",
                    textDecoration: "none",
                  }}
                  title="Download pre-filled CSV template"
                >
                  <span>📥 CSV Template</span>
                </a>

                <button
                  onClick={() => {
                    setShowBulkImportModal(true);
                    setBulkCsvFile(null);
                    setBulkParsedProducts([]);
                    setBulkImportError(null);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 14px",
                    backgroundColor: "#FAF7F2",
                    color: "#866951",
                    borderRadius: "10px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    border: "1px solid #CFBEAD",
                    cursor: "pointer",
                  }}
                >
                  <span>📦 Bulk CSV Import</span>
                </button>

                <button
                  onClick={openAddProductModal}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(38,27,19,0.15)",
                  }}
                >
                  <PlusIcon size={15} color="#C5A059" />
                  <span>+ Add Product</span>
                </button>
              </>
            )}

            {activeTab === "customers" && (
              <button
                onClick={openAddCustomerModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(38,27,19,0.15)",
                }}
              >
                <PlusIcon size={15} color="#C5A059" />
                <span>+ Add Customer Account</span>
              </button>
            )}

            {activeTab === "reviews" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  backgroundColor: "#FAF6F0",
                  border: "1px solid #E8DED3",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#866951",
                }}
              >
                <CameraIcon size={14} color="#866951" />
                <span>{reviews.reduce((acc, r) => acc + (r.photos?.length || 0), 0)} Patron Photos</span>
              </div>
            )}

            {activeTab === "super_admin" && (
              <button
                onClick={openEditSuperAdminModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 16px",
                  backgroundColor: "#6F42C1",
                  color: "#FFFFFF",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(111,66,193,0.25)",
                }}
              >
                <EditIcon size={15} color="#FFFFFF" />
                <span>Edit Super Admin Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar with Quick Pills */}
        {activeTab !== "orders" && activeTab !== "coupons" && activeTab !== "super_admin" && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              boxShadow: "0 2px 10px rgba(38,27,19,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
              {/* Search input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  minWidth: "260px",
                  backgroundColor: "#FCFAF7",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                }}
              >
                <SearchIcon size={16} color="#866951" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "products"
                      ? "Search catalog by name, zari craft, description..."
                      : activeTab === "customers"
                      ? "Search customers by name, phone, email, city..."
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
                  <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}>
                    <CloseIcon size={14} color="#866951" />
                  </button>
                )}
              </div>

              {/* Counter badge & select dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "#866951", fontWeight: 600 }}>
                  {activeTab === "products"
                    ? `Showing ${filteredProducts.length} of ${products.length} products`
                    : activeTab === "customers"
                    ? `Showing ${filteredCustomers.length} of ${customerProfiles.length} patrons`
                    : `Showing ${filteredInquiries.length} of ${inquiries.length} inquiries`}
                </span>

                {/* Filter Dropdown */}
                {activeTab === "products" && (
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#261B13",
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="PROMO">🏷️ Promo & Sale Deals</option>
                    <option value="LOW_STOCK">⚠️ Low Stock (≤ 3)</option>
                    <option value="OUT_OF_STOCK">● Sold Out (0)</option>
                    <option value="UNDER_1299">💎 Under ₹1,299</option>
                    <option value="Sarees">Sarees</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Co-ords">Co-ords</option>
                    <option value="Men's Wear">{"Men's Wear"}</option>
                    <option value="New Arrivals">New Arrivals</option>
                    <option value="Occasion Wear">Occasion Wear</option>
                  </select>
                )}

                {activeTab === "customers" && (
                  <select
                    value={customerSegmentFilter}
                    onChange={(e) => setCustomerSegmentFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#261B13",
                    }}
                  >
                    <option value="ALL">All Segments ({customerProfiles.length})</option>
                    <option value="VIP Atelier">👑 VIP Atelier Patrons</option>
                    <option value="Repeat Patron">🔁 Repeat Patrons</option>
                    <option value="Active Patron">🛍️ Active Patrons</option>
                    <option value="Guest Buyer">👤 Guest Buyers</option>
                    <option value="Prospective Lead">✉️ Prospective Leads</option>
                    <option value="REGISTERED">Registered Accounts Only</option>
                    <option value="GUEST">Guest Orders Only</option>
                  </select>
                )}

                {activeTab === "inquiries" && (
                  <select
                    value={inquiryStatusFilter}
                    onChange={(e) => setInquiryStatusFilter(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FCFAF7",
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#261B13",
                    }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Unread">Unread</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Archived">Archived</option>
                  </select>
                )}
              </div>
            </div>

            {/* Quick Filter Tag Chips for Single-Click Navigation */}
            {activeTab === "products" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", paddingTop: "4px", borderTop: "1px dashed #E8DED3" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: "4px" }}>
                  Quick Filters:
                </span>
                {[
                  { key: "ALL", label: `All (${products.length})` },
                  { key: "PROMO", label: "🏷️ Promo / Sale" },
                  { key: "LOW_STOCK", label: `⚠️ Low Stock (${inventoryStats.lowStockCount})` },
                  { key: "OUT_OF_STOCK", label: `● Sold Out (${inventoryStats.outOfStockCount})` },
                  { key: "Sarees", label: "Sarees" },
                  { key: "Dresses", label: "Dresses" },
                  { key: "Co-ords", label: "Co-ords" },
                  { key: "UNDER_1299", label: "Under ₹1,299" },
                ].map((chip) => {
                  const isSel = categoryFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      onClick={() => setCategoryFilter(chip.key)}
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "14px",
                        fontWeight: isSel ? 700 : 500,
                        backgroundColor: isSel ? "#261B13" : "#FAF7F2",
                        color: isSel ? "#FAF7F2" : "#6E5B4E",
                        border: isSel ? "1px solid #261B13" : "1px solid #CFBEAD",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 0: ORDERS & FULFILLMENT MANAGEMENT                           */}
        {/* ================================================================= */}
        {activeTab === "orders" && (
          <OrdersAdminTab
            orders={adminOrders}
            onRefresh={fetchData}
            showToast={(text, type) => showToast(text, type)}
            getAuthHeaders={getAuthHeaders}
          />
        )}

        {/* ================================================================= */}
        {/* VIEW 0B: PROMOTIONAL COUPONS & OFFERS                             */}
        {/* ================================================================= */}
        {activeTab === "coupons" && (
          <CouponsAdminTab
            showToast={(text, type) => showToast(text, type)}
            getAuthHeaders={getAuthHeaders}
          />
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
            {/* Drag & Drop Showcase Ordering Banner */}
            <div
              style={{
                padding: "10px 18px",
                backgroundColor: "#FAF7F2",
                borderBottom: "1px solid #E8DED3",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#6E5B4E",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px" }}>✦</span>
                <span>
                  <strong>Drag-and-Drop Showcase Ordering:</strong> Drag rows using the <strong>⋮⋮ handle</strong> (or use ▲ / ▼) to arrange how drapes appear in the storefront catalog. Changes publish live automatically.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isReorderingShowcase && (
                  <span style={{ fontSize: "11px", color: "#C5A059", fontWeight: 700 }}>
                    ⚡ Saving Sequence...
                  </span>
                )}
                <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600 }}>
                  {products.length} Drapes in Catalog
                </span>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#FAF7F2", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                    <th style={{ padding: "14px 12px", fontWeight: 700, width: "70px", textAlign: "center" }}>⋮⋮ Order</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Item</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Category & Promo</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Price & Discount</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Inventory</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700 }}>Description</th>
                    <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ maxWidth: "340px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#FAF7F2", border: "1px solid #E8DED3", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <ShoppingBagIcon size={22} color="#866951" />
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#261B13" }}>No products found</div>
                          <p style={{ fontSize: "12.5px", color: "#866951", lineHeight: "1.4" }}>
                            No items match your search or filter criteria. Try clearing filters or adding a new drape to your catalog.
                          </p>
                          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                            {(searchQuery || categoryFilter !== "ALL") && (
                              <button
                                onClick={() => {
                                  setSearchQuery("");
                                  setCategoryFilter("ALL");
                                }}
                                style={{
                                  padding: "7px 14px",
                                  borderRadius: "6px",
                                  backgroundColor: "#FAF7F2",
                                  border: "1px solid #CFBEAD",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#866951",
                                  cursor: "pointer",
                                }}
                              >
                                Clear Filters
                              </button>
                            )}
                            <button
                              onClick={openAddProductModal}
                              style={{
                                padding: "7px 14px",
                                borderRadius: "6px",
                                backgroundColor: "#261B13",
                                border: "none",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#FAF7F2",
                                cursor: "pointer",
                              }}
                            >
                              + Add New Product
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const masterIndex = products.findIndex((p) => p.id === product.id);
                      const isBeingDragged = draggedProductIndex === masterIndex;
                      const isDragOver = dragOverProductIndex === masterIndex;

                      return (
                      <tr
                        key={product.id}
                        draggable={!searchQuery && categoryFilter === "ALL"}
                        onDragStart={(e) => handleProductDragStart(e, masterIndex)}
                        onDragOver={(e) => handleProductDragOver(e, masterIndex)}
                        onDragEnd={handleProductDragEnd}
                        onDrop={(e) => handleProductDrop(e, masterIndex)}
                        style={{
                          borderBottom: "1px solid #F0E8DF",
                          transition: "all 0.15s ease",
                          backgroundColor: isDragOver
                            ? "rgba(197, 160, 89, 0.12)"
                            : isBeingDragged
                            ? "#FAF6F0"
                            : "transparent",
                          opacity: isBeingDragged ? 0.4 : 1,
                          borderTop: isDragOver ? "3px solid #C5A059" : "none",
                          cursor: !searchQuery && categoryFilter === "ALL" ? "grab" : "default",
                        }}
                        onMouseEnter={(e) => {
                          if (!isDragOver && !isBeingDragged) {
                            e.currentTarget.style.backgroundColor = "#FCFAF7";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDragOver && !isBeingDragged) {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        {/* 1. Drag Handle & Order Column */}
                        <td style={{ padding: "14px 10px", textAlign: "center", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <div
                              title="Drag to reorder showcase sequence"
                              style={{
                                cursor: !searchQuery && categoryFilter === "ALL" ? "grab" : "default",
                                color: "#866951",
                                fontSize: "12px",
                                fontWeight: 700,
                                userSelect: "none",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                backgroundColor: "#FAF7F2",
                                border: "1px solid #E8DED3",
                                lineHeight: 1.2,
                              }}
                            >
                              ⋮⋮ #{masterIndex + 1}
                            </div>
                            <div style={{ display: "flex", gap: "2px", marginTop: "2px" }}>
                              <button
                                type="button"
                                disabled={masterIndex <= 0}
                                onClick={() => handleNudgeProductOrder(masterIndex, "up")}
                                title="Move Up in Showcase"
                                style={{
                                  border: "none",
                                  background: "none",
                                  cursor: masterIndex <= 0 ? "not-allowed" : "pointer",
                                  opacity: masterIndex <= 0 ? 0.3 : 0.8,
                                  fontSize: "10px",
                                  padding: "1px 3px",
                                  color: "#261B13",
                                }}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={masterIndex < 0 || masterIndex >= products.length - 1}
                                onClick={() => handleNudgeProductOrder(masterIndex, "down")}
                                title="Move Down in Showcase"
                                style={{
                                  border: "none",
                                  background: "none",
                                  cursor: masterIndex < 0 || masterIndex >= products.length - 1 ? "not-allowed" : "pointer",
                                  opacity: masterIndex < 0 || masterIndex >= products.length - 1 ? 0.3 : 0.8,
                                  fontSize: "10px",
                                  padding: "1px 3px",
                                  color: "#261B13",
                                }}
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "48px",
                                height: "64px",
                                position: "relative",
                                borderRadius: "8px",
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
                              {product.stock_count === 0 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(185, 28, 28, 0.4)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  OOS
                                </div>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#261B13" }}>{product.name}</div>
                              <div style={{ fontSize: "11px", color: "#866951", marginTop: "2px" }}>
                                Added: {product.created_at ? new Date(product.created_at).toLocaleDateString() : "Catalog Item"}
                              </div>

                              {/* Mini Swatches Preview */}
                              {product.color_variants && product.color_variants.length > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                                  {product.color_variants.slice(0, 5).map((cv, cvIdx) => (
                                    <span
                                      key={cvIdx}
                                      title={cv.name}
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        backgroundColor: cv.hex || "#261B13",
                                        border: "1px solid #CFBEAD",
                                        display: "inline-block",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                                      }}
                                    />
                                  ))}
                                  {product.color_variants.length > 5 && (
                                    <span style={{ fontSize: "10px", color: "#866951" }}>+{product.color_variants.length - 5}</span>
                                  )}
                                  <span style={{ fontSize: "11px", color: "#866951", marginLeft: "2px" }}>
                                    {product.color_variants.length} {product.color_variants.length === 1 ? "shade" : "shades"}
                                  </span>
                                </div>
                              )}

                              {/* Sizes preview */}
                              {product.available_sizes && product.available_sizes.length > 0 && (
                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                  {product.available_sizes.slice(0, 4).map((sz, szIdx) => (
                                    <span
                                      key={szIdx}
                                      style={{
                                        fontSize: "10px",
                                        padding: "1px 5px",
                                        borderRadius: "3px",
                                        backgroundColor: "#FAF7F2",
                                        border: "1px solid #E8DED3",
                                        color: "#6E5B4E",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {sz}
                                    </span>
                                  ))}
                                  {product.available_sizes.length > 4 && (
                                    <span style={{ fontSize: "10px", color: "#866951" }}>+{product.available_sizes.length - 4}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 9px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: "#FAF7F2",
                                color: "#866951",
                                border: "1px solid #CFBEAD",
                              }}
                            >
                              {product.category}
                            </span>
                            {product.occasion_tags && product.occasion_tags.length > 0 && product.occasion_tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                style={{
                                  display: "inline-block",
                                  padding: "2px 7px",
                                  borderRadius: "12px",
                                  fontSize: "10.5px",
                                  fontWeight: 700,
                                  backgroundColor: tag.toLowerCase().includes("promo") || tag.toLowerCase().includes("sale") || tag.toLowerCase().includes("under") ? "#FEF3C7" : "#F3E8FF",
                                  color: tag.toLowerCase().includes("promo") || tag.toLowerCase().includes("sale") || tag.toLowerCase().includes("under") ? "#92400E" : "#6B21A8",
                                  border: "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                🏷️ {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          <div style={{ fontWeight: 700, color: "#261B13", fontSize: "14px" }}>
                            ₹{Number(product.price).toLocaleString("en-IN")}
                          </div>
                          {product.mrp && Number(product.mrp) > Number(product.price) && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                              <span style={{ textDecoration: "line-through", color: "#A08D80", fontSize: "11.5px" }}>
                                ₹{Number(product.mrp).toLocaleString("en-IN")}
                              </span>
                              <span
                                style={{
                                  backgroundColor: "#FEF2F2",
                                  color: "#DC2626",
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  border: "1px solid #FECACA",
                                }}
                              >
                                {product.discount_percent || Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% OFF
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: "14px 18px" }}>
                          {product.stock_count === 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#B91C1C", fontWeight: 700, fontSize: "11.5px", backgroundColor: "#FEF2F2", padding: "3px 9px", borderRadius: "20px", border: "1px solid #FCA5A5" }}>
                              ● Sold Out (0)
                            </span>
                          ) : (product.stock_count !== undefined && product.stock_count <= 3) ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#D97706", fontWeight: 700, fontSize: "11.5px", backgroundColor: "#FFFBEB", padding: "3px 9px", borderRadius: "20px", border: "1px solid #FDE68A" }}>
                              ⚠️ Low: {product.stock_count} left
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#0F7A50", fontWeight: 600, fontSize: "11.5px", backgroundColor: "#EBF8F2", padding: "3px 9px", borderRadius: "20px", border: "1px solid #B5E8D2" }}>
                              ● {product.stock_count !== undefined ? `${product.stock_count} in stock` : "In stock"}
                            </span>
                          )}
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
                              onClick={() => openCloneProductModal(product)}
                              title="Duplicate / Clone Product"
                              style={{
                                padding: "7px",
                                borderRadius: "8px",
                                border: "1px solid #E8DED3",
                                backgroundColor: "#FFFFFF",
                                color: "#866951",
                              }}
                            >
                              <span style={{ fontSize: "13px", display: "inline-block", lineHeight: 1 }}>📑</span>
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
                    );
                  })
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
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* CRM KPI Metrics Summary Bar */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Total CRM Accounts
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
                  {crmMetrics.totalCustomers}
                </div>
                <div style={{ fontSize: "11.5px", color: "#866951", marginTop: "2px" }}>
                  {crmMetrics.totalCustomers - crmMetrics.guestCount} Registered · {crmMetrics.guestCount} Guest Buyers
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Total Lifetime Value (LTV)
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#1E5E3A", marginTop: "4px" }}>
                  ₹{crmMetrics.totalSpend.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "11.5px", color: "#866951", marginTop: "2px" }}>
                  Gross Revenue Generated
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#B78103", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  VIP Atelier Patrons
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#B78103", marginTop: "4px" }}>
                  {crmMetrics.vipCount}
                </div>
                <div style={{ fontSize: "11.5px", color: "#866951", marginTop: "2px" }}>
                  VIP & Atelier Circle Members
                </div>
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.03)",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6F42C1", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Repeat Patrons
                </div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#6F42C1", marginTop: "4px" }}>
                  {crmMetrics.repeatBuyers}
                </div>
                <div style={{ fontSize: "11.5px", color: "#866951", marginTop: "2px" }}>
                  High-Retention Repeat Buyers
                </div>
              </div>
            </div>

            {/* Segment Quick Filter Pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#866951", marginRight: "4px" }}>
                Filter Segment:
              </span>
              {[
                { key: "ALL", label: `All Patrons (${customerProfiles.length})` },
                { key: "VIP Atelier", label: "👑 VIP Atelier" },
                { key: "Repeat Patron", label: "🔁 Repeat Patrons" },
                { key: "Active Patron", label: "🛍️ Active Patrons" },
                { key: "Guest Buyer", label: "👤 Guest Buyers" },
                { key: "Prospective Lead", label: "✉️ Prospective Leads" },
              ].map((seg) => {
                const isSelected = customerSegmentFilter === seg.key;
                return (
                  <button
                    key={seg.key}
                    onClick={() => setCustomerSegmentFilter(seg.key)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: isSelected ? "#261B13" : "#FFFFFF",
                      color: isSelected ? "#F7F2EE" : "#866951",
                      border: isSelected ? "1px solid #261B13" : "1px solid #E8DED3",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {seg.label}
                  </button>
                );
              })}
            </div>

            {/* Customers & CRM Table */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
                overflow: "hidden",
              }}
            >
              <div className="admin-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#FAF7F2", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Customer / Patron</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Contact & City</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Segment & Tier</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Lifetime Spend</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Orders</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Reward Points</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
                      <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#866951" }}>
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

                        const statusColors: Record<string, { bg: string; text: string; border: string }> = {
                          Active: { bg: "#EBF8F2", text: "#0F7A50", border: "#B5E8D2" },
                          Suspended: { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5" },
                          Inactive: { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB" },
                        };
                        const st = statusColors[customer.status || "Active"] || statusColors.Active;

                        const segmentColors: Record<string, { bg: string; text: string }> = {
                          "VIP Atelier": { bg: "#FFFBEB", text: "#92400E" },
                          "Repeat Patron": { bg: "#F3E8FF", text: "#6B21A8" },
                          "Active Patron": { bg: "#ECFDF5", text: "#065F46" },
                          "Guest Buyer": { bg: "#F3F4F6", text: "#374151" },
                          "Prospective Lead": { bg: "#EFF6FF", text: "#1E40AF" },
                        };
                        const segStyle = segmentColors[customer.rfm_segment || "Active Patron"] || segmentColors["Active Patron"];

                        return (
                          <tr
                            key={customer.id}
                            style={{ borderBottom: "1px solid #F0E8DF", transition: "background-color 0.15s ease" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FCFAF7")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    backgroundColor: customer.is_guest ? "#F3F4F6" : "#FAF7F2",
                                    border: "1px solid #CFBEAD",
                                    color: "#866951",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {customer.full_name
                                    ? customer.full_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                    : "P"}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#261B13", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>{customer.full_name}</span>
                                    {customer.is_guest && (
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          padding: "1px 6px",
                                          borderRadius: "4px",
                                          backgroundColor: "#E5E7EB",
                                          color: "#4B5563",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Guest
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#866951", marginTop: "2px" }}>
                                    Joined: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: "14px 18px", color: "#543E2E" }}>
                              <div>{customer.email || "—"}</div>
                              <div style={{ fontSize: "11px", color: "#866951" }}>
                                {customer.phone_number || "—"} {customer.primary_city ? `· 📍 ${customer.primary_city}` : ""}
                              </div>
                            </td>

                            <td style={{ padding: "14px 18px" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "10.5px",
                                    fontWeight: 700,
                                    backgroundColor: segStyle.bg,
                                    color: segStyle.text,
                                  }}
                                >
                                  {customer.rfm_segment || "Active Patron"}
                                </span>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    fontSize: "10.5px",
                                    fontWeight: 600,
                                    backgroundColor: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                  }}
                                >
                                  ★ {customer.membership_tier}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: "14px 18px", fontWeight: 700, color: "#1E5E3A" }}>
                              ₹{(customer.total_spend || 0).toLocaleString("en-IN")}
                            </td>

                            <td style={{ padding: "14px 18px", fontWeight: 600, color: "#261B13" }}>
                              <button
                                onClick={() => openViewCustomerModal(customer)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#866951",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textDecoration: "underline",
                                  padding: 0,
                                  fontSize: "13px",
                                }}
                              >
                                {customer.order_count || (customer.orders?.length || 0)} Orders
                              </button>
                            </td>

                            <td style={{ padding: "14px 18px", fontWeight: 600, color: "#866951" }}>
                              {(customer.reward_points ?? 0).toLocaleString()} pts
                            </td>

                            <td style={{ padding: "14px 18px" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 9px",
                                  borderRadius: "14px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  backgroundColor: st.bg,
                                  color: st.text,
                                  border: `1px solid ${st.border}`,
                                }}
                              >
                                ● {customer.status || "Active"}
                              </span>
                            </td>

                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button
                                  onClick={() => openViewCustomerModal(customer)}
                                  title="View 360° CRM Profile"
                                  style={{
                                    padding: "7px 10px",
                                    borderRadius: "8px",
                                    border: "1px solid #E8DED3",
                                    backgroundColor: "#FFFFFF",
                                    color: "#866951",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  <EyeIcon size={14} />
                                  <span>CRM</span>
                                </button>
                                <button
                                  onClick={() => openEditCustomerModal(customer)}
                                  title="Edit Customer"
                                  style={{
                                    padding: "7px",
                                    borderRadius: "8px",
                                    border: "1px solid #E8DED3",
                                    backgroundColor: "#FFFFFF",
                                    color: "#261B13",
                                    cursor: "pointer",
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
                                    cursor: "pointer",
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

              <div className="admin-table-wrap">
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

              <div className="admin-table-wrap">
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
        {/* VIEW 2: PATRON REVIEWS & MEDIA MANAGEMENT (PHOTOS)                */}
        {/* ================================================================= */}
        {activeTab === "reviews" && (
          <div>
            {/* Header Controls Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* Filter Pills */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#866951",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginRight: "4px",
                  }}
                >
                  Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setReviewFilter("ALL")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    backgroundColor: reviewFilter === "ALL" ? "#261B13" : "#FAF6F0",
                    color: reviewFilter === "ALL" ? "#F7F2EE" : "#866951",
                    border: "1px solid",
                    borderColor: reviewFilter === "ALL" ? "#261B13" : "#E8DED3",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  All Reviews ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("WITH_MEDIA")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    backgroundColor: reviewFilter === "WITH_MEDIA" ? "#261B13" : "#FAF6F0",
                    color: reviewFilter === "WITH_MEDIA" ? "#F7F2EE" : "#866951",
                    border: "1px solid",
                    borderColor: reviewFilter === "WITH_MEDIA" ? "#261B13" : "#E8DED3",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CameraIcon size={13} />
                  <span>
                    With Photos (
                    {
                      reviews.filter(
                        (r) =>
                          (r.photos?.length || 0) > 0
                      ).length
                    }
                    )
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("5_STAR")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    backgroundColor: reviewFilter === "5_STAR" ? "#261B13" : "#FAF6F0",
                    color: reviewFilter === "5_STAR" ? "#F7F2EE" : "#866951",
                    border: "1px solid",
                    borderColor: reviewFilter === "5_STAR" ? "#261B13" : "#E8DED3",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <StarIcon size={13} color="#C5A059" />
                  <span>5-Star Heirlooms ({reviews.filter((r) => r.rating === 5).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter("FLAGGED")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    backgroundColor: reviewFilter === "FLAGGED" ? "#261B13" : "#FAF6F0",
                    color: reviewFilter === "FLAGGED" ? "#F7F2EE" : "#866951",
                    border: "1px solid",
                    borderColor: reviewFilter === "FLAGGED" ? "#261B13" : "#E8DED3",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Hidden ({reviews.filter((r) => r.status === "hidden" || r.status === "flagged").length})
                </button>
              </div>

              {/* Authority Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#866951",
                  backgroundColor: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #E8DED3",
                }}
              >
                <ShieldCheckIcon size={14} color="#6F42C1" />
                <span>Super Admin Review Moderation & Deletion Authority</span>
              </div>
            </div>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "14px",
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "#866951",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>✦</div>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  No Patron Reviews Found
                </h3>
                <p style={{ fontSize: "13px" }}>
                  No customer reviews match your active filter. Change filter criteria or reset search.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E8DED3",
                      borderRadius: "14px",
                      padding: "24px",
                      boxShadow: "0 4px 18px rgba(38,27,19,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Header Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #FAF6F0, #EAE0D5)",
                            border: "1px solid #C5A059",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#866951",
                            fontFamily: "var(--font-playfair), serif",
                          }}
                        >
                          {review.customer_name ? review.customer_name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#261B13" }}>
                              {review.customer_name}
                            </span>
                            {review.verified_purchase && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  backgroundColor: "#EBF8F2",
                                  color: "#0F7A50",
                                  border: "1px solid #A7F3D0",
                                }}
                              >
                                <CheckIcon size={10} color="#0F7A50" />
                                Verified Patron
                              </span>
                            )}
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                backgroundColor: review.status === "published" ? "#FAF7F2" : "#FEE2E2",
                                color: review.status === "published" ? "#866951" : "#DC2626",
                                border: "1px solid",
                                borderColor: review.status === "published" ? "#E8DED3" : "#FCA5A5",
                              }}
                            >
                              ● {review.status.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "10px", fontSize: "12px", color: "#866951", marginTop: "3px" }}>
                            {review.customer_city && <span>{review.customer_city}</span>}
                            {review.customer_email && <span>• {review.customer_email}</span>}
                            <span>
                              •{" "}
                              {new Date(review.created_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleReviewStatus(review)}
                          title="Toggle review visibility"
                          style={{
                            padding: "7px 12px",
                            borderRadius: "8px",
                            border: "1px solid #CFBEAD",
                            backgroundColor: "#FAF7F2",
                            color: "#261B13",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {review.status === "published" ? "Hide from Store" : "Publish to Store"}
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingReviewId === review.id}
                          onClick={() => handleDeleteReview(review.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "7px 14px",
                            borderRadius: "8px",
                            border: "1px solid #FCA5A5",
                            backgroundColor: "#FFF5F5",
                            color: "#DC2626",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isDeletingReviewId === review.id ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {isDeletingReviewId === review.id ? (
                            <SpinnerIcon size={13} color="#DC2626" />
                          ) : (
                            <TrashIcon size={13} color="#DC2626" />
                          )}
                          <span>Delete Review</span>
                        </button>
                      </div>
                    </div>

                    {/* Rating & Product Tag */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ display: "flex", gap: "2px" }}>
                          {[...Array(5)].map((_, i) => (
                            <StarIcon key={i} size={15} color="#C5A059" filled={i < review.rating} />
                          ))}
                        </div>
                        {review.title && (
                          <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#261B13", margin: 0 }}>
                            {review.title}
                          </h4>
                        )}
                      </div>
                      {review.product_name && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            backgroundColor: "#FAF7F2",
                            border: "1px solid #E8DED3",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#866951",
                          }}
                        >
                          <ShoppingBagIcon size={12} color="#866951" />
                          <span>{review.product_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Review Comment */}
                    <p style={{ fontSize: "14px", color: "#3B2E25", lineHeight: "1.65", margin: 0 }}>
                      &ldquo;{review.comment}&rdquo;
                    </p>

                    {/* Real Customer Photos */}
                    {review.photos && review.photos.length > 0 && (
                      <div style={{ paddingTop: "6px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#866951",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: "8px",
                          }}
                        >
                          <CameraIcon size={13} color="#866951" />
                          <span>Patron Photos ({review.photos.length})</span>
                        </div>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {review.photos.map((photoUrl, photoIdx) => (
                            <div
                              key={photoIdx}
                              onClick={() =>
                                setPreviewMediaModal({
                                  url: photoUrl,
                                  title: `${review.customer_name}'s Saree Photo`,
                                })
                              }
                              style={{
                                position: "relative",
                                width: "90px",
                                height: "90px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                border: "1px solid #E8DED3",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(38,27,19,0.06)",
                              }}
                            >
                              <Image
                                src={photoUrl}
                                alt={`Customer photo ${photoIdx + 1}`}
                                fill
                                sizes="90px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                      <option value="Co-ords">Co-ords</option>
                      <option value="Men's Wear">{"Men's Wear"}</option>
                      <option value="New Arrivals">New Arrivals</option>
                      <option value="Occasion Wear">Occasion Wear</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Promotional Tag / Deal Badge
                    </label>
                    <select
                      value={productForm.promo_tag}
                      onChange={(e) => setProductForm({ ...productForm, promo_tag: e.target.value })}
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
                      <option value="">None (Standard Catalog)</option>
                      <option value="Special Promo">🏷️ Special Promo</option>
                      <option value="Festive Offer">✨ Festive Offer</option>
                      <option value="Sale">🔥 Sale</option>
                      <option value="Under ₹1,299">💎 Under ₹1,299</option>
                      <option value="Flash Deal">⚡ Flash Deal</option>
                      <option value="Limited Deal">⏳ Limited Deal</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: "14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DED3" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.06em" }}>
                    Pricing, Promo Discount & Inventory
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Sale Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => {
                          const p = e.target.value;
                          const numP = Number(p);
                          const numM = Number(productForm.mrp);
                          let disc = productForm.discount_percent;
                          if (numM > numP && numP > 0) {
                            disc = String(Math.round(((numM - numP) / numM) * 100));
                          }
                          setProductForm({ ...productForm, price: p, discount_percent: disc });
                        }}
                        placeholder="e.g. 24999"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#261B13",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                        Original MRP (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.mrp}
                        onChange={(e) => {
                          const m = e.target.value;
                          const numM = Number(m);
                          const numP = Number(productForm.price);
                          let disc = productForm.discount_percent;
                          if (numM > numP && numP > 0) {
                            disc = String(Math.round(((numM - numP) / numM) * 100));
                          }
                          setProductForm({ ...productForm, mrp: m, discount_percent: disc });
                        }}
                        placeholder="e.g. 31999"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#866951",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={productForm.discount_percent}
                        onChange={(e) => setProductForm({ ...productForm, discount_percent: e.target.value })}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                        Stock Units
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={productForm.stock_count}
                        onChange={(e) => setProductForm({ ...productForm, stock_count: e.target.value })}
                        placeholder="10"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#866951" }}>
                      Garment Imagery URL *
                    </label>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        backgroundColor: isUploadingProductPhoto ? "#CFBEAD" : "#866951",
                        color: "#FAF7F2",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: isUploadingProductPhoto ? "not-allowed" : "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        disabled={isUploadingProductPhoto}
                        onChange={handleUploadProductPhoto}
                        style={{ display: "none" }}
                      />
                      <span>{isUploadingProductPhoto ? "Compressing & Uploading..." : "📷 Upload & Compress Photo"}</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    required
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    placeholder="https://pub-xxxx.r2.dev/products/saree-01.webp (Paste Cloudflare URL)"
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

                  {productPhotoUploadNotice && (
                    <div style={{ fontSize: "11px", color: "#1E5E3A", marginTop: "4px", fontWeight: 600 }}>
                      {productPhotoUploadNotice}
                    </div>
                  )}

                  {productForm.image_url && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "50px",
                          height: "65px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "1px solid #CFBEAD",
                          position: "relative",
                          backgroundColor: "#F2EBE3",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productForm.image_url}
                          alt="Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                      <span style={{ fontSize: "11px", color: "#866951" }}>
                        Preview active · Cloudflare CDN
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#866951" }}>
                    ☁️ <strong>Cloudflare CDN:</strong> Supports Cloudflare R2 public bucket URLs (<code>https://pub-*.r2.dev/...</code>) and Cloudflare Images (<code>https://imagedelivery.net/...</code>).
                  </div>
                </div>

                {/* Additional Gallery Photos Section */}
                <div style={{ padding: "14px", backgroundColor: "#F7F3EE", borderRadius: "8px", border: "1px dashed #CFBEAD" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#866951", display: "block" }}>
                        Additional Gallery Drapes & Angles ({productForm.gallery_images?.length || 0})
                      </label>
                      <span style={{ fontSize: "10.5px", color: "#866951" }}>
                        Auto-organized to Cloudflare: <code>products/&#123;cat&#125;/&#123;slug&#125;-gallery-*.webp</code>
                      </span>
                    </div>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        backgroundColor: isUploadingGallery ? "#CFBEAD" : "#866951",
                        color: "#FAF7F2",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: isUploadingGallery ? "not-allowed" : "pointer",
                        userSelect: "none",
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        disabled={isUploadingGallery}
                        onChange={handleUploadGalleryPhotos}
                        style={{ display: "none" }}
                      />
                      <span>{isUploadingGallery ? "Uploading..." : "📷 + Add Angles (Multi)"}</span>
                    </label>
                  </div>

                  {galleryUploadNotice && (
                    <div style={{ fontSize: "11px", color: "#1E5E3A", marginBottom: "8px", fontWeight: 600 }}>
                      {galleryUploadNotice}
                    </div>
                  )}

                  {productForm.gallery_images && productForm.gallery_images.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "8px", marginTop: "8px" }}>
                      {productForm.gallery_images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "125%",
                            borderRadius: "6px",
                            overflow: "hidden",
                            border: "1px solid #CFBEAD",
                            backgroundColor: "#EDE4D8",
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Gallery ${idx + 1}`}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            title="Remove image"
                            style={{
                              position: "absolute",
                              top: "3px",
                              right: "3px",
                              backgroundColor: "rgba(38, 27, 19, 0.75)",
                              color: "#FFFFFF",
                              border: "none",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              fontSize: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                          <span
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              left: "3px",
                              fontSize: "9px",
                              color: "#FFFFFF",
                              backgroundColor: "rgba(0,0,0,0.5)",
                              padding: "1px 4px",
                              borderRadius: "3px",
                            }}
                          >
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "11px", color: "#866951", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                      No extra gallery angles added yet. Click &quot;+ Add Angles&quot; to upload multiple side/back/detail views.
                    </div>
                  )}
                </div>

                {/* Available Sizes Section */}
                <div style={{ padding: "14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DED3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Available Sizes & Inventory ({productForm.available_sizes?.length || 0})
                    </label>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = ["Free Size"];
                          const inv: Record<string, number> = { "Free Size": 10 };
                          setProductForm((prev) => ({
                            ...prev,
                            available_sizes: sizes,
                            size_inventory: inv,
                            stock_count: prev.color_variants.length > 0 && prev.color_variants.some((v) => v.sizes && v.sizes.length > 0)
                              ? prev.stock_count
                              : "10",
                          }));
                        }}
                        style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", border: "1px solid #CFBEAD", backgroundColor: "#FFFFFF", color: "#866951", cursor: "pointer" }}
                      >
                        Saree (Free Size)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
                          const inv: Record<string, number> = { XS: 5, S: 10, M: 10, L: 10, XL: 5, XXL: 5 };
                          const total = 45;
                          setProductForm((prev) => ({
                            ...prev,
                            available_sizes: sizes,
                            size_inventory: inv,
                            stock_count: prev.color_variants.length > 0 && prev.color_variants.some((v) => v.sizes && v.sizes.length > 0)
                              ? prev.stock_count
                              : String(total),
                          }));
                        }}
                        style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", border: "1px solid #CFBEAD", backgroundColor: "#FFFFFF", color: "#866951", cursor: "pointer" }}
                      >
                        XS–XXL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sizes = ["S", "M", "L", "XL"];
                          const inv: Record<string, number> = { S: 10, M: 10, L: 10, XL: 10 };
                          const total = 40;
                          setProductForm((prev) => ({
                            ...prev,
                            available_sizes: sizes,
                            size_inventory: inv,
                            stock_count: prev.color_variants.length > 0 && prev.color_variants.some((v) => v.sizes && v.sizes.length > 0)
                              ? prev.stock_count
                              : String(total),
                          }));
                        }}
                        style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "4px", border: "1px solid #CFBEAD", backgroundColor: "#FFFFFF", color: "#866951", cursor: "pointer" }}
                      >
                        S–XL
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                    {productForm.available_sizes.map((sz, idx) => {
                      const stockVal = productForm.size_inventory[sz] !== undefined ? productForm.size_inventory[sz] : 5;
                      const isOos = stockVal === 0;
                      return (
                        <span
                          key={idx}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            backgroundColor: isOos ? "#FEF2F2" : "#FFFFFF",
                            border: isOos ? "1px solid #FCA5A5" : "1px solid #CFBEAD",
                            color: "#261B13",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          <span>{sz}</span>
                          <span style={{ fontSize: "10px", color: "#866951" }}>Stock:</span>
                          <input
                            type="number"
                            min="0"
                            value={stockVal}
                            onChange={(e) => {
                              const num = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setProductForm((prev) => {
                                const newInv = { ...prev.size_inventory, [sz]: num };
                                const hasColorSizes = prev.color_variants.some((v) => v.sizes && v.sizes.length > 0);
                                const newTotal = hasColorSizes
                                  ? prev.stock_count
                                  : String(prev.available_sizes.reduce((sum, s) => sum + (newInv[s] !== undefined ? newInv[s] : 5), 0));
                                return {
                                  ...prev,
                                  size_inventory: newInv,
                                  stock_count: newTotal,
                                };
                              });
                            }}
                            style={{
                              width: "46px",
                              padding: "2px 4px",
                              border: isOos ? "1px solid #EF4444" : "1px solid #CFBEAD",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: isOos ? "#DC2626" : "#261B13",
                              backgroundColor: isOos ? "#FEF2F2" : "#FFFFFF",
                              textAlign: "center",
                            }}
                          />
                          {isOos ? (
                            <span style={{ fontSize: "9px", color: "#DC2626", fontWeight: 700 }}>OOS</span>
                          ) : (
                            <span style={{ fontSize: "9px", color: "#0F7A50", fontWeight: 600 }}>✓</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm((prev) => {
                                const newSizes = prev.available_sizes.filter((_, i) => i !== idx);
                                const newInv = { ...prev.size_inventory };
                                delete newInv[sz];
                                const hasColorSizes = prev.color_variants.some((v) => v.sizes && v.sizes.length > 0);
                                const newTotal = hasColorSizes
                                  ? prev.stock_count
                                  : String(newSizes.reduce((sum, s) => sum + (newInv[s] !== undefined ? newInv[s] : 5), 0));
                                return {
                                  ...prev,
                                  available_sizes: newSizes,
                                  size_inventory: newInv,
                                  stock_count: newTotal,
                                };
                              });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#866951",
                              cursor: "pointer",
                              fontSize: "11px",
                              padding: 0,
                              lineHeight: 1,
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                    {productForm.available_sizes.length === 0 && (
                      <span style={{ fontSize: "11.5px", color: "#B91C1C", fontStyle: "italic" }}>
                        No sizes selected. Click a preset above or add custom sizes below.
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = customSizeInput.trim();
                          if (val && !productForm.available_sizes.includes(val)) {
                            setProductForm((prev) => {
                              const newSizes = [...prev.available_sizes, val];
                              const newInv = { ...prev.size_inventory, [val]: 5 };
                              const hasColorSizes = prev.color_variants.some((v) => v.sizes && v.sizes.length > 0);
                              const newTotal = hasColorSizes
                                ? prev.stock_count
                                : String(newSizes.reduce((sum, s) => sum + (newInv[s] !== undefined ? newInv[s] : 5), 0));
                              return {
                                ...prev,
                                available_sizes: newSizes,
                                size_inventory: newInv,
                                stock_count: newTotal,
                              };
                            });
                            setCustomSizeInput("");
                          }
                        }
                      }}
                      placeholder="Add custom size (e.g. 38, 40, Custom, Made to Measure) & press Enter"
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FFFFFF",
                        fontSize: "12px",
                        color: "#261B13",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = customSizeInput.trim();
                        if (val && !productForm.available_sizes.includes(val)) {
                          setProductForm((prev) => {
                            const newSizes = [...prev.available_sizes, val];
                            const newInv = { ...prev.size_inventory, [val]: 5 };
                            const hasColorSizes = prev.color_variants.some((v) => v.sizes && v.sizes.length > 0);
                            const newTotal = hasColorSizes
                              ? prev.stock_count
                              : String(newSizes.reduce((sum, s) => sum + (newInv[s] !== undefined ? newInv[s] : 5), 0));
                            return {
                              ...prev,
                              available_sizes: newSizes,
                              size_inventory: newInv,
                              stock_count: newTotal,
                            };
                          });
                          setCustomSizeInput("");
                        }
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#866951",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Colourways & Dedicated Imagery Section */}
                <div style={{ padding: "16px", backgroundColor: "#FCFAF7", borderRadius: "10px", border: "1px solid #E8DED3" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                        🎨 Colourways & Dedicated Imagery ({productForm.color_variants?.length || 0})
                      </label>
                      <span style={{ fontSize: "11px", color: "#6E5B4E", lineHeight: "1.4", display: "block", marginTop: "2px" }}>
                        Different colours have different images! When shoppers click a colour on the storefront, the photo gallery automatically changes to show that exact colour.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProductForm((prev) => ({
                          ...prev,
                          color_variants: [
                            ...prev.color_variants,
                            {
                              name: "",
                              hex: "#8B0000",
                              image_url: "",
                              gallery_images: [],
                            },
                          ],
                        }))
                      }
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        backgroundColor: "#261B13",
                        color: "#FAF7F2",
                        border: "none",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <PlusIcon size={13} color="#FFFFFF" />
                      <span>+ Add Colour</span>
                    </button>
                  </div>

                  {productForm.color_variants.length === 0 ? (
                    <div style={{ fontSize: "11.5px", color: "#866951", fontStyle: "italic", textAlign: "center", padding: "12px", backgroundColor: "#F7F2EE", borderRadius: "6px", marginTop: "8px" }}>
                      No separate colourways added. The garment will use its hero photo. Click <strong>&quot;+ Add Colour&quot;</strong> if this garment is offered in multiple shades (e.g. Crimson Red, Peacock Blue, Emerald Green) with their own photos.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                      {productForm.color_variants.map((variant, vIdx) => (
                        <div
                          key={vIdx}
                          style={{
                            padding: "14px",
                            borderRadius: "8px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CFBEAD",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "50%",
                                  backgroundColor: variant.hex || "#261B13",
                                  border: "2px solid #FFFFFF",
                                  boxShadow: "0 0 0 1px #CFBEAD",
                                  display: "inline-block",
                                }}
                              />
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#261B13" }}>
                                Colourway #{vIdx + 1}: {variant.name || "(Unnamed Shade)"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  color_variants: prev.color_variants.filter((_, i) => i !== vIdx),
                                }))
                              }
                              style={{
                                fontSize: "11px",
                                color: "#B91C1C",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              ✕ Remove Colour
                            </button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px", marginBottom: "10px" }}>
                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                                Colour Name *
                              </label>
                              <input
                                type="text"
                                required
                                value={variant.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm((prev) => ({
                                    ...prev,
                                    color_variants: prev.color_variants.map((v, i) =>
                                      i === vIdx ? { ...v, name: val } : v
                                    ),
                                  }));
                                }}
                                placeholder="e.g. Crimson Red, Peacock Blue, Emerald Green"
                                style={{
                                  width: "100%",
                                  padding: "8px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #CFBEAD",
                                  fontSize: "12.5px",
                                  color: "#261B13",
                                }}
                              />
                            </div>

                            <div>
                              <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                                Swatch Hex
                              </label>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <input
                                  type="color"
                                  value={variant.hex || "#8B0000"}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductForm((prev) => ({
                                      ...prev,
                                      color_variants: prev.color_variants.map((v, i) =>
                                        i === vIdx ? { ...v, hex: val } : v
                                      ),
                                    }));
                                  }}
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    padding: 0,
                                    border: "1px solid #CFBEAD",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                />
                                <input
                                  type="text"
                                  value={variant.hex || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProductForm((prev) => ({
                                      ...prev,
                                      color_variants: prev.color_variants.map((v, i) =>
                                        i === vIdx ? { ...v, hex: val } : v
                                      ),
                                    }));
                                  }}
                                  placeholder="#8B0000"
                                  style={{
                                    width: "80px",
                                    padding: "8px 8px",
                                    borderRadius: "6px",
                                    border: "1px solid #CFBEAD",
                                    fontSize: "12px",
                                    color: "#261B13",
                                    fontFamily: "monospace",
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <label style={{ fontSize: "11px", fontWeight: 600, color: "#866951" }}>
                                Dedicated Photo for this Colour *
                              </label>
                              <label
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  backgroundColor: uploadingColorVariantIdx === vIdx ? "#CFBEAD" : "#866951",
                                  color: "#FAF7F2",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  cursor: uploadingColorVariantIdx === vIdx ? "not-allowed" : "pointer",
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/jpg"
                                  disabled={uploadingColorVariantIdx === vIdx}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingColorVariantIdx(vIdx);
                                    try {
                                      const formData = new FormData();
                                      formData.append("file", file);
                                      formData.append("folder", "products");
                                      if (productForm.name) formData.append("product_name", productForm.name);
                                      if (productForm.category) formData.append("category", productForm.category);
                                      const colorRole = (variant.name || `shade-${vIdx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, "-");
                                      formData.append("role", `color-${colorRole}`);

                                      const res = await fetch("/api/admin/upload", {
                                        method: "POST",
                                        body: formData,
                                      });
                                      const data = await res.json();
                                      if (!res.ok || !data.success || !data.url) {
                                        throw new Error(data.error || "Failed to upload photo for colour");
                                      }
                                      setProductForm((prev) => ({
                                        ...prev,
                                        color_variants: prev.color_variants.map((v, i) =>
                                          i === vIdx ? { ...v, image_url: data.url } : v
                                        ),
                                      }));
                                      showToast(`Uploaded dedicated photo for ${variant.name || `Colour #${vIdx + 1}`}!`);
                                    } catch (err: unknown) {
                                      const msg = err instanceof Error ? err.message : "Upload error";
                                      showToast(msg, "error");
                                    } finally {
                                      setUploadingColorVariantIdx(null);
                                      e.target.value = "";
                                    }
                                  }}
                                  style={{ display: "none" }}
                                />
                                <span>{uploadingColorVariantIdx === vIdx ? "Uploading..." : "📷 Upload Photo"}</span>
                              </label>
                            </div>

                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                              <input
                                type="text"
                                value={variant.image_url || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setProductForm((prev) => ({
                                    ...prev,
                                    color_variants: prev.color_variants.map((v, i) =>
                                      i === vIdx ? { ...v, image_url: val } : v
                                    ),
                                  }));
                                }}
                                placeholder="Paste Cloudflare URL or click 'Upload Photo' above"
                                style={{
                                  flex: 1,
                                  padding: "7px 10px",
                                  borderRadius: "6px",
                                  border: "1px solid #CFBEAD",
                                  fontSize: "12px",
                                  color: "#261B13",
                                }}
                              />

                              {variant.image_url && (
                                <div
                                  style={{
                                    width: "36px",
                                    height: "46px",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                    border: "1px solid #CFBEAD",
                                    flexShrink: 0,
                                    position: "relative",
                                  }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={variant.image_url}
                                    alt={variant.name || "Variant"}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sizes & Stock for this Shade */}
                          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed #E8DED3" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  Sizes & Stock for {variant.name || `Shade #${vIdx + 1}`} ({variant.sizes?.length || 0})
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 600, color: (variant.sizes?.reduce((acc, s) => acc + (Number(s.stock) || 0), 0) || 0) > 0 ? "#0F7A50" : "#B91C1C", backgroundColor: (variant.sizes?.reduce((acc, s) => acc + (Number(s.stock) || 0), 0) || 0) > 0 ? "#EBF8F2" : "#FEF2F2", padding: "2px 6px", borderRadius: "4px" }}>
                                  Total: {variant.sizes?.reduce((acc, s) => acc + (Number(s.stock) || 0), 0) || 0} pcs
                                </span>
                              </div>
                              <div style={{ display: "flex", gap: "6px" }}>
                                {productForm.available_sizes.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const garmentSizes = productForm.available_sizes.map((sz) => ({
                                        size: sz,
                                        stock: productForm.size_inventory[sz] !== undefined ? productForm.size_inventory[sz] : 5,
                                      }));
                                      setProductForm((prev) => {
                                        const updated = prev.color_variants.map((v, i) =>
                                          i === vIdx ? { ...v, sizes: garmentSizes, stock: garmentSizes.reduce((sum, s) => sum + s.stock, 0) } : v
                                        );
                                        const totalStock = updated.reduce((sum, v) => sum + (v.sizes?.reduce((sSum, s) => sSum + (Number(s.stock) || 0), 0) || v.stock || 0), 0);
                                        return { ...prev, color_variants: updated, stock_count: String(totalStock) };
                                      });
                                    }}
                                    style={{
                                      fontSize: "10.5px",
                                      padding: "3px 8px",
                                      borderRadius: "4px",
                                      border: "1px solid #CFBEAD",
                                      backgroundColor: "#FFFFFF",
                                      color: "#866951",
                                      cursor: "pointer",
                                      fontWeight: 500,
                                    }}
                                  >
                                    📋 Copy Garment Sizes
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm((prev) => {
                                      const curSizes = variant.sizes || [];
                                      const nextSizeName = `Size ${curSizes.length + 1}`;
                                      const updatedSizes = [...curSizes, { size: nextSizeName, stock: 5 }];
                                      const updatedVariants = prev.color_variants.map((v, i) =>
                                        i === vIdx ? { ...v, sizes: updatedSizes, stock: updatedSizes.reduce((sum, s) => sum + s.stock, 0) } : v
                                      );
                                      const totalStock = updatedVariants.reduce((sum, v) => sum + (v.sizes?.reduce((sSum, s) => sSum + (Number(s.stock) || 0), 0) || v.stock || 0), 0);
                                      return { ...prev, color_variants: updatedVariants, stock_count: String(totalStock) };
                                    });
                                  }}
                                  style={{
                                    fontSize: "10.5px",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    backgroundColor: "#866951",
                                    color: "#FFFFFF",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                  }}
                                >
                                  + Add Size
                                </button>
                              </div>
                            </div>

                            {(!variant.sizes || variant.sizes.length === 0) ? (
                              <div style={{ fontSize: "11px", color: "#866951", fontStyle: "italic", padding: "6px 0" }}>
                                No specific size stock set for this shade. Click &quot;📋 Copy Garment Sizes&quot; or &quot;+ Add Size&quot;.
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {variant.sizes.map((szObj, szIdx) => (
                                  <div
                                    key={szIdx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "6px",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                      backgroundColor: "#FFFFFF",
                                      border: Number(szObj.stock) === 0 ? "1px solid #FCA5A5" : "1px solid #CFBEAD",
                                      fontSize: "12px",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      value={szObj.size}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setProductForm((prev) => ({
                                          ...prev,
                                          color_variants: prev.color_variants.map((v, i) =>
                                            i === vIdx
                                              ? {
                                                  ...v,
                                                  sizes: v.sizes?.map((s, si) => (si === szIdx ? { ...s, size: val } : s)),
                                                }
                                              : v
                                          ),
                                        }));
                                      }}
                                      style={{
                                        width: "55px",
                                        padding: "2px 4px",
                                        border: "1px solid #E8DED3",
                                        borderRadius: "3px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: "#261B13",
                                      }}
                                      placeholder="Size"
                                    />
                                    <span style={{ fontSize: "10.5px", color: "#866951" }}>Qty:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={szObj.stock}
                                      onChange={(e) => {
                                        const num = Math.max(0, parseInt(e.target.value, 10) || 0);
                                        setProductForm((prev) => {
                                          const updatedVariants = prev.color_variants.map((v, i) => {
                                            if (i !== vIdx) return v;
                                            const newSizes = v.sizes?.map((s, si) => (si === szIdx ? { ...s, stock: num } : s)) || [];
                                            return { ...v, sizes: newSizes, stock: newSizes.reduce((sum, s) => sum + s.stock, 0) };
                                          });
                                          const totalStock = updatedVariants.reduce((sum, v) => sum + (v.sizes?.reduce((sSum, s) => sSum + (Number(s.stock) || 0), 0) || v.stock || 0), 0);
                                          return { ...prev, color_variants: updatedVariants, stock_count: String(totalStock) };
                                        });
                                      }}
                                      style={{
                                        width: "48px",
                                        padding: "2px 4px",
                                        border: Number(szObj.stock) === 0 ? "1px solid #EF4444" : "1px solid #E8DED3",
                                        borderRadius: "3px",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        color: Number(szObj.stock) === 0 ? "#DC2626" : "#261B13",
                                        backgroundColor: Number(szObj.stock) === 0 ? "#FEF2F2" : "#FFFFFF",
                                        textAlign: "center",
                                      }}
                                    />
                                    {Number(szObj.stock) === 0 ? (
                                      <span style={{ fontSize: "9px", fontWeight: 700, color: "#DC2626", textTransform: "uppercase" }}>OOS</span>
                                    ) : (
                                      <span style={{ fontSize: "9px", fontWeight: 600, color: "#0F7A50" }}>✓</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductForm((prev) => {
                                          const updatedVariants = prev.color_variants.map((v, i) => {
                                            if (i !== vIdx) return v;
                                            const newSizes = v.sizes?.filter((_, si) => si !== szIdx) || [];
                                            return { ...v, sizes: newSizes, stock: newSizes.reduce((sum, s) => sum + s.stock, 0) };
                                          });
                                          const totalStock = updatedVariants.reduce((sum, v) => sum + (v.sizes?.reduce((sSum, s) => sSum + (Number(s.stock) || 0), 0) || v.stock || 0), 0);
                                          return { ...prev, color_variants: updatedVariants, stock_count: String(totalStock) };
                                        });
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#991B1B",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        padding: "0 2px",
                                        lineHeight: 1,
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ padding: "14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DED3" }}>
                  <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.06em" }}>
                    ✦ Atelier Craftsmanship, Drape Video & Compliance
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Fabric Material
                      </label>
                      <input
                        type="text"
                        value={productForm.fabric}
                        onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                        placeholder="e.g. Pure Mulberry Katan Silk / Chanderi Blend"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Weave / Work / Detailing
                      </label>
                      <input
                        type="text"
                        value={productForm.weave}
                        onChange={(e) => setProductForm({ ...productForm, weave: e.target.value })}
                        placeholder="e.g. Real Gold Zari Kadhwa Weave & Floral Jaal"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        Craft Cluster / Origin
                      </label>
                      <input
                        type="text"
                        value={productForm.cluster_origin}
                        onChange={(e) => setProductForm({ ...productForm, cluster_origin: e.target.value })}
                        placeholder="e.g. Artisan Zari Guild & Varanasi Weaving Cluster"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                        YouTube Drape Video Link (Optional)
                      </label>
                      <input
                        type="text"
                        value={productForm.video_url}
                        onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })}
                        placeholder="Optional: https://www.youtube.com/watch?v=..."
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                        SKU Identifier (Inventory Code)
                      </label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        placeholder="e.g. AVS-SAR-KAT-RED"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                          fontFamily: "monospace",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11.5px", fontWeight: 600, color: "#866951", marginBottom: "4px" }}>
                        GST HSN Code
                      </label>
                      <input
                        type="text"
                        value={productForm.hsn_code}
                        onChange={(e) => setProductForm({ ...productForm, hsn_code: e.target.value })}
                        placeholder="e.g. 5007 (Silk) or 5208 (Cotton)"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          border: "1px solid #CFBEAD",
                          backgroundColor: "#FFFFFF",
                          fontSize: "13px",
                          color: "#261B13",
                        }}
                      />
                    </div>
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
      {/* MODAL: BULK PRODUCT INGESTION (CSV)                                   */}
      {/* ===================================================================== */}
      {showBulkImportModal && (
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
            if (e.target === e.currentTarget && !bulkImporting) setShowBulkImportModal(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase" }}>
                  Catalog Scaling Utility
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#261B13", marginTop: "2px" }}>
                  Bulk Import Products via CSV
                </h3>
                <p style={{ fontSize: "12.5px", color: "#6E5B4E", marginTop: "4px" }}>
                  Draft hundreds of products in your favorite spreadsheet and ingest them in one batch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                disabled={bulkImporting}
                style={{ padding: "6px", color: "#866951", background: "none", border: "none", cursor: "pointer" }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "20px", padding: "12px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px dashed #CFBEAD" }}>
              <div style={{ flex: 1, fontSize: "12px", color: "#5A4535" }}>
                <strong>Need the format?</strong> Download our verified pre-filled spreadsheet template with sample sarees and dresses.
              </div>
              <a
                href="/api/admin/products/template"
                download="avsaraa-products-template.csv"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                <span>📥 Download Template</span>
              </a>
            </div>

            {/* Upload Area */}
            <div
              style={{
                border: "2px dashed #CFBEAD",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                backgroundColor: "#FCFAF7",
                marginBottom: "20px",
              }}
            >
              <input
                type="file"
                id="csv-file-input"
                accept=".csv,text/csv"
                onChange={handleCsvFileSelected}
                disabled={bulkImporting}
                style={{ display: "none" }}
              />
              <label
                htmlFor="csv-file-input"
                style={{
                  cursor: bulkImporting ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "28px" }}>📄</span>
                <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13" }}>
                  {bulkCsvFile ? bulkCsvFile.name : "Click to select or drop CSV spreadsheet"}
                </span>
                <span style={{ fontSize: "11px", color: "#866951" }}>
                  {bulkCsvFile ? `${(bulkCsvFile.size / 1024).toFixed(1)} KB` : "Supports UTF-8 CSV with commas & quotes"}
                </span>
              </label>
            </div>

            {/* Error Message */}
            {bulkImportError && (
              <div
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#FDF2F2",
                  color: "#991B1B",
                  borderRadius: "8px",
                  fontSize: "12px",
                  marginBottom: "16px",
                  border: "1px solid #FCA5A5",
                }}
              >
                {bulkImportError}
              </div>
            )}

            {/* Preview Parsed Rows */}
            {bulkParsedProducts.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#1E5E3A" }}>
                    ✓ Ready to Import: {bulkParsedProducts.length} Valid Products
                  </span>
                  <span style={{ fontSize: "11px", color: "#866951" }}>
                    Showing first {Math.min(5, bulkParsedProducts.length)} items
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid #EAE0D5",
                    fontSize: "11.5px",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#F7F2EE", borderBottom: "1px solid #EAE0D5" }}>
                        <th style={{ padding: "8px 10px" }}>#</th>
                        <th style={{ padding: "8px 10px" }}>Name</th>
                        <th style={{ padding: "8px 10px" }}>Category</th>
                        <th style={{ padding: "8px 10px" }}>Price</th>
                        <th style={{ padding: "8px 10px" }}>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkParsedProducts.slice(0, 5).map((p, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #F0E8DF" }}>
                          <td style={{ padding: "6px 10px", color: "#866951" }}>{idx + 1}</td>
                          <td style={{ padding: "6px 10px", fontWeight: 600, color: "#261B13" }}>{String(p.name)}</td>
                          <td style={{ padding: "6px 10px", color: "#6E5B4E" }}>{String(p.category)}</td>
                          <td style={{ padding: "6px 10px", color: "#261B13", fontWeight: 600 }}>₹{Number(p.price).toLocaleString("en-IN")}</td>
                          <td style={{ padding: "6px 10px", color: "#1E5E3A" }}>{String(p.stock_count || 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                disabled={bulkImporting}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#866951",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteBulkImport}
                disabled={bulkImporting || bulkParsedProducts.length === 0}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: bulkParsedProducts.length > 0 ? "#1E5E3A" : "#CFBEAD",
                  color: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: bulkParsedProducts.length > 0 && !bulkImporting ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{bulkImporting ? "Importing to Catalog..." : `Import ${bulkParsedProducts.length} Products`}</span>
              </button>
            </div>
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

            {/* Sizes in View Modal */}
            {viewingProduct.available_sizes && viewingProduct.available_sizes.length > 0 && (
              <div style={{ marginTop: "14px", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Available Sizes & Stock ({viewingProduct.available_sizes.length})
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {viewingProduct.available_sizes.map((sz, idx) => {
                    const sizeInv = viewingProduct.size_inventory || (viewingProduct.specifications as Record<string, unknown> | undefined)?.size_inventory as Record<string, number> | undefined;
                    const stock = sizeInv?.[sz];
                    return (
                      <span
                        key={idx}
                        style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          backgroundColor: stock === 0 ? "#FEF2F2" : "#FAF7F2",
                          border: stock === 0 ? "1px solid #FCA5A5" : "1px solid #CFBEAD",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#261B13",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{sz}</span>
                        {stock !== undefined && (
                          <span style={{ fontSize: "10px", color: stock === 0 ? "#DC2626" : "#866951", fontWeight: stock === 0 ? 700 : 500 }}>
                            ({stock === 0 ? "Out of Stock" : `${stock} pcs`})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Colourways in View Modal */}
            {viewingProduct.color_variants && viewingProduct.color_variants.length > 0 && (
              <div style={{ marginTop: "14px", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Colour Variants & Inventory ({viewingProduct.color_variants.length})
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {viewingProduct.color_variants.map((v, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "6px",
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #E8DED3",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: v.sizes && v.sizes.length > 0 ? "6px" : "0" }}>
                        <span
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: v.hex || "#261B13",
                            border: "1px solid #CFBEAD",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#261B13", flex: 1 }}>
                          {v.name}
                        </span>
                        {v.stock !== undefined && (
                          <span style={{ fontSize: "11px", color: v.stock === 0 ? "#DC2626" : "#0F7A50", fontWeight: 600 }}>
                            {v.stock === 0 ? "Out of stock" : `${v.stock} in stock`}
                          </span>
                        )}
                        {(v.image_url || v.primary_image) && (
                          <div
                            style={{
                              width: "30px",
                              height: "40px",
                              borderRadius: "4px",
                              overflow: "hidden",
                              border: "1px solid #CFBEAD",
                              flexShrink: 0,
                              position: "relative",
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={v.image_url || v.primary_image}
                              alt={v.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                      </div>
                      {v.sizes && v.sizes.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginLeft: "28px" }}>
                          {v.sizes.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: "10.5px",
                                padding: "2px 6px",
                                borderRadius: "3px",
                                backgroundColor: Number(s.stock) === 0 ? "#FEF2F2" : "#FFFFFF",
                                border: Number(s.stock) === 0 ? "1px solid #FCA5A5" : "1px solid #CFBEAD",
                                color: Number(s.stock) === 0 ? "#DC2626" : "#261B13",
                                fontWeight: 500,
                              }}
                            >
                              {s.size}: {Number(s.stock) === 0 ? "OOS" : `${s.stock} pcs`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Account Status
                    </label>
                    <select
                      value={customerForm.status}
                      onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
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
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

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

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#866951", marginBottom: "6px" }}>
                      Private Concierge Notes / CRM Observations
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Special size preferences, personal styling requests, bespoke sizing notes..."
                      value={customerForm.concierge_notes}
                      onChange={(e) => setCustomerForm({ ...customerForm, concierge_notes: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid #CFBEAD",
                        backgroundColor: "#FCFAF7",
                        fontSize: "13px",
                        color: "#261B13",
                        fontFamily: "inherit",
                        resize: "vertical",
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
      {/* MODAL 5B: CUSTOMER 360° CRM PROFILE DRAWER / MODAL                   */}
      {/* ===================================================================== */}
      {viewingCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "rgba(38,27,19,0.72)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #CFBEAD",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(38,27,19,0.35)",
              overflow: "hidden",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #E8DFD5",
                backgroundColor: "#F4EEE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "18px",
                    fontFamily: "serif",
                  }}
                >
                  {viewingCustomer.full_name?.charAt(0).toUpperCase() || "P"}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#261B13", fontFamily: "serif", margin: 0 }}>
                      {viewingCustomer.full_name}
                    </h2>
                    {viewingCustomer.rfm_segment && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "12px",
                          backgroundColor:
                            viewingCustomer.rfm_segment === "VIP Atelier"
                              ? "#FDF6B2"
                              : viewingCustomer.rfm_segment === "Repeat Patron"
                              ? "#E1EFFE"
                              : viewingCustomer.rfm_segment === "Active Patron"
                              ? "#DEF7EC"
                              : viewingCustomer.rfm_segment === "Guest Buyer"
                              ? "#FEF08A"
                              : "#F3F4F6",
                          color:
                            viewingCustomer.rfm_segment === "VIP Atelier"
                              ? "#723B13"
                              : viewingCustomer.rfm_segment === "Repeat Patron"
                              ? "#1E429F"
                              : viewingCustomer.rfm_segment === "Active Patron"
                              ? "#03543F"
                              : viewingCustomer.rfm_segment === "Guest Buyer"
                              ? "#854D0E"
                              : "#374151",
                          border: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        {viewingCustomer.rfm_segment}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        backgroundColor: viewingCustomer.status === "Suspended" ? "#FDE8E8" : "#EDFDF2",
                        color: viewingCustomer.status === "Suspended" ? "#9B1C1C" : "#0E7044",
                      }}
                    >
                      {viewingCustomer.status || "Active"}
                    </span>
                    {viewingCustomer.is_guest && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "6px",
                          backgroundColor: "#FEF3C7",
                          color: "#92400E",
                          border: "1px solid #FCD34D",
                        }}
                      >
                        Guest Checkout Account
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#866951", marginTop: "3px" }}>
                    {viewingCustomer.email || "No email"} • {viewingCustomer.phone_number || "No phone"} • Registered{" "}
                    {new Date(viewingCustomer.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Action buttons in header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {viewingCustomer.is_guest && (
                  <button
                    onClick={handleConvertGuestToPatron}
                    disabled={isConvertingGuest}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#866951",
                      color: "#FAF7F2",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isConvertingGuest ? "Converting..." : "✨ Convert to Registered Patron"}
                  </button>
                )}
                <button
                  onClick={() => {
                    openEditCustomerModal(viewingCustomer);
                    setViewingCustomer(null);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    color: "#261B13",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setViewingCustomer(null)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    color: "#866951",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "12px",
                padding: "16px 24px",
                backgroundColor: "#FCFAF7",
                borderBottom: "1px solid #E8DFD5",
              }}
            >
              <div style={{ padding: "10px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DFD5" }}>
                <div style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lifetime Spend</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginTop: "2px" }}>
                  ₹{(viewingCustomer.total_spend || 0).toLocaleString("en-IN")}
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DFD5" }}>
                <div style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Orders</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginTop: "2px" }}>
                  {viewingCustomer.order_count || viewingCustomer.orders?.length || 0}
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DFD5" }}>
                <div style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Order Value</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#261B13", marginTop: "2px" }}>
                  ₹{viewingCustomer.order_count ? Math.round((viewingCustomer.total_spend || 0) / viewingCustomer.order_count).toLocaleString("en-IN") : "0"}
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DFD5" }}>
                <div style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reward Points</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#866951", marginTop: "2px" }}>
                  {(viewingCustomer.reward_points ?? 0).toLocaleString()} pts
                </div>
              </div>

              <div style={{ padding: "10px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #E8DFD5" }}>
                <div style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.5px" }}>Primary City</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {viewingCustomer.primary_city || "Not recorded"}
                </div>
              </div>
            </div>

            {/* Subtabs Bar */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px 24px 0",
                borderBottom: "1px solid #E8DFD5",
                backgroundColor: "#FAF7F2",
              }}
            >
              {[
                { key: "orders", label: `Orders (${viewingCustomer.orders?.length || 0})`, icon: "🛍️" },
                { key: "addresses", label: `Addresses (${viewingCustomer.addresses?.length || 0})`, icon: "📍" },
                { key: "inquiries", label: `Inquiries (${viewingCustomer.inquiries?.length || 0})`, icon: "💬" },
                { key: "notes", label: "Concierge Notes", icon: "📝" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCustomerDetailSubTab(tab.key as "orders" | "addresses" | "inquiries" | "notes")}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: customerDetailSubTab === tab.key ? "2px solid #261B13" : "2px solid transparent",
                    backgroundColor: "transparent",
                    color: customerDetailSubTab === tab.key ? "#261B13" : "#866951",
                    fontWeight: customerDetailSubTab === tab.key ? 700 : 500,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Subtab Content Area */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, maxHeight: "calc(90vh - 280px)" }}>
              {/* SUBTAB 1: ORDERS */}
              {customerDetailSubTab === "orders" && (
                <div>
                  {!viewingCustomer.orders || viewingCustomer.orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#866951" }}>
                      <p style={{ fontSize: "14px", margin: 0 }}>No purchase transactions on record for this customer.</p>
                      <p style={{ fontSize: "12px", color: "#A89481", marginTop: "4px" }}>Orders placed with this email or phone number will automatically appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {viewingCustomer.orders.map((order) => (
                        <div
                          key={order.id}
                          style={{
                            border: "1px solid #E8DFD5",
                            borderRadius: "12px",
                            backgroundColor: "#FCFAF7",
                            padding: "16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1px solid #F0E8DF",
                              paddingBottom: "10px",
                              marginBottom: "10px",
                              flexWrap: "wrap",
                              gap: "8px",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700, fontSize: "14px", color: "#261B13" }}>
                                Order #{order.order_number}
                              </span>
                              <span style={{ fontSize: "12px", color: "#866951", marginLeft: "10px" }}>
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  backgroundColor:
                                    order.order_status === "DELIVERED"
                                      ? "#DEF7EC"
                                      : order.order_status === "CANCELLED"
                                      ? "#FDE8E8"
                                      : "#E1EFFE",
                                  color:
                                    order.order_status === "DELIVERED"
                                      ? "#03543F"
                                      : order.order_status === "CANCELLED"
                                      ? "#9B1C1C"
                                      : "#1E429F",
                                }}
                              >
                                {order.order_status}
                              </span>
                              <span style={{ fontWeight: 700, fontSize: "15px", color: "#261B13" }}>
                                ₹{Number(order.total_amount).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {order.order_items.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    fontSize: "13px",
                                    padding: "4px 0",
                                    color: "#543E2E",
                                  }}
                                >
                                  <div>
                                    <span style={{ fontWeight: 600, color: "#261B13" }}>{item.product_name}</span>
                                    {(item.color || item.size) && (
                                      <span style={{ fontSize: "11px", color: "#866951", marginLeft: "6px" }}>
                                        ({[item.color, item.size].filter(Boolean).join(", ")})
                                      </span>
                                    )}
                                    <span style={{ fontSize: "11px", color: "#866951", marginLeft: "6px" }}>
                                      × {item.quantity}
                                    </span>
                                  </div>
                                  <div style={{ fontWeight: 600, color: "#261B13" }}>
                                    ₹{Number(item.total_price).toLocaleString("en-IN")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ fontSize: "12px", color: "#866951" }}>Items details recorded in fulfillment ledger.</div>
                          )}

                          {/* Shipping address summary */}
                          {order.shipping_address_snapshot && (
                            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #E8DFD5", fontSize: "11px", color: "#866951" }}>
                              Delivered to: {order.shipping_address_snapshot.recipient_name} • {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} • Ph: {order.shipping_address_snapshot.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: ADDRESSES */}
              {customerDetailSubTab === "addresses" && (
                <div>
                  {!viewingCustomer.addresses || viewingCustomer.addresses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#866951" }}>
                      <p style={{ fontSize: "14px", margin: 0 }}>No saved delivery addresses found.</p>
                      <p style={{ fontSize: "12px", color: "#A89481", marginTop: "4px" }}>Addresses saved during checkout or profile updates will be listed here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                      {viewingCustomer.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          style={{
                            border: "1px solid #E8DFD5",
                            borderRadius: "12px",
                            backgroundColor: "#FCFAF7",
                            padding: "16px",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#261B13" }}>
                              {addr.recipient_name}
                            </div>
                            {addr.is_default && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "#261B13",
                                  color: "#FAF7F2",
                                }}
                              >
                                Default
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "13px", color: "#543E2E", lineHeight: "1.5" }}>
                            <div>{addr.address_line1}</div>
                            <div>{addr.city}, {addr.state} - {addr.postal_code}</div>
                            <div style={{ marginTop: "6px", fontSize: "12px", color: "#866951" }}>
                              📞 {addr.phone_number}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: INQUIRIES */}
              {customerDetailSubTab === "inquiries" && (
                <div>
                  {!viewingCustomer.inquiries || viewingCustomer.inquiries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#866951" }}>
                      <p style={{ fontSize: "14px", margin: 0 }}>No customer inquiries on record.</p>
                      <p style={{ fontSize: "12px", color: "#A89481", marginTop: "4px" }}>Support requests submitted via the contact form appear here.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {viewingCustomer.inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          style={{
                            border: "1px solid #E8DFD5",
                            borderRadius: "12px",
                            backgroundColor: "#FCFAF7",
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "#261B13" }}>
                              {inq.subject}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  backgroundColor:
                                    inq.status === "Resolved"
                                      ? "#DEF7EC"
                                      : inq.status === "In Progress"
                                      ? "#FEF08A"
                                      : "#F3F4F6",
                                  color:
                                    inq.status === "Resolved"
                                      ? "#03543F"
                                      : inq.status === "In Progress"
                                      ? "#854D0E"
                                      : "#374151",
                                }}
                              >
                                {inq.status}
                              </span>
                              <span style={{ fontSize: "12px", color: "#866951" }}>
                                {new Date(inq.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          <p style={{ fontSize: "13px", color: "#543E2E", margin: 0, lineHeight: "1.5" }}>
                            {inq.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: CONCIERGE NOTES */}
              {customerDetailSubTab === "notes" && (
                <div>
                  <div
                    style={{
                      backgroundColor: "#FFFBEB",
                      border: "1px solid #FDE68A",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      fontSize: "12px",
                      color: "#92400E",
                      lineHeight: "1.5",
                    }}
                  >
                    💡 <strong>Atelier Concierge Notes:</strong> Internal notes visible only to administrative staff. Use this space for bespoke sizing observations, personal stylist feedback, preferred fabric textures, gifting schedules, and VIP preferences.
                  </div>

                  <textarea
                    rows={8}
                    value={crmNoteDraft}
                    onChange={(e) => setCrmNoteDraft(e.target.value)}
                    placeholder="Enter private concierge notes regarding styling preferences, bespoke alterations, or customer history..."
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FFFFFF",
                      fontSize: "14px",
                      color: "#261B13",
                      fontFamily: "inherit",
                      lineHeight: "1.6",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                    <button
                      onClick={handleSaveCrmNote}
                      disabled={isSavingCrmNote}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "8px",
                        backgroundColor: "#261B13",
                        color: "#FAF7F2",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isSavingCrmNote ? "Saving Notes..." : "💾 Save Concierge Note"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #E8DFD5",
                backgroundColor: "#F4EEE7",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setViewingCustomer(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close Drawer
              </button>
            </div>
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
                <button
                  type="button"
                  disabled={sendingAckId === viewingInquiry.id}
                  onClick={() => handleSendInquiryAcknowledgement(viewingInquiry)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #C5A265",
                    backgroundColor: "#FBF7EF",
                    color: "#846124",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: sendingAckId === viewingInquiry.id ? "not-allowed" : "pointer",
                    opacity: sendingAckId === viewingInquiry.id ? 0.7 : 1,
                  }}
                >
                  {sendingAckId === viewingInquiry.id ? "Sending..." : "✉️ Send Ack (support@avsaraa.in)"}
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

      {/* ===================================================================== */}
      {/* MODAL 9: PATRON MEDIA PREVIEW (PHOTO ENLARGED)                        */}
      {/* ===================================================================== */}
      {previewMediaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(18, 12, 8, 0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewMediaModal(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#1C140E",
              borderRadius: "16px",
              border: "1px solid #C5A059",
              width: "100%",
              maxWidth: "600px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(197, 160, 89, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CameraIcon size={18} color="#C5A059" />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#F7F2EE",
                    fontFamily: "var(--font-playfair), serif",
                  }}
                >
                  {previewMediaModal.title || "Customer Heirloom Photo"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#CFBEAD",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div
              style={{
                padding: "16px",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#0F0A07",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "500px",
                  maxHeight: "70vh",
                }}
              >
                <Image
                  src={previewMediaModal.url}
                  alt={previewMediaModal.title || "Customer Photo"}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "12px 20px",
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "#1C140E",
                borderTop: "1px solid rgba(197, 160, 89, 0.2)",
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  backgroundColor: "#C5A059",
                  color: "#1C140E",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
