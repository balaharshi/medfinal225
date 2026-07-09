/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  Calendar,
  HeartPulse, 
  Layers, 
  Building2, 
  TrendingUp, 
  Settings, 
  Trash2, 
  Plus, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon, 
  FileText, 
  Sliders, 
  DollarSign, 
  MapPin, 
  Users, 
  Check, 
  FileSpreadsheet, 
  Mail, 
  Key, 
  Eye, 
  ChevronRight,
  ShieldAlert,
  Loader2,
  LockKeyhole,
  CheckCircle,
  Clock,
  Briefcase,
  Phone,
  X,
  User,
  Stethoscope,
  Activity,
  Star,
  CreditCard
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ConfirmDialog from "./ConfirmDialog";
import SocialAuthButtons from "./SocialAuthButtons";
import PhoneInput from "./PhoneInput";
import { HEALTHCARE_SERVICES, DEFAULT_HEALTHCARE_SERVICE_IMAGE } from "../data";
import { subscribeToNotifications } from "../services/pusherClient";

interface AdminDashboardProps {
  db: {
    categories: any[];
    products: any[];
    services: any[];
  };
  onRefresh: () => void;
  triggerToast: (msg: string) => void;
}

interface AdminLoginFormValues {
  username: string;
  password: string;
}

export default function AdminDashboard({ db, onRefresh, triggerToast }: AdminDashboardProps) {
  const hasStoredAdminSession = typeof window !== "undefined" && (
    localStorage.getItem("medziva_admin_auth") === "true" ||
    !!localStorage.getItem("medziva_admin_token")
  );

  // Login Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    mode: "onTouched",
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Active Pane Tab inside Admin Console
  const [activePane, setActivePane] = useState<"dashboard" | "bookings" | "services" | "categories" | "subcategories" | "vendor" | "vendorServices" | "customRequests" | "users" | "reports" | "roles" | "settings" | "enquiries" | "vendorChangeRequests" | "pendingPayments" | "sla">("dashboard");
  const [reportPane, setReportPane] = useState<"overview" | "revenue" | "services" | "bookings" | "sales" | "vendors" | "customers">("overview");

  // Dynamic lists from backend
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<any[]>([]);
  const [pendingPaymentsList, setPendingPaymentsList] = useState<any[]>([]);
  const [pendingPaymentsLoading, setPendingPaymentsLoading] = useState(false);
  const [vendorChangeRequestsList, setVendorChangeRequestsList] = useState<any[]>([]);
  const [vendorChangeRequestsSearch, setVendorChangeRequestsSearch] = useState("");
  const [vendorChangeRequestsStatusFilter, setVendorChangeRequestsStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isReviewingChangeRequest, setIsReviewingChangeRequest] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [vendorFilter, setVendorFilter] = useState<"all" | "active" | "inactive">("all");
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendorServiceVendorId, setSelectedVendorServiceVendorId] = useState("");
  const [vendorServiceAssignments, setVendorServiceAssignments] = useState<any[]>([]);
  const [vendorServiceSearch, setVendorServiceSearch] = useState("");
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [selectedVendorDetailsId, setSelectedVendorDetailsId] = useState<string | null>(null);
  const [vendorDetailsTab, setVendorDetailsTab] = useState<"profile" | "requests" | "history" | "payments" | "commissions" | "reviews" | "documents">("profile");
  const [vendorDetailsSearch, setVendorDetailsSearch] = useState("");
  const [vendorDetailsStatusFilter, setVendorDetailsStatusFilter] = useState("all");
  const [vendorDetailsServiceFilter, setVendorDetailsServiceFilter] = useState("all");
  const [bookingFilter, setBookingFilter] = useState<"all" | "Pending" | "Active" | "Completed" | "Canceled">("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [customRequestSearch, setCustomRequestSearch] = useState("");
  const [customRequestStatusFilter, setCustomRequestStatusFilter] = useState<"all" | "Pending Response" | "Answered" | "Closed">("all");
  const [vendorSlaMetrics, setVendorSlaMetrics] = useState<any[]>([]);
  const [vendorSlaLoading, setVendorSlaLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<"all" | "today" | "7d" | "30d" | "90d">("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  const getAdminRequestInit = (init: RequestInit = {}) => {
    const token = localStorage.getItem("medziva_admin_token");
    const headers = new Headers(init.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return {
      ...init,
      credentials: "include" as const,
      headers,
    };
  };

  // Filtered vendors list
  const filteredVendors = vendorsList.filter((v) => {
    const matchesFilter = 
      vendorFilter === "all" || 
      (vendorFilter === "active" && v.active) || 
      (vendorFilter === "inactive" && !v.active);
    const matchesSearch = 
      vendorSearch === "" || 
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      (v.contact && v.contact.toLowerCase().includes(vendorSearch.toLowerCase())) ||
      (v.address && v.address.toLowerCase().includes(vendorSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Filtered bookings list
  const filteredBookings = bookingsList.filter((b) => {
    const matchesFilter = 
      bookingFilter === "all" || 
      b.status === bookingFilter;
    const matchesSearch = 
      bookingSearch === "" || 
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.serviceTitle && b.serviceTitle.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.vendorName && b.vendorName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.customerEmail && b.customerEmail.toLowerCase().includes(bookingSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });
  const getPaymentBadgeClass = (paymentStatus?: string) => {
    if (paymentStatus === "Paid") return "bg-emerald-50 text-emerald-700";
    if (paymentStatus === "Failed" || paymentStatus === "Canceled") return "bg-rose-50 text-rose-700";
    if (paymentStatus === "Pending") return "bg-blue-50 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };
  const filteredCustomServiceRequests = enquiriesList.filter((request) => {
    const query = customRequestSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      request.customerName?.toLowerCase().includes(query) ||
      request.customerEmail?.toLowerCase().includes(query) ||
      request.customerPhone?.toLowerCase().includes(query) ||
      request.serviceTitle?.toLowerCase().includes(query) ||
      request.message?.toLowerCase().includes(query);
    const matchesStatus = customRequestStatusFilter === "all" || request.status === customRequestStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const filteredVendorChangeRequests = vendorChangeRequestsList.filter((req) => {
    const query = vendorChangeRequestsSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      req.vendorName?.toLowerCase().includes(query) ||
      req.fieldName?.toLowerCase().includes(query) ||
      req.currentValue?.toLowerCase().includes(query) ||
      req.requestedValue?.toLowerCase().includes(query) ||
      req.reason?.toLowerCase().includes(query);
    const matchesStatus = vendorChangeRequestsStatusFilter === "all" || req.status === vendorChangeRequestsStatusFilter;
    return matchesSearch && matchesStatus;
  });
  const selectedServiceVendor = vendorsList.find((vendor) => vendor.id === selectedVendorServiceVendorId);
  const normalizeServiceImageKey = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .trim();
  const frontendServiceImageByKey = useMemo(() => {
    const entries = HEALTHCARE_SERVICES.flatMap((service) => {
      const normalizedTitle = normalizeServiceImageKey(service.title || "");
      return [
        [String(service.id || ""), service.image],
        [String(service.title || "").trim().toLowerCase(), service.image],
        [normalizedTitle, service.image],
        [`${service.category || ""}:${service.subcategory || ""}`, service.image],
        [`${service.category || ""}:`, service.image],
      ];
    });
    return new Map(entries.filter(([key]) => Boolean(key)) as Array<[string, string]>);
  }, []);
  const getServiceRecordImage = (service: any) =>
    frontendServiceImageByKey.get(String(service.id || "")) ||
    frontendServiceImageByKey.get(String(service.title || "").trim().toLowerCase()) ||
    frontendServiceImageByKey.get(normalizeServiceImageKey(String(service.title || ""))) ||
    frontendServiceImageByKey.get(`${service.category || ""}:${service.subcategory || ""}`) ||
    frontendServiceImageByKey.get(`${service.category || ""}:`) ||
    service.image;
  const filteredVendorServiceAssignments = vendorServiceAssignments.filter((service) => {
    const query = vendorServiceSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      service.title?.toLowerCase().includes(query) ||
      service.category?.toLowerCase().includes(query) ||
      service.subcategory?.toLowerCase().includes(query) ||
      service.description?.toLowerCase().includes(query)
    );
  });
  const selectedVendorDetails = vendorsList.find((vendor) => vendor.id === selectedVendorDetailsId);
  const selectedVendorUser = usersList.find((user) => user.vendorId === selectedVendorDetailsId);
  const vendorDetailAssignments = selectedVendorDetailsId === selectedVendorServiceVendorId ? vendorServiceAssignments : [];
  const enabledVendorServices = vendorDetailAssignments.filter((service) => service.enabled);
  const selectedVendorBookings = selectedVendorDetails
    ? bookingsList.filter((booking) => booking.vendorId === selectedVendorDetails.id || booking.vendorName === selectedVendorDetails.name)
    : [];
  const selectedVendorAvailableRequests = selectedVendorDetails
    ? bookingsList.filter((booking) => {
        const enabledServiceIds = new Set(enabledVendorServices.map((service) => service.id));
        if (enabledServiceIds.size === 0) return false;
        return !booking.vendorId && (booking.status === "Pending" || !booking.status) && (!booking.serviceId || enabledServiceIds.has(booking.serviceId));
      })
    : [];
  const selectedVendorRequests = [...selectedVendorAvailableRequests, ...selectedVendorBookings];
  const filteredVendorRequests = selectedVendorRequests.filter((booking) => {
    const query = vendorDetailsSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      booking.id?.toLowerCase().includes(query) ||
      booking.customerName?.toLowerCase().includes(query) ||
      booking.serviceTitle?.toLowerCase().includes(query) ||
      booking.region?.toLowerCase().includes(query);
    const matchesStatus = vendorDetailsStatusFilter === "all" || booking.status === vendorDetailsStatusFilter;
    const matchesService = vendorDetailsServiceFilter === "all" || booking.serviceTitle === vendorDetailsServiceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });
  const selectedVendorServiceTitles = Array.from(new Set(selectedVendorRequests.map((booking) => booking.serviceTitle).filter(Boolean)));
  const vendorGrossRevenue = selectedVendorBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);
  const vendorCommissionRate = Number(selectedVendorDetails?.commission || 0);
  const vendorCommissionAmount = Math.round((vendorGrossRevenue * vendorCommissionRate) / 100);
  const vendorNetPayable = vendorGrossRevenue - vendorCommissionAmount;
  const vendorCompletedBookings = selectedVendorBookings.filter((booking) => booking.status === "Completed");
  const todayIso = new Date().toISOString().split("T")[0];
  const vendorTodayBookings = selectedVendorBookings.filter((booking) => booking.date === todayIso);
  const vendorTodayRevenue = vendorTodayBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);
  const vendorSyntheticReviews = selectedVendorBookings.slice(0, 6).map((booking, index) => ({
    id: `review-${booking.id}`,
    customerName: booking.customerName || "Customer",
    service: booking.serviceTitle || "Service",
    rating: Math.max(3, Math.min(5, Math.round(Number(selectedVendorDetails?.rating || 4.5) - (index % 2 === 0 ? 0 : 0.5)))),
    review: booking.notes || "Service completed as scheduled with professional support.",
    date: booking.updatedAt || booking.date || booking.createdAt,
  }));
  const vendorAverageRating = vendorSyntheticReviews.length > 0
    ? (vendorSyntheticReviews.reduce((sum, review) => sum + review.rating, 0) / vendorSyntheticReviews.length).toFixed(1)
    : Number(selectedVendorDetails?.rating || 5).toFixed(1);
  const vendorRatingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: vendorSyntheticReviews.filter((review) => review.rating === rating).length,
  }));
  const vendorDocuments = [
    "Business License",
    "Bank Account Details",
  ].map((name) => ({
    name,
    status: "Pending",
    updatedAt: selectedVendorDetails?.updatedAt || selectedVendorDetails?.createdAt,
  }));
  const vendorPaymentRows = selectedVendorBookings.slice(0, 12).map((booking) => {
    const gross = Number(booking.price) || 0;
    const commission = Math.round((gross * vendorCommissionRate) / 100);
    return {
      transactionId: `txn-${booking.id}`,
      bookingRef: booking.id,
      gross,
      commission,
      net: gross - commission,
      date: booking.updatedAt || booking.date,
      status: booking.status === "Completed" ? "Paid" : booking.status === "Canceled" ? "Voided" : "Pending",
    };
  });
  const vendorCommissionRows = selectedVendorBookings.slice(0, 12).map((booking) => {
    const gross = Number(booking.price) || 0;
    return {
      serviceName: booking.serviceTitle,
      bookingId: booking.id,
      percent: vendorCommissionRate,
      amount: Math.round((gross * vendorCommissionRate) / 100),
      status: booking.status === "Completed" ? "Settled" : "Pending",
      date: booking.status === "Completed" ? (booking.updatedAt || booking.date) : "Pending",
    };
  });
  const [settingsData, setSettingsData] = useState<any>({
    siteName: "MedZiva Home Healthcare",
    vatPercent: 5,
    defaultCurrency: "AED",
    supportEmail: "support@medziva.ae",
    serviceRegions: ["Dubai", "Sharjah"],
    maintenanceMode: false,
    adminUsername: "admin"
  });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- FORM STATES ---

  // Category Form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catImage, setCatImage] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);

  // Subcategory Form
  const [parentCatId, setParentCatId] = useState("");
  const [subName, setSubName] = useState("");
  const [subImage, setSubImage] = useState("");

  // Service Form
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitle, setSrvTitle] = useState("");
  const [srvSlug, setSrvSlug] = useState("");
  const [srvStatus, setSrvStatus] = useState<"draft" | "active" | "inactive">("active");
  const [srvActive, setSrvActive] = useState(true);
  const [srvCategory, setSrvCategory] = useState("");
  const [srvSubcategory, setSrvSubcategory] = useState("");
  const [srvPrice, setSrvPrice] = useState("");
  const [srvOriginalPrice, setSrvOriginalPrice] = useState("");
  const [srvVisitFeeIncluded, setSrvVisitFeeIncluded] = useState(true);
  const [srvDuration, setSrvDuration] = useState("1 Hour");
  const [srvEstimatedVisitTime, setSrvEstimatedVisitTime] = useState("");
  const [srvImage, setSrvImage] = useState("");
  const [srvShortDesc, setSrvShortDesc] = useState("");
  const [srvDesc, setSrvDesc] = useState("");
  const [srvFullDesc, setSrvFullDesc] = useState("");
  const [srvInclusions, setSrvInclusions] = useState("");
  const [srvPreparation, setSrvPreparation] = useState("");
  const [srvWhoFor, setSrvWhoFor] = useState("");
  const [srvLocation, setSrvLocation] = useState("at-home");
  const [srvAvailability, setSrvAvailability] = useState("");
  const [srvTags, setSrvTags] = useState("");
  const [srvDisplayPriority, setSrvDisplayPriority] = useState("100");
  const [srvSeoTitle, setSrvSeoTitle] = useState("");
  const [srvSeoDescription, setSrvSeoDescription] = useState("");
  const [srvPopular, setSrvPopular] = useState(false);
  const [srvAttributes, setSrvAttributes] = useState<Array<{ name: string; value: string }>>([
    { name: "Practitioner Level", value: "Certified Specialist" }
  ]);
  const [srvVendors, setSrvVendors] = useState<Array<{ vendorName: string; price: number }>>([
    { vendorName: "MedZiva Nurse Team", price: 0 }
  ]);

  // Vendor Creator Form
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorAddress, setVendorAddress] = useState("Dubai Marina, Dubai");
  const [vendorLogo, setVendorLogo] = useState("");
  const [vendorCommission, setVendorCommission] = useState("10");
  const [vendorActive, setVendorActive] = useState(true);
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isServiceEditModalOpen, setIsServiceEditModalOpen] = useState(false);
  const [previewingService, setPreviewingService] = useState<any>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");
  const [serviceStatusFilter, setServiceStatusFilter] = useState<"all" | "active" | "inactive" | "draft" | "featured">("all");
  const [isBookingViewModalOpen, setIsBookingViewModalOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Admin form validation errors
  const [adminFormErrors, setAdminFormErrors] = useState<Record<string, string>>({});

  // Settings modification
  const [settingsForm, setSettingsForm] = useState({
    siteName: "",
    vatPercent: 5,
    defaultCurrency: "AED",
    supportEmail: "support@medziva.ae",
    serviceRegions: [] as string[],
    maintenanceMode: false,
    adminPassword: ""
  });

  useEffect(() => {
    const hydrateSession = async () => {
      const hasStoredSession = (
        localStorage.getItem("medziva_admin_auth") === "true" ||
        !!localStorage.getItem("medziva_admin_token")
      );

      try {
        const response = await fetch('/api/auth/session', getAdminRequestInit());
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.role === 'admin' || data?.user?.role === 'super_admin') {
            setIsAuthenticated(true);
            localStorage.setItem("medziva_admin_auth", "true");
            return;
          }
        }

        if (hasStoredSession) {
          localStorage.removeItem("medziva_admin_auth");
          localStorage.removeItem("medziva_admin_token");
        }
        setIsAuthenticated(false);
      } catch (error) {

        localStorage.removeItem("medziva_admin_auth");
        localStorage.removeItem("medziva_admin_token");
        setIsAuthenticated(false);
      } finally {
        setIsSessionChecking(false);
      }
    };

    hydrateSession();
  }, []);

  // Fetch dynamic Admin items
  const fetchAdminData = async () => {
    setIsLoadingData(true);
    try {
      const loadJson = async (url: string) => {
        const response = await fetch(url, getAdminRequestInit());
        if (!response.ok) {
          throw new Error(`${url} failed with ${response.status}`);
        }
        return response.json();
      };

      const [vendorsResult, usersResult, bookingsResult, settingsResult, enquiriesResult, categoriesResult, vendorChangeRequestsResult, pendingPaymentsResult] = await Promise.allSettled([
        loadJson("/api/vendors"),
        loadJson("/api/users"),
        loadJson("/api/bookings"),
        loadJson("/api/settings"),
        loadJson("/api/enquiries"),
        loadJson("/api/categories"),
        loadJson("/api/vendorProfileChangeRequests"),
        loadJson("/api/admin/payments/pending"),
      ]);

      if (vendorsResult.status === "fulfilled") {
        setVendorsList(vendorsResult.value);
      } else {
        
      }

      if (usersResult.status === "fulfilled") {
        setUsersList(usersResult.value);
      } else {
        
      }

      if (bookingsResult.status === "fulfilled") {
        setBookingsList(bookingsResult.value);
      } else {
        
      }

      if (enquiriesResult.status === "fulfilled") {
        setEnquiriesList(enquiriesResult.value);
      } else {
        
      }

      if (settingsResult.status === "fulfilled") {
        const data = settingsResult.value;
        setSettingsData(data);
        setSettingsForm({
          siteName: data.siteName || "MedZiva Home Healthcare",
          vatPercent: Number(data.vatPercent) || 5,
          defaultCurrency: data.defaultCurrency || "AED",
          supportEmail: data.supportEmail || "support@medziva.ae",
          serviceRegions: data.serviceRegions || ["Dubai", "Sharjah"],
          maintenanceMode: !!data.maintenanceMode,
          adminPassword: ""
        });
      } else {
        
      }

      if (categoriesResult.status === "fulfilled") {
        setCategoriesList(categoriesResult.value);
      } else {
        
      }

      if (vendorChangeRequestsResult.status === "fulfilled") {
        setVendorChangeRequestsList(Array.isArray(vendorChangeRequestsResult.value) ? vendorChangeRequestsResult.value : []);
      } else {
        
      }

      if (pendingPaymentsResult.status === "fulfilled") {
        const pData = pendingPaymentsResult.value;
        setPendingPaymentsList(Array.isArray(pData?.payments) ? pData.payments : Array.isArray(pData) ? pData : []);
      } else {
        
      }

      onRefresh();
    } catch (e) {

    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
      onRefresh(); // Ensure db prop is updated with latest categories
    }
  }, [isAuthenticated]);

  const fetchVendorSlaMetrics = async () => {
    setVendorSlaLoading(true);
    try {
      const response = await fetch("/api/admin/vendor-sla", getAdminRequestInit());
      if (response.ok) {
        const data = await response.json();
        setVendorSlaMetrics(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      // silent
    } finally {
      setVendorSlaLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activePane === "sla") {
      fetchVendorSlaMetrics();
    }
  }, [isAuthenticated, activePane]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        fetchAdminData();
      }
    };

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible" && (activePane === "dashboard" || activePane === "bookings")) {
        fetchAdminData();
      }
    }, 15000);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(intervalId);
    };
  }, [activePane, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    return subscribeToNotifications((payload) => {
      const eventName = String(payload.event || "");
      const action = String(payload.action || "");
      const message = String(payload.message || "");
      const isNewBooking =
        eventName === "appointment:update" &&
        (action === "created" || (!action && message.toLowerCase().includes("new appointment booked")));

      if (!isNewBooking) return;

      toast.success(message || "New booking received.");
      fetchAdminData();
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedVendorServiceVendorId && vendorsList.length > 0) {
      setSelectedVendorServiceVendorId(vendorsList[0].id);
    }
  }, [selectedVendorServiceVendorId, vendorsList]);

  const fetchVendorServiceAssignments = async (vendorId = selectedVendorServiceVendorId) => {
    if (!vendorId) return;

    try {
      const response = await fetch(`/api/vendors/${vendorId}/service-assignments`, getAdminRequestInit());
      if (response.ok) {
        setVendorServiceAssignments(await response.json());
      }
    } catch (error) {

    }
  };

  const handleOpenVendorDetails = (vendor: any) => {
    setSelectedVendorDetailsId(vendor.id);
    setSelectedVendorServiceVendorId(vendor.id);
    setVendorDetailsTab("profile");
    setVendorDetailsSearch("");
    setVendorDetailsStatusFilter("all");
    setVendorDetailsServiceFilter("all");
    fetchVendorServiceAssignments(vendor.id);
  };

  const handleExportVendorCsv = () => {
    if (!selectedVendorDetails) return;
    const rows = [
      ["Vendor", selectedVendorDetails.name],
      ["Vendor ID", selectedVendorDetails.id],
      ["Gross Revenue", `${vendorGrossRevenue}`],
      ["Commission", `${vendorCommissionAmount}`],
      ["Net Payable", `${vendorNetPayable}`],
      [],
      ["Booking ID", "Customer", "Service", "Date", "Amount", "Status"],
      ...selectedVendorBookings.map((booking) => [
        booking.id,
        booking.customerName,
        booking.serviceTitle,
        booking.date,
        booking.price,
        booking.status || "Pending",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedVendorDetails.id}-vendor-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleVendorStatus = async () => {
    if (!selectedVendorDetails) return;
    const nextActive = !selectedVendorDetails.active;
    try {
      const response = await fetch(
        `/api/vendor/${selectedVendorDetails.id}`,
        getAdminRequestInit({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: nextActive }),
        })
      );
      if (!response.ok) throw new Error("Unable to update vendor status");
      triggerToast(`Vendor ${nextActive ? "activated" : "deactivated"} successfully.`);
      await fetchAdminData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update vendor status");
    }
  };

  useEffect(() => {
    if (isAuthenticated && activePane === "vendorServices" && selectedVendorServiceVendorId) {
      fetchVendorServiceAssignments(selectedVendorServiceVendorId);
    }
  }, [isAuthenticated, activePane, selectedVendorServiceVendorId]);

  const handleToggleVendorService = async (serviceId: string, enabled: boolean) => {
    if (!selectedVendorServiceVendorId) return;

    setIsSavingAssignments(true);
    setVendorServiceAssignments((items) =>
      items.map((item) => item.id === serviceId ? { ...item, assigned: true, enabled, status: enabled ? "Enabled" : "Disabled" } : item),
    );

    try {
      const response = await fetch(
        `/api/vendors/${selectedVendorServiceVendorId}/service-assignments/${serviceId}`,
        getAdminRequestInit({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled }),
        })
      );

      if (!response.ok) {
        await fetchVendorServiceAssignments();
        throw new Error("Assignment update failed");
      }
    } catch (error) {

      toast.error("Unable to update service assignment.");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const handleBulkVendorServices = async (enabled: boolean) => {
    if (!selectedVendorServiceVendorId || filteredVendorServiceAssignments.length === 0) return;

    setIsSavingAssignments(true);
    const serviceIds = filteredVendorServiceAssignments.map((service) => service.id);
    setVendorServiceAssignments((items) =>
      items.map((item) => serviceIds.includes(item.id) ? { ...item, assigned: true, enabled, status: enabled ? "Enabled" : "Disabled" } : item),
    );

    try {
      const response = await fetch(
        `/api/vendors/${selectedVendorServiceVendorId}/service-assignments/bulk`,
        getAdminRequestInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceIds, enabled }),
        })
      );

      if (!response.ok) {
        await fetchVendorServiceAssignments();
        throw new Error("Bulk assignment update failed");
      }
      triggerToast(`${enabled ? "Enabled" : "Disabled"} ${serviceIds.length} service${serviceIds.length === 1 ? "" : "s"} for ${selectedServiceVendor?.name || "vendor"}.`);
    } catch (error) {

      toast.error("Unable to update service assignments.");
    } finally {
      setIsSavingAssignments(false);
    }
  };

  // Handle Login Authentication
  const submitAdminLogin = async (values: AdminLoginFormValues) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.username, password: values.password })
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        const role = data?.user?.role;
        if (role !== "admin" && role !== "super_admin") {
          const message = "Admin access requires an admin account. Please sign in with admin credentials.";
          setAuthError(message);
          toast.error(message);
          return;
        }

        if (data.accessToken) {
          localStorage.setItem("medziva_admin_token", data.accessToken);
        }
        localStorage.setItem("medziva_admin_auth", "true");
        setIsAuthenticated(true);
        setIsSessionChecking(false);
        triggerToast("Access Granted. Welcome back to Admin Operations Center.");
        reset();
      } else {
        const message = data?.error || "The combination is invalid. Please retry.";
        setAuthError(message);
        toast.error(message);
      }
    } catch {
      const message = "Unable to reach the authentication service.";
      setAuthError(message);
      toast.error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminSocialLogin = async (data: any) => {
    const role = data?.user?.role;
    if (role !== "admin" && role !== "super_admin") {
      const message = "Admin access requires an admin account. Please sign in with an admin Google account.";
      setAuthError(message);
      toast.error(message);
      return;
    }

    if (data.accessToken) {
      localStorage.setItem("medziva_admin_token", data.accessToken);
    }
    localStorage.setItem("medziva_admin_auth", "true");
    setIsAuthenticated(true);
    setIsSessionChecking(false);
    triggerToast("Access Granted. Welcome back to Admin Operations Center.");
    reset();
  };

  const handleAdminSocialError = (message: string) => {
    setAuthError(message);
    toast.error(message);
  };

  // Perform logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("medziva_admin_auth");
    localStorage.removeItem("medziva_admin_token");
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    triggerToast("Logged out of session. Data sealed console-wide.");
  };

  // Filter subcategories for services
  const filteredSubcategoriesForService = useMemo(() => {
    const selectedCatObj = categoriesList.find(c => c.slug === srvCategory || c.id === srvCategory);
    return selectedCatObj?.subcategories || [];
  }, [srvCategory, categoriesList]);

  const slugifyServiceTitle = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const parseLines = (value: string) =>
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitle("");
    setSrvSlug("");
    setSrvStatus("active");
    setSrvActive(true);
    setSrvCategory("");
    setSrvSubcategory("");
    setSrvPrice("");
    setSrvOriginalPrice("");
    setSrvVisitFeeIncluded(true);
    setSrvDuration("1 Hour");
    setSrvEstimatedVisitTime("");
    setSrvImage("");
    setSrvShortDesc("");
    setSrvDesc("");
    setSrvFullDesc("");
    setSrvInclusions("");
    setSrvPreparation("");
    setSrvWhoFor("");
    setSrvLocation("at-home");
    setSrvAvailability("");
    setSrvTags("");
    setSrvDisplayPriority("100");
    setSrvSeoTitle("");
    setSrvSeoDescription("");
    setSrvPopular(false);
    setSrvAttributes([{ name: "Practitioner Level", value: "Certified Specialist" }]);
    setSrvVendors([{ vendorName: "MedZiva Nurse Team", price: 0 }]);
  };

  const hydrateServiceForm = (service: any) => {
    setSrvTitle(service.title || "");
    setSrvSlug(service.slug || slugifyServiceTitle(service.title || ""));
    setSrvStatus(service.status || (service.active === false ? "inactive" : "active"));
    setSrvActive(service.active !== false);
    setSrvCategory(service.category || "");
    setSrvSubcategory(service.subcategory || "");
    setSrvPrice(String(service.salePrice || service.price || ""));
    setSrvOriginalPrice(String(service.originalPrice || service.price || ""));
    setSrvVisitFeeIncluded(service.homeVisitFeeIncluded !== false);
    setSrvDuration(service.duration || "1 Hour");
    setSrvEstimatedVisitTime(service.estimatedVisitTime || "");
    setSrvImage(service.image || "");
    setSrvShortDesc(service.shortDescription || service.description || "");
    setSrvDesc(service.description || "");
    setSrvFullDesc(service.fullDescription || service.description || "");
    setSrvInclusions((service.inclusions || []).join("\n"));
    setSrvPreparation(service.preparationInstructions || "");
    setSrvWhoFor(service.whoIsItFor || "");
    setSrvLocation(service.serviceLocation || "at-home");
    setSrvAvailability(service.availability || "");
    setSrvTags((service.tags || []).join(", "));
    setSrvDisplayPriority(String(service.displayPriority ?? 100));
    setSrvSeoTitle(service.seoTitle || "");
    setSrvSeoDescription(service.seoDescription || "");
    setSrvPopular(service.popular || false);
    setSrvAttributes(service.attributes || [{ name: "Practitioner Level", value: "Certified Specialist" }]);
    setSrvVendors(service.vendorPrices || [{ vendorName: "MedZiva Nurse Team", price: Number(service.price) || 0 }]);
  };

  const uniqueServiceCount = useMemo(() => {
    const seen = new Set<string>();
    return db.services.filter((service) => {
      const key = `${(service.title || "").trim().toLowerCase()}::${service.category || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).length;
  }, [db.services]);

  const filteredServiceRecords = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    const seen = new Set<string>();
    return db.services
      .filter((service) => {
        const dedupeKey = `${(service.title || "").trim().toLowerCase()}::${service.category || ""}`;
        if (seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        const searchable = [
          service.title,
          service.slug,
          service.category,
          service.subcategory,
          service.description,
          service.shortDescription,
          service.fullDescription,
          ...(service.tags || []),
        ].join(" ").toLowerCase();
        const matchesSearch = !query || searchable.includes(query);
        const matchesCategory = serviceCategoryFilter === "all" || service.category === serviceCategoryFilter;
        const matchesStatus =
          serviceStatusFilter === "all" ||
          (serviceStatusFilter === "featured" && service.popular) ||
          (serviceStatusFilter === "active" && service.active !== false && (service.status || "active") === "active") ||
          (serviceStatusFilter === "inactive" && (service.active === false || service.status === "inactive")) ||
          (serviceStatusFilter === "draft" && service.status === "draft");
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => (Number(a.displayPriority ?? 100) - Number(b.displayPriority ?? 100)) || a.title.localeCompare(b.title));
  }, [db.services, serviceSearch, serviceCategoryFilter, serviceStatusFilter]);

  const handleServiceImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrvImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleToggleServiceActive = async (service: any) => {
    const nextActive = service.active === false || service.status === "inactive";
    const nextStatus = nextActive ? "active" : "inactive";
    try {
      const response = await fetch(`/api/service/${service.id}`, getAdminRequestInit({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: service.title,
          price: service.price,
          active: nextActive,
          status: nextStatus,
        }),
      }));
      if (!response.ok) throw new Error("Unable to update service status");
      triggerToast(`${service.title} marked ${nextStatus}.`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update service status");
    }
  };

  const handleToggleServicePopular = async (service: any) => {
    const nextPopular = !service.popular;
    try {
      const response = await fetch(`/api/service/${service.id}`, getAdminRequestInit({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: service.title,
          price: service.price,
          popular: nextPopular,
        }),
      }));
      if (!response.ok) throw new Error("Unable to update popular status");
      triggerToast(`${service.title} ${nextPopular ? "marked as Popular" : "removed from Popular"}.`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update popular status");
    }
  };

  const confirmToggleServiceActive = (service: any) => {
    const isCurrentlyVisible = service.active !== false && (service.status || "active") === "active";
    requestConfirm(
      isCurrentlyVisible ? "Deactivate Service?" : "Activate Service?",
      isCurrentlyVisible
        ? `"${service.title}" will be hidden from the public website but kept safely in admin records.`
        : `"${service.title}" will become visible on the public website services list.`,
      () => handleToggleServiceActive(service),
      isCurrentlyVisible ? "Deactivate" : "Activate"
    );
  };

  const handleDuplicateService = (service: any) => {
    hydrateServiceForm({
      ...service,
      title: `${service.title || "Service"} Copy`,
      slug: `${service.slug || slugifyServiceTitle(service.title || "service")}-copy`,
      status: "draft",
      active: false,
      popular: false,
    });
    setEditingServiceId(null);
    setIsServiceEditModalOpen(false);
    triggerToast("Service duplicated into the form as a draft.");
  };

  const confirmDuplicateService = (service: any) => {
    requestConfirm(
      "Duplicate Service?",
      `"${service.title}" will be copied into the editor as a new draft. You can review and publish it after changes.`,
      () => handleDuplicateService(service),
      "Duplicate"
    );
  };


  // --- HANDLERS FOR SERVICE CREATION ---
  const handleAddAttribute = () => {
    setSrvAttributes([...srvAttributes, { name: "", value: "" }]);
  };
  const handleRemoveAttribute = (idx: number) => {
    setSrvAttributes(srvAttributes.filter((_, i) => i !== idx));
  };
  const handleAttributeChange = (idx: number, field: "name" | "value", text: string) => {
    const updated = [...srvAttributes];
    updated[idx][field] = text;
    setSrvAttributes(updated);
  };

  const handleAddVendorToSrv = () => {
    setSrvVendors([...srvVendors, { vendorName: "", price: Number(srvPrice) || 0 }]);
  };
  const handleRemoveVendorFromSrv = (idx: number) => {
    setSrvVendors(srvVendors.filter((_, i) => i !== idx));
  };
  const handleVendorChangeInSrv = (idx: number, field: "vendorName" | "price", val: any) => {
    const updated = [...srvVendors];
    if (field === "price") {
      updated[idx].price = Number(val) || 0;
    } else {
      updated[idx].vendorName = val;
    }
    setSrvVendors(updated);
  };


  // --- SERVICES CRUD OPERATIONS ---
  const handleEditService = (service: any) => {
    setEditingServiceId(service.id);
    hydrateServiceForm(service);
    setIsServiceEditModalOpen(false);
    setActivePane("services");
    triggerToast("Service loaded into the editor.");
  };

  const handleCancelServiceEdit = () => {
    resetServiceForm();
    setIsServiceEditModalOpen(false);
  };

  const requestConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "Delete"
  ) => {
    setPendingConfirm({ title, message, onConfirm, confirmLabel });
  };

  const handleCancelEdit = () => {
    resetServiceForm();
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!srvTitle.trim()) newErrors.srvTitle = 'Service title is required';
    if (!srvPrice) newErrors.srvPrice = 'Consult price is required';
    if (!srvDesc.trim()) newErrors.srvDesc = 'Clinical narrative details are required';
    if (Object.keys(newErrors).length > 0) {
      setAdminFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setAdminFormErrors({});

    setIsSubmitting(true);
    const cleanedAttrs = srvAttributes.filter(a => a.name.trim() !== "");
    const cleanedVendors = srvVendors.filter(v => v.vendorName.trim() !== "");

    try {
      const isEdit = !!editingServiceId;
      const url = isEdit ? `/api/service/${editingServiceId}` : "/api/services";
      const method = isEdit ? "PATCH" : "POST";
      
      const response = await fetch(
        url,
        getAdminRequestInit({
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: srvTitle,
            slug: srvSlug || slugifyServiceTitle(srvTitle),
            category: srvCategory || "home-healthcare",
            subcategory: srvSubcategory,
            status: srvStatus,
            active: srvActive && srvStatus === "active",
            price: Number(srvPrice),
            salePrice: Number(srvPrice),
            originalPrice: Number(srvOriginalPrice || srvPrice),
            currency: "AED",
            homeVisitFeeIncluded: srvVisitFeeIncluded,
            duration: srvDuration,
            estimatedVisitTime: srvEstimatedVisitTime,
            image: srvImage || DEFAULT_HEALTHCARE_SERVICE_IMAGE,
            shortDescription: srvShortDesc || srvDesc,
            description: srvDesc || "No description provided.",
            fullDescription: srvFullDesc || srvDesc || "No description provided.",
            inclusions: parseLines(srvInclusions),
            preparationInstructions: srvPreparation,
            whoIsItFor: srvWhoFor,
            serviceLocation: srvLocation,
            availability: srvAvailability,
            tags: parseLines(srvTags),
            displayPriority: Number(srvDisplayPriority || 100),
            seoTitle: srvSeoTitle,
            seoDescription: srvSeoDescription,
            popular: srvPopular,
            attributes: cleanedAttrs,
            vendorPrices: cleanedVendors
          })
        })
      );

      if (response.ok) {
        triggerToast(`Service "${srvTitle}" ${isEdit ? 'updated' : 'added'} successfully!`);
        if (isEdit) {
          handleCancelServiceEdit();
        } else {
          handleCancelEdit();
        }
        onRefresh();
        fetchAdminData();
      } else {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} service on server database.`);
      }
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    requestConfirm(
      "Delete Service?",
      `This will permanently remove "${name}" from the service catalog and admin records.`,
      async () => {
        try {
          const response = await fetch(`/api/service/${id}`, getAdminRequestInit({ method: "DELETE" }));
          if (response.ok) {
            triggerToast(`${name} deleted from active catalog.`);
            onRefresh();
            fetchAdminData();
          } else {
            toast.error("Failed to complete record purge.");
          }
        } catch (err) {
          toast.error("Unable to delete service right now.");
        }
      },
      "Delete Service"
    );
  };

  // --- CATEGORIES & SUBCATEGORIES CRUD ---
  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCatName(category.title);
    setCatDesc(category.description || "");
    setCatImage(category.image || "");
    setIsCategoryEditModalOpen(true);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCatName("");
    setCatDesc("");
    setCatImage("");
    setIsCategoryEditModalOpen(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!catName.trim()) newErrors.catName = 'Category title is required';
    if (Object.keys(newErrors).length > 0) {
      setAdminFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setAdminFormErrors({});

    setIsSubmitting(true);
    const isEdit = !!editingCategoryId;
    try {
      const url = isEdit 
        ? `/api/category/${editingCategoryId}`
        : "/api/categories";
      const method = isEdit ? "PATCH" : "POST";
      
      const response = await fetch(
        url,
        getAdminRequestInit({
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: catName,
            image: catImage || DEFAULT_HEALTHCARE_SERVICE_IMAGE,
            description: catDesc,
            type: "service"
          })
        })
      );

      if (response.ok) {
        const newCategory = await response.json();
        triggerToast(`Category "${catName}" ${isEdit ? 'updated' : 'declared'} successfully!`);
        if (isEdit) {
          handleCancelCategoryEdit();
        } else {
          setCatName("");
          setCatDesc("");
          setCatImage("");
        }
        onRefresh();
        fetchAdminData();
      } else {
        const errorText = await response.text();
        toast.error(`Failed to submit category. ${errorText}`);
      }
    } catch (err) {
      toast.error("Failed to submit category. Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, label: string) => {
    requestConfirm(
      "Delete Category?",
      `Scrub Category "${label}"? This deletes child elements of metadata.`,
      async () => {
        try {
          const res = await fetch(`/api/category/${id}`, getAdminRequestInit({ method: "DELETE" }));
          if (res.ok) {
            triggerToast(`Category "${label}" deleted.`);
            onRefresh();
            fetchAdminData();
          } else {
            toast.error("Failed to complete action.");
          }
        } catch (err) {
          toast.error("Unable to delete category right now.");
        }
      }
    );
  };

  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!parentCatId) newErrors.parentCatId = 'Parent specialty category is required';
    if (!subName.trim()) newErrors.subName = 'Subcategory label is required';
    if (Object.keys(newErrors).length > 0) {
      setAdminFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setAdminFormErrors({});

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/subcategories/${parentCatId}`,
        getAdminRequestInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: subName, image: subImage || null })
        })
      );

      if (response.ok) {
        triggerToast(`Subcategory "${subName}" bound perfectly!`);
        setSubName("");
        setSubImage("");
        onRefresh();
        fetchAdminData();
      } else {
        toast.error("Failed to assign subcategory.");
      }
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubcategory = async (catId: string, subId: string, subName: string) => {
    requestConfirm(
      "Delete Subcategory?",
      `Delete subcategory "${subName}"?`,
      async () => {
        try {
          const res = await fetch(`/api/subcategory/${catId}/${subId}`, getAdminRequestInit({ method: "DELETE" }));
          if (res.ok) {
            triggerToast(`Specialty subcategory cleared.`);
            onRefresh();
            fetchAdminData();
          } else {
            toast.error("Delete request failed.");
          }
        } catch (err) {
          toast.error("Unable to delete subcategory right now.");
        }
      }
    );
  };


  // --- VENDORS CRUD ---
  const handleEditVendor = (vendor: any) => {
    setEditingVendorId(vendor.id);
    setVendorName(vendor.name);
    setVendorContact(vendor.contact || "");
    setVendorAddress(vendor.address || "Dubai Marina, Dubai");
    setVendorLogo(vendor.logo || "");
    setVendorCommission(vendor.commission?.toString() || "10");
    setVendorActive(vendor.active !== false);
    setVendorEmail(vendor.email || "");
    setVendorPassword("");
    setIsVendorEditModalOpen(true);
  };

  const handleCancelVendorEdit = () => {
    setEditingVendorId(null);
    setVendorName("");
    setVendorContact("");
    setVendorAddress("Dubai Marina, Dubai");
    setVendorLogo("");
    setVendorCommission("10");
    setVendorActive(true);
    setVendorEmail("");
    setVendorPassword("");
    setIsVendorEditModalOpen(false);
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!vendorName.trim()) newErrors.vendorName = 'Provider corporate name is required';
    if (Object.keys(newErrors).length > 0) {
      setAdminFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setAdminFormErrors({});

    setIsSubmitting(true);
    const isEdit = !!editingVendorId;
    try {
      const url = isEdit 
        ? `/api/vendor/${editingVendorId}`
        : "/api/vendors";
      const method = isEdit ? "PATCH" : "POST";
      
      const response = await fetch(
        url,
        getAdminRequestInit({
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: vendorName,
            contact: vendorContact,
            address: vendorAddress,
            logo: vendorLogo || null,
            commission: Number(vendorCommission),
            active: vendorActive,
            email: vendorEmail || null,
            password: vendorPassword || null
          })
        })
      );

      if (response.ok) {
        triggerToast(`Vendor "${vendorName}" ${isEdit ? 'updated' : 'committed'} successfully!`);
        handleCancelVendorEdit();
        fetchAdminData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} vendor: ${errorData.error || response.statusText}`);
      }
    } catch (err) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} vendor. Please check your connection.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    requestConfirm(
      "Delete Vendor?",
      `Sever vendor relationship with "${name}"?`,
      async () => {
        try {
          const res = await fetch(`/api/vendors/${id}`, getAdminRequestInit({ method: "DELETE" }));
          if (res.ok) {
            triggerToast(`Vendor relationship deactivated and cleared.`);
            if (selectedVendorDetailsId === id) {
              setSelectedVendorDetailsId(null);
            }
            fetchAdminData();
          } else {
            toast.error("Delete query rejected.");
          }
        } catch (err) {
          toast.error("Unable to delete vendor right now.");
        }
      }
    );
  };


  // --- SETTINGS PREFERENCES ---
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!settingsForm.siteName.trim()) newErrors.siteName = 'System brand name is required';
    if (!settingsForm.supportEmail.trim()) newErrors.supportEmail = 'Support email is required';
    if (!settingsForm.vatPercent && settingsForm.vatPercent !== 0) newErrors.vatPercent = 'VAT rate is required';
    if (Object.keys(newErrors).length > 0) {
      setAdminFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setAdminFormErrors({});
    setIsSubmitting(true);
    try {
      const payload: any = {
        siteName: settingsForm.siteName,
        vatPercent: Number(settingsForm.vatPercent),
        defaultCurrency: settingsForm.defaultCurrency,
        supportEmail: settingsForm.supportEmail,
        serviceRegions: settingsForm.serviceRegions,
        maintenanceMode: settingsForm.maintenanceMode
      };
      if (settingsForm.adminPassword.trim()) {
        payload.adminPassword = settingsForm.adminPassword.trim();
      }
      
      const response = await fetch(
        "/api/settings",
        getAdminRequestInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      );

      if (response.ok) {
        triggerToast(`Operational variables updated and persisted successfully.`);
        fetchAdminData();
      } else {
        toast.error("Database refused settings commit.");
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegionToggle = (reg: string) => {
    const exists = settingsForm.serviceRegions.includes(reg);
    if (exists) {
      setSettingsForm({
        ...settingsForm,
        serviceRegions: settingsForm.serviceRegions.filter(r => r !== reg)
      });
    } else {
      setSettingsForm({
        ...settingsForm,
        serviceRegions: [...settingsForm.serviceRegions, reg]
      });
    }
  };

  // Cancel / update booking status helper
  const handleCancelBooking = async (id: string) => {
    requestConfirm(
      "Cancel Booking?",
      "Are you sure you want to mark this scheduled customer visit as CANCELED?",
      async () => {
        try {
          const res = await fetch(`/api/booking/${id}`, getAdminRequestInit({ method: "DELETE" }));
          if (res.ok) {
            triggerToast("Calendar visit logged as canceled.");
            fetchAdminData();
          } else {
            toast.error("Unable to cancel the booking.");
          }
        } catch (err) {
          toast.error("Unable to cancel the booking right now.");
        }
      },
      "Cancel Booking"
    );
  };

  const handleViewBooking = async (booking: any) => {
    try {
      const res = await fetch(`/api/booking/${booking.id}`, getAdminRequestInit());
      if (res.ok) {
        const freshBooking = await res.json();
        setViewingBooking(freshBooking);
      } else {
        setViewingBooking(booking);
      }
    } catch {
      setViewingBooking(booking);
    }
    setIsBookingViewModalOpen(true);
  };

  const handleCloseBookingView = () => {
    setViewingBooking(null);
    setIsBookingViewModalOpen(false);
  };

  const handleUpdateEnquiryStatus = async (id: string, currentStatus: string) => {
    const targetStatus = currentStatus === "Pending Response" ? "Answered" : "Closed";
    try {
      const res = await fetch(
        `/api/enquiryStatus/${id}`,
        getAdminRequestInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetStatus })
        })
      );
      if (res.ok) {
        triggerToast(`Inquiry marked as ${targetStatus} successfully!`);
        fetchAdminData();
      }
    } catch (err) {
    }
  };

  const handleDeleteEnquiry = async (id: string) => {
    requestConfirm(
      "Delete Enquiry?",
      "Are you sure you want to delete this enquiry from records?",
      async () => {
        try {
          const res = await fetch(`/api/enquiry/${id}`, getAdminRequestInit({ method: "DELETE" }));
          if (res.ok) {
            triggerToast("Enquiry deleted.");
            fetchAdminData();
          } else {
            toast.error("Unable to delete enquiry.");
          }
        } catch (err) {
          toast.error("Unable to delete enquiry right now.");
        }
      }
    );
  };

  const handleReviewVendorChangeRequest = async (id: string, status: "approved" | "rejected", remarks?: string) => {
    setIsReviewingChangeRequest(id);
    try {
      const res = await fetch(`/api/vendorProfileChangeRequests/${id}/review`, getAdminRequestInit({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, remarks: remarks || null }),
      }));
      if (res.ok) {
        triggerToast(`Change request ${status === "approved" ? "approved" : "rejected"} successfully.`);
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`Failed: ${err.error || res.statusText}`);
      }
    } catch {
      toast.error("Unable to review change request right now.");
    } finally {
      setIsReviewingChangeRequest(null);
    }
  };

  // --- REPORT METRIC ANALYTICS CALCULATIONS ---
  const reportMetrics = useMemo(() => {
    const totalBookings = bookingsList.length;
    const completedVal = bookingsList.reduce((acc, curr) => acc + (curr.price || 0), 0);
    const completedCount = bookingsList.filter(b => b.status === "Completed").length;
    const activeCount = bookingsList.filter(b => b.status === "Active").length;
    const pendingCount = bookingsList.filter(b => b.status === "Pending" || !b.status).length;
    const cancelledCount = bookingsList.filter(b => b.status === "Canceled").length;
    const assignedCount = bookingsList.filter(b => !!b.vendorId || (b.vendorName && b.vendorName !== "Unassigned")).length;
    const unassignedCount = bookingsList.filter(b => !b.vendorId && (!b.vendorName || b.vendorName === "Unassigned")).length;
    const fulfillmentRate = totalBookings > 0 ? Math.round(((activeCount + completedCount) / totalBookings) * 100) : 0;
    const averageBookingValue = totalBookings > 0 ? Math.round(completedVal / totalBookings) : 0;
    const uniqueCustomers = new Set(bookingsList.map((b) => b.customerEmail || b.customerPhone || b.customerName).filter(Boolean)).size;
    const customerBookingCounts = bookingsList.reduce((acc, booking) => {
      const key = booking.customerEmail || booking.customerPhone || booking.customerName || "guest";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const repeatCustomerCount = (Object.values(customerBookingCounts) as number[]).filter((count) => count > 1).length;
    
    // Revenue by region
    let dubaiRev = 0;
    let shjRev = 0;
    bookingsList.forEach(b => {
      const p = Number(b.price) || 0;
      if (b.region?.toLowerCase().includes("dubai")) {
        dubaiRev += p;
      } else {
        shjRev += p;
      }
    });

    // Categories breakdown list count
    const servicesByCategoryCount: Record<string, number> = {};
    db.services.forEach(s => {
      servicesByCategoryCount[s.category] = (servicesByCategoryCount[s.category] || 0) + 1;
    });

    const revenueByService = bookingsList.reduce((acc, booking) => {
      const title = booking.serviceTitle || "Unassigned service";
      acc[title] = (acc[title] || 0) + (Number(booking.price) || 0);
      return acc;
    }, {} as Record<string, number>);
    const bookingsByService = bookingsList.reduce((acc, booking) => {
      const title = booking.serviceTitle || "Unassigned service";
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeVendorsCount = vendorsList.filter(v => v.active).length;
    const inactiveVendorsCount = vendorsList.length - activeVendorsCount;
    const userRoleCounts = usersList.reduce((acc, user) => {
      const role = user.role || "unknown";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const userRoleData = [
      { role: "Super Admin", key: "super_admin", count: userRoleCounts.super_admin || 0, color: "bg-slate-900 text-white border-slate-900" },
      { role: "Admin", count: userRoleCounts.admin || 0, color: "bg-blue-50 text-blue-700 border-blue-100" },
      { role: "Vendor", count: userRoleCounts.vendor || 0, color: "bg-purple-50 text-purple-700 border-purple-100" },
      { role: "Staff", count: userRoleCounts.staff || 0, color: "bg-amber-50 text-amber-700 border-amber-100" },
      { role: "Customer", count: userRoleCounts.customer || 0, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    ];

    // Chart data
    const bookingStatusData = [
      { name: "Completed", value: completedCount, color: "#10b981" },
      { name: "Active", value: activeCount, color: "#3b82f6" },
      { name: "Pending", value: pendingCount, color: "#f59e0b" },
      { name: "Canceled", value: cancelledCount, color: "#ef4444" }
    ];

    const revenueByRegionData = [
      { name: "Dubai", revenue: dubaiRev },
      { name: "Other Regions", revenue: shjRev }
    ];

    const categoryBreakdownData = Object.entries(servicesByCategoryCount).map(([name, count]) => ({
      name,
      count
    }));
    const serviceReportData = Object.entries(bookingsByService).map(([name, count]) => ({
      name,
      count,
      revenue: revenueByService[name] || 0,
    })).sort((a, b) => b.revenue - a.revenue);
    const vendorPerformanceData = vendorsList.map((vendor) => {
      const vendorBookings = bookingsList.filter((booking) => booking.vendorId === vendor.id || booking.vendorName === vendor.name);
      const revenue = vendorBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);
      const completed = vendorBookings.filter((booking) => booking.status === "Completed").length;
      const active = vendorBookings.filter((booking) => booking.status === "Active").length;
      return {
        id: vendor.id,
        name: vendor.name,
        type: vendor.type,
        active: vendor.active,
        bookings: vendorBookings.length,
        activeBookings: active,
        completed,
        revenue,
        completionRate: vendorBookings.length > 0 ? Math.round((completed / vendorBookings.length) * 100) : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);
    const customerReportMap = bookingsList.reduce((acc, booking) => {
      const key = booking.customerEmail || booking.customerPhone || booking.customerName || "guest";
      if (!acc[key]) {
        acc[key] = {
          name: booking.customerName || "Guest Customer",
          email: booking.customerEmail || "N/A",
          bookings: 0,
          revenue: 0,
        };
      }
      acc[key].bookings += 1;
      acc[key].revenue += Number(booking.price) || 0;
      return acc;
    }, {} as Record<string, { name: string; email: string; bookings: number; revenue: number }>);
    const customerReportData = (Object.values(customerReportMap) as Array<{ name: string; email: string; bookings: number; revenue: number }>)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
    const monthlySalesData = bookingsList.reduce((acc, booking) => {
      const month = String(booking.date || booking.createdAt || "").slice(0, 7) || "Unscheduled";
      acc[month] = (acc[month] || 0) + (Number(booking.price) || 0);
      return acc;
    }, {} as Record<string, number>);
    const salesTrendData = Object.entries(monthlySalesData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    return {
      totalBookings,
      completedVal,
      averageBookingValue,
      uniqueCustomers,
      repeatCustomerCount,
      completedCount,
      activeCount,
      pendingCount,
      cancelledCount,
      assignedCount,
      unassignedCount,
      fulfillmentRate,
      dubaiRev,
      shjRev,
      activeVendorsCount,
      inactiveVendorsCount,
      userRoleCounts,
      userRoleData,
      servicesByCategoryCount,
      bookingStatusData,
      revenueByRegionData,
      categoryBreakdownData,
      serviceReportData,
      vendorPerformanceData,
      customerReportData,
      salesTrendData
    };
  }, [bookingsList, vendorsList, usersList, db.services]);

  const dateFilteredBookings = useMemo(() => {
    if (reportDateRange === "all" && !reportStartDate && !reportEndDate) {
      return bookingsList;
    }

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (reportStartDate) {
      startDate = new Date(reportStartDate);
    } else if (reportDateRange !== "all") {
      const daysMap = { today: 0, "7d": 7, "30d": 30, "90d": 90 };
      const days = daysMap[reportDateRange as keyof typeof daysMap];
      if (days !== undefined) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
      }
    }

    if (reportEndDate) {
      endDate = new Date(reportEndDate);
      endDate.setHours(23, 59, 59, 999);
    }

    return bookingsList.filter((booking) => {
      const bookingDate = new Date(booking.date || booking.createdAt || "");
      if (startDate && bookingDate < startDate) return false;
      if (endDate && bookingDate > endDate) return false;
      return true;
    });
  }, [bookingsList, reportDateRange, reportStartDate, reportEndDate]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          const escaped = String(value ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportBookings = () => {
    const exportData = dateFilteredBookings.map((b) => ({
      "Booking ID": b.id,
      "Customer Name": b.customerName,
      "Customer Email": b.customerEmail,
      "Customer Phone": b.customerPhone,
      "Service": b.serviceTitle,
      "Vendor": b.vendorName,
      "Price": b.price,
      "Date": b.date,
      "Time Slot": b.timeSlot,
      "Region": b.region,
      "Status": b.status,
      "Payment Status": b.paymentStatus,
      "Created At": b.createdAt,
    }));
    exportToCSV(exportData, "medziva_bookings");
  };

  const handleExportVendors = () => {
    const exportData = reportMetrics.vendorPerformanceData.map((v) => ({
      "Vendor ID": v.id,
      "Vendor Name": v.name,
      "Type": v.type,
      "Active": v.active ? "Yes" : "No",
      "Total Bookings": v.bookings,
      "Completed": v.completed,
      "Active Bookings": v.activeBookings,
      "Revenue (AED)": v.revenue,
      "Completion Rate (%)": v.completionRate,
    }));
    exportToCSV(exportData, "medziva_vendors");
  };

  const handleExportCustomers = () => {
    const exportData = reportMetrics.customerReportData.map((c) => ({
      "Customer Name": c.name,
      "Email": c.email,
      "Total Bookings": c.bookings,
      "Total Revenue (AED)": c.revenue,
    }));
    exportToCSV(exportData, "medziva_customers");
  };


  if (isSessionChecking) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4 text-slate-500 text-xs">
        Restoring secure admin session...
      </div>
    );
  }

  // --- LOGIN PAGE RENDER (WALL) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4 sm:p-6 text-left">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Accent decoration rings */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -ml-12 -mb-12"></div>

          <div className="relative text-center space-y-6">
            <div className="w-20 h-20 bg-white mx-auto rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm p-3">
              <img src="/newlogo.png" alt="MedZiva Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 block mb-1">Authenticated Domain</span>
              <h2 className="text-2xl font-black text-blue-950">MedZiva Backend Gate</h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Authorized clinical personnel only. Enter ERP login credentials to manage inventory, catalog categories, active providers and live audit logs.
              </p>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(submitAdminLogin)} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Admin User ID <span className="text-red-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. admin"
                    {...register("username", {
                      required: "Username is required",
                    })}
                    className="w-full text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                  />
                </div>
                {errors.username && (
                  <p className="text-[10px] font-semibold text-red-600">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Access Passphrase <span className="text-red-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    className="w-full text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                  />
                </div>
                {errors.password && (
                  <p className="text-[10px] font-semibold text-red-600">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>AUTHENTICATE OPERATOR</span>
                  </>
                )}
              </button>
            </form>

            <SocialAuthButtons
              disabled={authLoading}
              googlePath="/api/auth/google/admin"
              onSuccess={handleAdminSocialLogin}
              onError={handleAdminSocialError}
            />

            </div>
          </div>

        </div>
    );
  }

  // --- COMPILER WORKFLOW FOR RETAIL MANAGER ACTIVE PORTAL ---
  return (
    <div id="admin-erp-portal" className="min-h-screen bg-slate-50 flex text-left">
      
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/newlogo.png" alt="Logo" className="h-8 w-auto" />
          <span className="text-sm font-black text-blue-950">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <div className={`w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-40 transition-transform duration-300 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-0">
              <img src="/newlogo.png" alt="Logo" className="h-16 w-auto" />
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-lg font-black text-blue-950 tracking-tight">Admin Console</h1>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "bookings", label: "Bookings", icon: Calendar },
              { id: "pendingPayments", label: "Pending Payments", icon: CreditCard },
              { id: "services", label: "Services", icon: HeartPulse },
              { id: "enquiries", label: "Enquiries", icon: Mail },
              { id: "vendorChangeRequests", label: "Vendor Change Requests", icon: FileText },
              { id: "categories", label: "Categories", icon: Layers },
              { id: "subcategories", label: "Subcategories", icon: Sliders },
              { id: "vendor", label: "Vendor Partners", icon: Building2 },
              { id: "vendorServices", label: "Vendor Services", icon: Stethoscope },
              { id: "sla", label: "Vendor Performance", icon: Activity },
              { id: "customRequests", label: "Custom Service Requests", icon: FileText },
              { id: "users", label: "Users", icon: Users },
              { id: "reports", label: "Reports & Analytics", icon: TrendingUp },
              { id: "roles", label: "Roles & Permissions", icon: ShieldAlert },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((pane) => {
              const isSelected = activePane === pane.id;
              return (
                <button
                  key={pane.id}
                  onClick={() => {
                    setActivePane(pane.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-xs sm:text-[13px] font-extrabold rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-emerald-50 text-blue-950 border border-emerald-200" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <pane.icon className={`w-4 h-4 ${isSelected ? 'text-medical-green' : 'text-slate-400'}`} />
                  <span>{pane.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <button 
            onClick={() => {
              fetchAdminData();
              onRefresh();
              triggerToast("Consolidated server synchronizations verified.");
            }}
            disabled={isLoadingData}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-950 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Backup Data</span>
          </button>

          <button 
            onClick={() => setPendingConfirm({
              title: "Confirm Logout",
              message: "Are you sure you want to log out of your account?",
              confirmLabel: "Logout",
              onConfirm: handleLogout
            })}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 cursor-pointer text-rose-700 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all border border-rose-100"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        
        {/* 1. PORTAL HEADER BANNER - Only show on Dashboard */}
        {activePane === "dashboard" && (
          <div className="border-b border-slate-200 pb-5 mb-8">
            <div>
              <h1 className="text-2xl font-black text-blue-950 tracking-tight flex items-center gap-2">
                <span>Dynamic Administration Console</span>
              </h1>
              <p className="text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
                Dynamic express data integration. Oversee live service rosters, subcategories binding, clinics metrics reporting, and platform level settings instantly.
              </p>
            </div>
          </div>
        )}

        {/* 2. DASHBOARD STAT CARDS */}
        {activePane === "dashboard" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {[
              { label: "Total Bookings", value: reportMetrics.totalBookings, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Pending", value: reportMetrics.pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Confirmed", value: reportMetrics.activeCount, icon: CheckCircle2, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Completed", value: reportMetrics.completedCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Cancelled", value: reportMetrics.cancelledCount, icon: X, color: "text-red-600", bg: "bg-red-50" },
              { label: "Active Vendors", value: reportMetrics.activeVendorsCount, icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
              { label: "Total Customers", value: reportMetrics.uniqueCustomers, icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
              { label: "New Enquiries", value: enquiriesList.filter((e: any) => e.status === "Pending Response").length, icon: Mail, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`${card.bg} ${card.color} p-1.5 rounded-lg`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{card.label}</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950">{card.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. WORKFLOW FOR THE VISUAL MODULE SPANS */}
        <div className="min-h-[400px]">

        {/* ---- MODULE A: RECENT ACTIVITY ---- */}
        {activePane === "dashboard" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-950" />
                <h3 className="font-extrabold text-blue-950 text-sm">Recent Activity</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">Latest bookings & enquiries</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {[
                ...bookingsList.slice(-10).reverse().map((b: any) => ({
                  id: b.id,
                  type: "booking" as const,
                  title: b.customerName || "Customer",
                  subtitle: b.serviceTitle || "Service",
                  detail: `${b.price || 0} ${settingsData.defaultCurrency || "AED"}`,
                  status: b.status || "Pending",
                  date: b.date || "",
                })),
                ...enquiriesList.filter((e: any) => e.status === "Pending Response").slice(-5).reverse().map((e: any) => ({
                  id: e.id || e._id,
                  type: "enquiry" as const,
                  title: e.customerName || e.name || "Customer",
                  subtitle: e.subject || e.service || "Enquiry",
                  detail: e.message?.slice(0, 60) || "",
                  status: "New",
                  date: e.createdAt || "",
                })),
              ]
                .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                .slice(0, 12)
                .map((item, i) => (
                  <div key={`${item.type}-${item.id}-${i}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      item.type === "enquiry" ? "bg-orange-400" :
                      item.status === "Completed" ? "bg-emerald-400" :
                      item.status === "Active" ? "bg-blue-400" :
                      item.status === "Canceled" ? "bg-red-400" : "bg-amber-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-blue-950 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                      item.type === "enquiry" ? "bg-orange-50 text-orange-600" :
                      item.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
                      item.status === "Active" ? "bg-blue-50 text-blue-600" :
                      item.status === "Canceled" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {item.type === "enquiry" ? "Enquiry" : item.status}
                    </span>
                    <span className="text-[10px] text-slate-300 font-semibold shrink-0 w-16 text-right">{item.date}</span>
                  </div>
                ))}
              {bookingsList.length === 0 && enquiriesList.length === 0 && (
                <div className="px-5 py-10 text-center text-slate-400 text-xs">No recent activity yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ---- MODULE B: BOOKINGS ---- */}
        {activePane === "bookings" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Real-time Clinical Bookings List</h3>
                <p className="text-[10.5px] text-slate-400">Scheduled visits log showing client details, pricing, and triage state.</p>
              </div>
              <span className="text-[10px] uppercase font-black bg-emerald-50 text-medical-green py-0.5 px-2 rounded-full">
                Live Stream
              </span>
            </div>

            {/* Filter Controls */}
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Search bookings..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value as "all" | "Pending" | "Active" | "Completed" | "Canceled")}
                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No bookings match your filter.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredBookings.map((book) => (
                  <div key={book.id} className="p-4 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 hover:bg-slate-50 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-950">{book.customerName}</span>
                        <span className="text-[10px] text-slate-400">({book.region})</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          book.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          book.status === "Active" ? "bg-blue-50 text-blue-700" :
                          book.status === "Canceled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {book.status || "Pending"}
                        </span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getPaymentBadgeClass(book.paymentStatus)}`}>
                          {book.paymentStatus === "Paid" ? "Paid" : `Payment ${book.paymentStatus || "Unpaid"}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{book.serviceTitle}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-semibold pt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-350" /> {book.date} {book.timeSlot}</span>
                        <span>Provider: <strong className="text-slate-500">{book.vendorName}</strong></span>
                        {book.customerEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-350" /> {book.customerEmail}</span>}
                        {(book.paymentTransactionUtr || book.paymentAppUtr) && (
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 text-slate-350" />
                            {book.paymentTransactionUtr || book.paymentAppUtr}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold">TOTAL PRICE</span>
                        <span className="text-xs font-black text-blue-950">{book.price} {settingsData.defaultCurrency || 'AED'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewBooking(book)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 border border-transparent hover:border-slate-150 rounded-xl transition-all cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {book.status !== "Canceled" && (
                          <button
                            onClick={() => handleCancelBooking(book.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 border border-transparent hover:border-slate-150 rounded-xl transition-all cursor-pointer"
                            title="Cancel Visit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- MODULE C: SERVICES MODULE ---- */}
        {activePane === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Create/Edit Form */}
            <form onSubmit={handleCreateService} className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  <h3 className="font-extrabold text-blue-950 text-sm">
                    {editingServiceId ? "Edit Healthcare Service" : "Provision At-Home Healthcare Service"}
                  </h3>
                </div>
                {editingServiceId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Service Title <span className="text-red-600">*</span></label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Elderly Daily Companionship" 
                    value={srvTitle} 
                    onChange={e => {
                      setSrvTitle(e.target.value);
                      if (!editingServiceId) setSrvSlug(slugifyServiceTitle(e.target.value));
                    }} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-medical-green"
                  />
                  {adminFormErrors.srvTitle && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvTitle}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Duration <span className="text-red-600">*</span></label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. 1 Hour" 
                    value={srvDuration} 
                    onChange={e => setSrvDuration(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Slug</label>
                  <input
                    type="text"
                    placeholder="doctor-at-home"
                    value={srvSlug}
                    onChange={e => setSrvSlug(slugifyServiceTitle(e.target.value))}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Status</label>
                  <select
                    value={srvStatus}
                    onChange={e => {
                      const nextStatus = e.target.value as "draft" | "active" | "inactive";
                      setSrvStatus(nextStatus);
                      setSrvActive(nextStatus === "active");
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Sale Price (AED) <span className="text-red-600">*</span></label>
                  <input 
                    required 
                    type="number" 
                    placeholder="e.g. 250" 
                    value={srvPrice} 
                    onChange={e => {
                      setSrvPrice(e.target.value);
                      if (srvVendors.length > 0) {
                        const updated = [...srvVendors];
                        updated[0].price = Number(e.target.value) || 0;
                        setSrvVendors(updated);
                      }
                    }} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  {adminFormErrors.srvPrice && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvPrice}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Original Price (AED)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300"
                    value={srvOriginalPrice}
                    onChange={e => setSrvOriginalPrice(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Parent Department</label>
                  <select 
                    value={srvCategory} 
                    onChange={e => {
                      setSrvCategory(e.target.value);
                      setSrvSubcategory("");
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList.filter(c => c.type === "service").map(c => (
                      <option key={c.id} value={c.slug}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Estimated Visit Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 45-60 mins"
                    value={srvEstimatedVisitTime}
                    onChange={e => setSrvEstimatedVisitTime(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Subcategory Specialty Option</label>
                  <select 
                    disabled={!srvCategory}
                    value={srvSubcategory} 
                    onChange={e => setSrvSubcategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-405"
                  >
                    <option value="">-- Optional Bind Subcategory --</option>
                    {filteredSubcategoriesForService.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Image Banner URL</label>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..." 
                    value={srvImage} 
                    onChange={e => setSrvImage(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleServiceImageUpload(e.target.files?.[0])} />
                  </label>
                </div>
                {srvImage && <img src={srvImage} alt="Service preview" className="mt-2 h-24 w-full object-cover rounded-lg border border-slate-150" />}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Card/listing summary"
                  value={srvShortDesc}
                  onChange={e => setSrvShortDesc(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Clinical Narrative Details <span className="text-red-600">*</span></label>
                <textarea 
                  required
                  rows={2} 
                  placeholder="Enter medical indications, hygiene instructions, nurse certifications..." 
                  value={srvDesc} 
                  onChange={e => setSrvDesc(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
                {adminFormErrors.srvDesc && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvDesc}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Full Description</label>
                  <textarea rows={3} value={srvFullDesc} onChange={e => setSrvFullDesc(e.target.value)} placeholder="Detail page copy" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">What Is Included</label>
                  <textarea rows={3} value={srvInclusions} onChange={e => setSrvInclusions(e.target.value)} placeholder="One item per line" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Preparation Instructions</label>
                  <textarea rows={3} value={srvPreparation} onChange={e => setSrvPreparation(e.target.value)} placeholder="Before visit/test instructions" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Who Is It For</label>
                  <textarea rows={2} value={srvWhoFor} onChange={e => setSrvWhoFor(e.target.value)} placeholder="Target patient/customer" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Availability</label>
                  <input type="text" value={srvAvailability} onChange={e => setSrvAvailability(e.target.value)} placeholder="Daily, 9 AM - 9 PM" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Service Location</label>
                  <select value={srvLocation} onChange={e => setSrvLocation(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none">
                    <option value="at-home">At Home</option>
                    <option value="clinic">Clinic</option>
                    <option value="hotel">Hotel</option>
                    <option value="home-hotel">Home / Hotel</option>
                    <option value="all">All Locations</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Display Priority</label>
                  <input type="number" value={srvDisplayPriority} onChange={e => setSrvDisplayPriority(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Tags</label>
                  <input type="text" value={srvTags} onChange={e => setSrvTags(e.target.value)} placeholder="elderly care, urgent, female nurse" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">SEO Title</label>
                  <input type="text" value={srvSeoTitle} onChange={e => setSrvSeoTitle(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">SEO Meta Description</label>
                  <input type="text" value={srvSeoDescription} onChange={e => setSrvSeoDescription(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={srvActive} onChange={e => setSrvActive(e.target.checked)} className="w-4 h-4 text-emerald-600 accent-emerald-500" />
                  Active on website
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={srvVisitFeeIncluded} onChange={e => setSrvVisitFeeIncluded(e.target.checked)} className="w-4 h-4 text-emerald-600 accent-emerald-500" />
                  Home visit included
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  id="srvPopular" 
                  checked={srvPopular} 
                  onChange={e => setSrvPopular(e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 accent-emerald-500"
                />
                  Feature prominently on Home Carousel
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-medical-green hover:bg-emerald-600 font-extrabold py-3.5 text-white rounded-xl text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "STORING CLINICAL SERVICE..." : (editingServiceId ? "UPDATE CLINICAL VISIT SERVICE" : "PUBLISH CLINICAL VISIT SERVICE")}</span>
              </button>

            </form>

            {/* Right: Existing List */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
              <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between items-center">
                <h4 className="font-extrabold text-blue-950 text-sm">Service Records</h4>
                <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  {filteredServiceRecords.length} / {uniqueServiceCount} items
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                <input
                  type="search"
                  value={serviceSearch}
                  onChange={e => setServiceSearch(e.target.value)}
                  placeholder="Search services..."
                  className="sm:col-span-3 w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                />
                <select value={serviceCategoryFilter} onChange={e => setServiceCategoryFilter(e.target.value)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg">
                  <option value="all">All departments</option>
                  {categoriesList.filter(c => c.type === "service").map(c => (
                    <option key={c.id} value={c.slug}>{c.title}</option>
                  ))}
                </select>
                <select value={serviceStatusFilter} onChange={e => setServiceStatusFilter(e.target.value as any)} className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg">
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                  <option value="featured">Featured</option>
                </select>
                <button type="button" onClick={() => { setServiceSearch(""); setServiceCategoryFilter("all"); setServiceStatusFilter("all"); }} className="text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50">
                  Clear
                </button>
              </div>

              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {filteredServiceRecords.map(srv => {
                  const isVisible = srv.active !== false && (srv.status || "active") === "active";
                  return (
                    <div key={srv.id} className="p-3 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img src={getServiceRecordImage(srv)} className="w-10 h-10 object-cover bg-white border border-slate-150 rounded-lg shrink-0" alt="srv" referrerPolicy="no-referrer" />
                        <div className="text-left overflow-hidden">
                          <h4 className="text-xs font-extrabold text-blue-950 truncate leading-snug">{srv.title}</h4>
                          <span className="text-[10px] text-slate-400 block truncate font-medium">Department: {srv.category} • Cost: {srv.price} AED</span>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded inline-block mt-0.5 mr-1 ${
                            isVisible ? "bg-emerald-50 text-emerald-700" :
                            srv.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                          }`}>
                            {srv.status === "draft" ? "Draft" : isVisible ? "Active" : "Inactive"}
                          </span>
                          {srv.popular && (
                            <span className="text-[8px] bg-amber-50 text-amber-700 font-extrabold px-1.5 py-0.2 rounded inline-block mt-0.5">
                              ★ Featured
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewingService(srv)}
                          className="text-slate-500 hover:text-slate-700 p-2 hover:bg-white border border-transparent rounded-lg transition-all cursor-pointer"
                          title="Preview Service"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleEditService(srv)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 border border-transparent rounded-lg transition-all cursor-pointer"
                          title="Edit Visit Service"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDuplicateService(srv)}
                          className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 border border-transparent rounded-lg transition-all cursor-pointer"
                          title="Duplicate Service"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleServicePopular(srv)}
                          className={`p-2 border border-transparent rounded-lg transition-all cursor-pointer ${srv.popular ? "text-amber-500 hover:bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"}`}
                          title={srv.popular ? "Remove Popular" : "Mark as Popular"}
                        >
                          <Star className={`w-3.5 h-3.5 ${srv.popular ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => confirmToggleServiceActive(srv)}
                          className={`p-2 border border-transparent rounded-lg transition-all cursor-pointer ${isVisible ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-500 hover:bg-slate-100"}`}
                          title={isVisible ? "Deactivate Service" : "Activate Service"}
                        >
                          {isVisible ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteService(srv.id, srv.title)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-rose-50 border border-transparent rounded-lg transition-all cursor-pointer"
                          title="Delete Visit Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredServiceRecords.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-bold">
                    No services match the current filters.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---- MODULE C: CATEGORIES ---- */}
        {activePane === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Creator */}
            <form onSubmit={handleCreateCategory} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="font-extrabold text-blue-950 text-sm">Add New Core Specialty Category</h4>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Category Title <span className="text-red-600">*</span></label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Speech Pathology" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
                {adminFormErrors.catName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.catName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Short description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Certified physical mobilizers and speech therapists..." 
                  value={catDesc} 
                  onChange={e => setCatDesc(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase block">Illustration Asset URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  value={catImage} 
                  onChange={e => setCatImage(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-950 hover:bg-blue-900 font-bold py-3 text-white rounded-xl text-xs tracking-wider transition-all text-center"
              >
                PROVISION CORE SPECIALTY
              </button>
            </form>

            {/* Right: List */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <h4 className="font-extrabold text-blue-950 text-sm">Core Specialties Registry</h4>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {categoriesList.length} total
                </span>
              </div>
              
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {categoriesList.length === 0 ? (
                  <div className="py-12 text-center">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">No categories yet</p>
                    <p className="text-slate-300 text-[10px] mt-1">Use the form to create your first category.</p>
                  </div>
                ) : (
                  categoriesList.map(c => (
                    <div key={c.id} className="p-3 border border-slate-150 rounded-xl flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50">
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <img src={c.image} className="w-11 h-11 object-cover rounded-lg bg-white border border-slate-150 shrink-0" alt="cat" referrerPolicy="no-referrer" />
                        <div className="text-left overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-blue-950 text-xs">{c.title}</h5>
                            <span className="text-[9px] bg-purple-50 text-purple-600 font-bold px-1.5 py-0.2 rounded">
                              {c.subcategories?.length || 0} subs
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.description || "No narrative attached."}</p>
                          <span className="text-[9px] bg-slate-150 text-slate-700 font-extrabold px-1.5 py-0.2 rounded inline-block mt-1">
                            {c.type === "product" ? "Product & Rental Lease" : "At-Home Care Visit"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditCategory(c)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 border border-transparent rounded-lg shrink-0 transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(c.id, c.title)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-rose-50 border border-transparent rounded-lg shrink-0 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---- MODULE D: SUBCATEGORIES ---- */}
        {activePane === "subcategories" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Form */}
            <form onSubmit={handleCreateSubcategory} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <h4 className="font-extrabold text-blue-950 text-sm">Bind Sub-Specialty to Parent</h4>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Parent Specialty Category <span className="text-red-600">*</span></label>
                <select 
                  required
                  value={parentCatId} 
                  onChange={e => setParentCatId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="">-- Choose Category --</option>
                  {categoriesList.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.type || "service"})</option>
                  ))}
                </select>
                {adminFormErrors.parentCatId && <p className="text-red-600 text-xs mt-1">{adminFormErrors.parentCatId}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Subcategory Label <span className="text-red-600">*</span></label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. IV Hydration &amp; Detox Drops" 
                  value={subName} 
                  onChange={e => setSubName(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
                {adminFormErrors.subName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.subName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Image URL <span className="text-slate-300">(optional)</span></label>
                <input 
                  type="text" 
                  placeholder="https://example.com/image.jpg" 
                  value={subImage} 
                  onChange={e => setSubImage(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
                {subImage && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-100 h-20 bg-slate-50 flex items-center justify-center">
                    <img src={subImage} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-950 hover:bg-blue-900 font-bold py-3 text-white rounded-xl text-xs tracking-wider transition-all text-center cursor-pointer"
              >
                BIND SUB-SPECIALTY SPECIALTIES
              </button>
            </form>

            {/* Right: Grouped Lists */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-blue-950 text-sm">All Categories & Subcategories</h4>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {categoriesList.length} categories · {categoriesList.reduce((sum: number, cat: any) => sum + (cat.subcategories?.length || 0), 0)} subcategories
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {categoriesList.length === 0 ? (
                  <div className="py-12 text-center">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">No categories found</p>
                    <p className="text-slate-300 text-[10px] mt-1">Create a category first using the form.</p>
                  </div>
                ) : (
                  categoriesList.map(cat => {
                    const subs = cat.subcategories || [];
                    return (
                      <div key={cat.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img src={cat.image} className="w-7 h-7 object-cover rounded-md bg-white border border-slate-150 shrink-0" alt="" referrerPolicy="no-referrer" />
                            <span className="font-extrabold text-blue-950 text-xs">{cat.title}</span>
                            <span className="text-[9px] bg-slate-150 text-slate-600 font-bold px-1.5 py-0.2 rounded">{cat.type || "service"}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">{subs.length} sub{subs.length !== 1 ? "s" : ""}</span>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-[10px] text-slate-300 italic pl-9">No subcategories yet</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                            {subs.map((sub: any) => (
                              <div key={sub.id} className="bg-white p-2 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  {sub.image ? (
                                    <img src={sub.image} alt="" className="w-6 h-6 rounded object-cover border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                      <ImageIcon className="w-3 h-3 text-slate-400" />
                                    </div>
                                  )}
                                  <span className="font-bold text-slate-700 truncate">{sub.title}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteSubcategory(cat.id, sub.id, sub.title)}
                                  className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-50 shrink-0"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* ---- MODULE E: VENDOR PARTNERS ---- */}
        {activePane === "vendor" && !selectedVendorDetailsId && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Register New Clinic/Pharmacy */}
            <form onSubmit={handleCreateVendor} className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-blue-950 text-sm">Register Licensed Vendor Partner</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Provider Corporate Name <span className="text-red-600">*</span></label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. NMC Clinical Alliance" 
                  value={vendorName} 
                  onChange={e => setVendorName(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
                {adminFormErrors.vendorName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.vendorName}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Primary Contact Number</label>
                <PhoneInput
                  value={vendorContact}
                  onChange={setVendorContact}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Commission Rate (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={vendorCommission} 
                  onChange={e => setVendorCommission(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Operational Hub Base Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Al Barsha Heights, Dubai" 
                  value={vendorAddress} 
                  onChange={e => setVendorAddress(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Logo URL</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://example.com/logo.png" 
                  value={vendorLogo} 
                  onChange={e => setVendorLogo(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Email ID <span className="text-red-600">*</span></label>
                <input 
                  required
                  type="email" 
                  placeholder="e.g. vendor@company.com" 
                  value={vendorEmail} 
                  onChange={e => setVendorEmail(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Password <span className="text-red-600">*</span></label>
                <input 
                  required
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={vendorPassword} 
                  onChange={e => setVendorPassword(e.target.value)} 
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="vendorActive" 
                  checked={vendorActive} 
                  onChange={e => setVendorActive(e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 accent-emerald-500"
                />
                <label htmlFor="vendorActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Approved &amp; Authorized to accept jobs immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-medical-green hover:bg-emerald-600 font-extrabold py-3 text-white rounded-xl text-xs tracking-wider transition-all shadow-md text-center cursor-pointer disabled:bg-slate-400"
              >
                COMMIT PARTNER TO ERP LEDGER
              </button>

            </form>

            {/* Right Column: Dynamic Status Ledger */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                <h4 className="font-extrabold text-blue-950 text-sm">Approved Partner System Register</h4>
                <span className="text-[10px] bg-slate-50 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  {filteredVendors.length} Partners
                </span>
              </div>

              {/* Filter Controls */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value as "all" | "active" | "inactive")}
                  className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {filteredVendors.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No vendors match your filter.</div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredVendors.map((v) => (
                    <div key={v.id} className="p-3 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors">
                      <button type="button" onClick={() => handleOpenVendorDetails(v)} className="overflow-hidden space-y-0.5 text-left flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-blue-950 truncate block">{v.name}</span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full ${
                            v.active ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          }`}>
                            {v.active ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-semibold">{v.type} • Contact: {v.contact || 'No telephone link'}</p>
                        <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400">
                          <span className="font-bold">☆ Rating: {v.rating || '5.0'}</span>
                          <span>• Hub: {v.address}</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleOpenVendorDetails(v)}
                          className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-emerald-50 border border-transparent rounded-lg shrink-0 transition-all cursor-pointer"
                          title="View Vendor Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleEditVendor(v)}
                          className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 border border-transparent rounded-lg shrink-0 transition-all cursor-pointer"
                          title="Edit Vendor"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteVendor(v.id, v.name)}
                          className="text-red-500 hover:text-red-750 p-2 hover:bg-rose-50 rounded-lg transition-all"
                          title="Sever Corporate Contract"
                        >
                          <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ---- MODULE E1: VENDOR PARTNER DETAILS ---- */}
        {activePane === "vendor" && selectedVendorDetails && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden">
              <div className="bg-blue-950 px-5 sm:px-7 py-5 text-white">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-20 h-20 rounded-2xl bg-white text-blue-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
                      {selectedVendorDetails.name?.slice(0, 2).toUpperCase() || "VP"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200">Vendor Partner Details</span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full ${
                          selectedVendorDetails.active ? "bg-emerald-400/15 text-emerald-100 border border-emerald-300/30" : "bg-rose-400/15 text-rose-100 border border-rose-300/30"
                        }`}>
                          {selectedVendorDetails.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate">{selectedVendorDetails.name}</h2>
                      <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-black">
                        <span className="rounded-lg bg-white/10 px-2.5 py-1">ID {selectedVendorDetails.id}</span>
                        <span className="rounded-lg bg-white/10 px-2.5 py-1">{selectedVendorDetails.type || "Provider"}</span>
                        <span className="rounded-lg bg-white/10 px-2.5 py-1">Registered {String(selectedVendorDetails.createdAt || "N/A").slice(0, 10)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleExportVendorCsv} className="px-3 py-2 rounded-lg bg-white text-blue-950 text-[10px] font-black hover:bg-emerald-50">Export Excel</button>
                    <button type="button" onClick={() => window.print()} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-black hover:bg-white/15">Export PDF</button>
                    <button type="button" onClick={() => triggerToast(`Audit log opened for ${selectedVendorDetails.name}.`)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-[10px] font-black hover:bg-white/15">Audit Log</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:p-6">
                <div className="rounded-2xl bg-slate-50 border border-slate-150 p-4 text-xs">
                  <h4 className="font-black text-blue-950 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" /> Contact Information</h4>
                  <div className="space-y-2">
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Contact Person:</span> {selectedVendorUser?.fullName || selectedVendorDetails.name}</p>
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Mobile:</span> {selectedVendorDetails.contact || selectedVendorUser?.phone || "N/A"}</p>
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Email:</span> {selectedVendorDetails.email || selectedVendorUser?.email || "N/A"}</p>
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Address:</span> {selectedVendorDetails.address || "N/A"}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-150 p-4 text-xs">
                  <h4 className="font-black text-blue-950 mb-3 flex items-center gap-2"><Stethoscope className="w-4 h-4 text-emerald-600" /> Service Information</h4>
                  <div className="space-y-2">
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Services Offered:</span> {enabledVendorServices.length || selectedVendorServiceTitles.length}</p>
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Coverage Areas:</span> Dubai, Sharjah</p>
                    <p className="text-slate-500"><span className="font-bold text-slate-700">Operating Hours:</span> 24/7 dispatch window</p>
                  </div>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
              {[
                { label: "Today's Bookings", value: vendorTodayBookings.length, icon: Calendar, trend: "+live" },
                { label: "Today's Revenue", value: `${vendorTodayRevenue} AED`, icon: DollarSign, trend: "+today" },
                { label: "Total Bookings", value: selectedVendorBookings.length, icon: FileText, trend: "+all" },
                { label: "Total Revenue", value: `${vendorGrossRevenue} AED`, icon: TrendingUp, trend: "+gross" },
                { label: "Active Services", value: enabledVendorServices.length, icon: Stethoscope, trend: "+enabled" },
                { label: "Pending Requests", value: selectedVendorAvailableRequests.length, icon: Clock, trend: "queue" },
                { label: "Completed Orders", value: vendorCompletedBookings.length, icon: CheckCircle2, trend: "done" },
                { label: "Customer Rating", value: vendorAverageRating, icon: CheckCircle, trend: "avg" },
              ].map((card) => (
                <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <card.icon className="w-4 h-4 text-emerald-600" />
                    </span>
                    <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">{card.trend}</span>
                  </div>
                  <div className="text-lg font-black text-blue-950 truncate">{card.value}</div>
                  <div className="text-[9px] uppercase font-black text-slate-400 leading-tight mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xs">
              <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-5">
                {[
                  { id: "profile", label: "Vendor Profile" },
                  { id: "requests", label: "Service Requests" },
                  { id: "history", label: "Booking History" },
                  { id: "payments", label: "Payment History" },
                  { id: "commissions", label: "Commission History" },
                  { id: "reviews", label: "Reviews & Ratings" },
                  { id: "documents", label: "Documents" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVendorDetailsTab(tab.id as any)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase ${
                      vendorDetailsTab === tab.id ? "bg-blue-950 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {vendorDetailsTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                  {[
                    ["Business Information", [`Name: ${selectedVendorDetails.name}`, `Type: ${selectedVendorDetails.type || "Provider"}`, `Status: ${selectedVendorDetails.active ? "Active" : "Inactive"}`]],
                    ["Registration Details", [`Vendor ID: ${selectedVendorDetails.id}`, `Registered: ${String(selectedVendorDetails.createdAt || "N/A").slice(0, 10)}`, `Updated: ${String(selectedVendorDetails.updatedAt || "N/A").slice(0, 10)}`]],
                    ["GST Information", ["GSTIN: Pending vendor submission", "Tax Category: Healthcare Services", "Verification: Pending"]],
                    ["Bank Details", ["Bank: Pending secure verification", `Net Payable: ${vendorNetPayable} AED`, `Commission: ${vendorCommissionRate}%`]],
                    ["Coverage Locations", ["Dubai", "Sharjah", selectedVendorDetails.address || "Primary operating hub"]],
                    ["Operating Hours", ["24/7 dispatch availability", "Emergency response enabled", "Admin configurable shift windows"]],
                    ["Enabled Services", enabledVendorServices.length ? enabledVendorServices.map((service) => service.title) : ["No enabled services loaded"]],
                    ["Internal Notes", ["Vendor monitored through admin partner dashboard.", "Document and settlement workflows ready for persistence."]],
                  ].map(([title, rows]) => (
                    <div key={String(title)} className="rounded-2xl border border-slate-150 bg-slate-50 p-4">
                      <h4 className="font-black text-blue-950 mb-3">{String(title)}</h4>
                      <div className="space-y-1.5">
                        {(rows as string[]).map((row) => <p key={row} className="font-bold text-slate-500">{row}</p>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(vendorDetailsTab === "requests" || vendorDetailsTab === "history") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input value={vendorDetailsSearch} onChange={(event) => setVendorDetailsSearch(event.target.value)} placeholder="Search request, customer, service..." className="md:col-span-2 text-xs p-3 border border-slate-200 rounded-xl" />
                    <select value={vendorDetailsServiceFilter} onChange={(event) => setVendorDetailsServiceFilter(event.target.value)} className="text-xs p-3 border border-slate-200 rounded-xl bg-white">
                      <option value="all">All Services</option>
                      {selectedVendorServiceTitles.map((service) => <option key={service} value={service}>{service}</option>)}
                    </select>
                    <select value={vendorDetailsStatusFilter} onChange={(event) => setVendorDetailsStatusFilter(event.target.value)} className="text-xs p-3 border border-slate-200 rounded-xl bg-white">
                      <option value="all">All Status</option>
                      {["Pending", "Active", "Completed", "Canceled"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-xs">
                      <thead className="text-[10px] uppercase text-slate-400">
                        <tr>
                          {(vendorDetailsTab === "requests"
                            ? ["Request ID", "Customer Name", "Service", "Booking Date", "Location", "Status", "Assigned Staff", "Actions"]
                            : ["Booking ID", "Customer", "Service", "Date", "Amount", "Status", "Completion Date"]
                          ).map((head) => <th key={head} className="text-left py-3 border-b border-slate-100">{head}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {(vendorDetailsTab === "requests" ? filteredVendorRequests : filteredVendorRequests.filter((booking) => booking.vendorId || booking.vendorName === selectedVendorDetails.name)).slice(0, 12).map((booking) => (
                          <tr key={booking.id} className="border-b border-slate-50">
                            <td className="py-3 font-black text-blue-950">{booking.id}</td>
                            <td className="py-3 font-bold text-slate-600">{booking.customerName}</td>
                            <td className="py-3 font-bold text-slate-500">{booking.serviceTitle}</td>
                            <td className="py-3 text-slate-500">{booking.date}</td>
                            <td className="py-3 text-slate-500">{vendorDetailsTab === "requests" ? booking.region : `${booking.price} AED`}</td>
                            <td className="py-3"><span className="rounded-lg bg-slate-100 px-2 py-1 font-black text-slate-700">{booking.status || "Pending"}</span></td>
                            <td className="py-3 text-slate-500">{vendorDetailsTab === "requests" ? (booking.assignedStaff || "Unassigned") : (booking.status === "Completed" ? String(booking.updatedAt || booking.date).slice(0, 10) : "Pending")}</td>
                            {vendorDetailsTab === "requests" && <td className="py-3"><button onClick={() => triggerToast(`Request ${booking.id} opened.`)} className="text-emerald-700 font-black">View</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">Showing first 12 records. Filters update in real time.</p>
                </div>
              )}

              {vendorDetailsTab === "payments" && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-xs">
                    <thead className="text-[10px] uppercase text-slate-400"><tr>{["Transaction ID", "Booking Reference", "Gross Amount", "Commission", "Net Payable", "Payment Date", "Payment Status"].map((head) => <th key={head} className="text-left py-3 border-b border-slate-100">{head}</th>)}</tr></thead>
                    <tbody>{vendorPaymentRows.map((row) => <tr key={row.transactionId} className="border-b border-slate-50"><td className="py-3 font-black text-blue-950">{row.transactionId}</td><td>{row.bookingRef}</td><td>{row.gross} AED</td><td>{row.commission} AED</td><td className="font-black text-emerald-700">{row.net} AED</td><td>{String(row.date).slice(0, 10)}</td><td>{row.status}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {vendorDetailsTab === "commissions" && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-xs">
                    <thead className="text-[10px] uppercase text-slate-400"><tr>{["Service Name", "Booking ID", "Commission %", "Commission Amount", "Settlement Status", "Settlement Date"].map((head) => <th key={head} className="text-left py-3 border-b border-slate-100">{head}</th>)}</tr></thead>
                    <tbody>{vendorCommissionRows.map((row) => <tr key={`${row.bookingId}-${row.serviceName}`} className="border-b border-slate-50"><td className="py-3 font-bold text-slate-600">{row.serviceName}</td><td className="font-black text-blue-950">{row.bookingId}</td><td>{row.percent}%</td><td>{row.amount} AED</td><td>{row.status}</td><td>{String(row.date).slice(0, 10)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {vendorDetailsTab === "reviews" && (
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
                  <div className="rounded-2xl border border-slate-150 bg-slate-50 p-4">
                    <div className="text-4xl font-black text-blue-950">{vendorAverageRating}</div>
                    <p className="text-xs font-bold text-slate-500">Average Rating</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">{vendorSyntheticReviews.length} Reviews</p>
                    <div className="space-y-2 mt-4">{vendorRatingDistribution.map((row) => <div key={row.rating} className="flex justify-between text-xs"><span>{row.rating} stars</span><span className="font-black">{row.count}</span></div>)}</div>
                  </div>
                  <div className="space-y-3">{vendorSyntheticReviews.map((review) => <div key={review.id} className="rounded-xl border border-slate-100 bg-white p-3 text-xs"><div className="flex justify-between gap-3"><span className="font-black text-blue-950">{review.customerName}</span><span className="font-black text-amber-600">{review.rating}/5</span></div><p className="font-bold text-slate-500 mt-1">{review.service}</p><p className="text-slate-500 mt-2">{review.review}</p><p className="text-[10px] text-slate-400 mt-2">{String(review.date).slice(0, 10)}</p></div>)}</div>
                </div>
              )}

              {vendorDetailsTab === "documents" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {vendorDocuments.map((document) => <div key={document.name} className="rounded-2xl border border-slate-150 bg-slate-50 p-4"><h4 className="font-black text-blue-950 text-xs">{document.name}</h4><p className="text-[10px] text-slate-400 mt-1">Updated {String(document.updatedAt || "N/A").slice(0, 10)}</p><span className={`inline-block mt-3 rounded-lg px-2 py-1 text-[10px] font-black ${document.status === "Approved" ? "bg-emerald-50 text-emerald-700" : document.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{document.status}</span><div className="flex gap-2 mt-4">{["Approve", "Reject", "Request Resubmission"].map((action) => <button key={action} onClick={() => triggerToast(`${action} requested for ${document.name}.`)} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[9px] font-black text-slate-600">{action}</button>)}</div></div>)}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ---- MODULE E2: VENDOR SERVICE ACCESS CONTROL ---- */}
        {activePane === "vendorServices" && (
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs text-left h-fit">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-blue-950 text-sm">Vendor List</h3>
                <p className="text-[10.5px] text-slate-400">Select a provider to control service access.</p>
              </div>

              {vendorsList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No vendors available.</div>
              ) : (
                <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                  {vendorsList.map((vendor) => {
                    const isSelected = vendor.id === selectedVendorServiceVendorId;
                    return (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => setSelectedVendorServiceVendorId(vendor.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-blue-950 truncate">{vendor.name}</span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full ${
                            vendor.active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {vendor.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{vendor.type || "Provider"} • {vendor.contact || "No contact"}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Service Assignment Screen</h3>
                  <p className="text-[10.5px] text-slate-400">
                    {selectedServiceVendor ? `Managing service access for ${selectedServiceVendor.name}` : "Select a vendor to begin."}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={!selectedVendorServiceVendorId || isSavingAssignments || filteredVendorServiceAssignments.length === 0}
                    onClick={() => handleBulkVendorServices(true)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-extrabold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
                  >
                    Bulk Enable Services
                  </button>
                  <button
                    type="button"
                    disabled={!selectedVendorServiceVendorId || isSavingAssignments || filteredVendorServiceAssignments.length === 0}
                    onClick={() => handleBulkVendorServices(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-extrabold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-900 transition-colors"
                  >
                    Bulk Disable Services
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={vendorServiceSearch}
                  onChange={(event) => setVendorServiceSearch(event.target.value)}
                  placeholder="Search services by name, category, subcategory, or description..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {!selectedVendorServiceVendorId ? (
                <div className="py-16 text-center text-xs text-slate-400">Select a vendor to manage assigned services.</div>
              ) : filteredVendorServiceAssignments.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">No services match this search.</div>
              ) : (
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {filteredVendorServiceAssignments.map((service) => (
                    <div key={service.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-xs font-black text-blue-950">{service.title}</h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            service.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                          }`}>
                            {service.enabled ? "ENABLED" : "DISABLED"}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 line-clamp-2 mb-2">{service.description || "No description provided."}</p>
                        <div className="flex flex-wrap gap-2 text-[9.5px] text-slate-500 font-bold">
                          <span className="bg-white border border-slate-200 rounded-md px-2 py-1">Category: {service.category || "Unassigned"}</span>
                          <span className="bg-white border border-slate-200 rounded-md px-2 py-1">Subcategory: {service.subcategory || "None"}</span>
                          <span className="bg-white border border-slate-200 rounded-md px-2 py-1">Price: {service.price || 0} {settingsData.defaultCurrency || "AED"}</span>
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!service.enabled}
                          disabled={isSavingAssignments}
                          onChange={(event) => handleToggleVendorService(service.id, event.target.checked)}
                          className="w-4 h-4 accent-emerald-600"
                        />
                        <span className="text-xs font-extrabold text-slate-700">{service.enabled ? "Enabled" : "Disabled"}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- MODULE E3: CUSTOM SERVICE REQUESTS ---- */}
        {activePane === "customRequests" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Custom Service Requests</h3>
                <p className="text-[10.5px] text-slate-400">User requested custom services, quote requests, long-term care enquiries, and special dispatch requirements.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl bg-amber-50 text-amber-700 px-3 py-2 text-[10px] font-black">
                  Pending: {enquiriesList.filter((request) => request.status === "Pending Response").length}
                </span>
                <span className="rounded-xl bg-emerald-50 text-emerald-700 px-3 py-2 text-[10px] font-black">
                  Answered: {enquiriesList.filter((request) => request.status === "Answered").length}
                </span>
                <span className="rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-[10px] font-black">
                  Total: {enquiriesList.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mb-5">
              <input
                type="text"
                value={customRequestSearch}
                onChange={(event) => setCustomRequestSearch(event.target.value)}
                placeholder="Search by customer, service, email, mobile, or request details..."
                className="text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <select
                value={customRequestStatusFilter}
                onChange={(event) => setCustomRequestStatusFilter(event.target.value as "all" | "Pending Response" | "Answered" | "Closed")}
                className="text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Status</option>
                <option value="Pending Response">Pending Response</option>
                <option value="Answered">Answered</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {filteredCustomServiceRequests.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">No custom service requests match your filter.</div>
            ) : (
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredCustomServiceRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-150 bg-slate-50/70 p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-black text-blue-950">{request.customerName}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            request.status === "Pending Response"
                              ? "bg-amber-100 text-amber-800"
                              : request.status === "Answered"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                          }`}>
                            {request.status || "Pending Response"}
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {request.id}
                          </span>
                        </div>
                        <p className="text-xs font-black text-emerald-700 mb-1">{request.serviceTitle || "Custom Service"}</p>
                        <p className="text-[11px] text-slate-600 leading-relaxed max-w-3xl">{request.message}</p>
                        <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-slate-500 font-bold">
                          <span>Email: <a href={`mailto:${request.customerEmail}`} className="text-blue-700 hover:underline">{request.customerEmail}</a></span>
                          <span>Mobile: {request.customerPhone}</span>
                          <span>Preferred: {request.contactMethod || (request.message?.match(/\[Preferred contact: ([^\]]+)\]/)?.[1]) || "Not specified"}</span>
                          <span>Date: {request.date || String(request.createdAt || "").slice(0, 10)}</span>
                        </div>
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateEnquiryStatus(request.id, request.status)}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black hover:bg-emerald-700"
                        >
                          {request.status === "Pending Response" ? "Mark Contacted" : "Re-open"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEnquiry(request.id)}
                          className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- MODULE F: USERS ---- */}
        {activePane === "users" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Registered Users</h3>
                <p className="text-[10.5px] text-slate-400">All registered accounts across customers, vendors, staff, admins, and super admins.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Super Admin", value: reportMetrics.userRoleCounts.super_admin || 0, color: "bg-slate-900 text-white" },
                  { label: "Admin", value: reportMetrics.userRoleCounts.admin || 0, color: "bg-blue-50 text-blue-700" },
                  { label: "Vendor", value: reportMetrics.userRoleCounts.vendor || 0, color: "bg-purple-50 text-purple-700" },
                  { label: "Staff", value: reportMetrics.userRoleCounts.staff || 0, color: "bg-amber-50 text-amber-700" },
                  { label: "Customer", value: reportMetrics.userRoleCounts.customer || 0, color: "bg-emerald-50 text-emerald-700" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl px-3 py-2 text-center ${item.color}`}>
                    <span className="block text-[9px] font-black uppercase">{item.label}</span>
                    <span className="block text-lg font-black leading-tight">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {usersList.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">No registered users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px] text-xs">
                  <thead>
                    <tr className="text-left text-[10px] uppercase text-slate-400 border-b border-slate-100">
                      <th className="py-3 font-black">User</th>
                      <th className="py-3 font-black">Email</th>
                      <th className="py-3 font-black">Phone</th>
                      <th className="py-3 font-black">Role</th>
                      <th className="py-3 font-black">Vendor Link</th>
                      <th className="py-3 font-black text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((user) => {
                      const linkedVendor = vendorsList.find((vendor) => vendor.id === user.vendorId);
                      const roleLabel = String(user.role || "customer").replace("_", " ");
                      return (
                        <tr key={user.id} className="border-b border-slate-50">
                          <td className="py-3 pr-4">
                            <span className="block font-black text-blue-950">{user.fullName || user.username || "Unnamed User"}</span>
                            <span className="block text-[10px] text-slate-400">{user.username || user.id}</span>
                          </td>
                          <td className="py-3 pr-4 font-bold text-slate-600">{user.email || "N/A"}</td>
                          <td className="py-3 pr-4 font-bold text-slate-500">{user.phone || "N/A"}</td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-black text-slate-700 uppercase">
                              {roleLabel}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-bold text-slate-500">{linkedVendor?.name || user.vendorId || "None"}</td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex rounded-lg px-2.5 py-1 font-black ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---- MODULE F: REPORTS & ANALYTICS ---- */}
        {activePane === "reports" && (
          <div className="space-y-8">
            
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4 text-left">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Indexed Tax Revenue</span>
                  <span className="text-lg font-black text-blue-950 mt-0.5">{reportMetrics.completedVal} {settingsData.defaultCurrency || 'AED'}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4 text-left">
                <div className="p-3 bg-teal-50 text-emerald-600 rounded-xl">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Completed Procedures</span>
                  <span className="text-lg font-black text-blue-950 mt-0.5">{reportMetrics.completedCount} Scheduled Visits</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center gap-4 text-left">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Regional Revenue Split</span>
                  <span className="text-xs font-black text-slate-500 mt-0.5 block">DXB: {reportMetrics.dubaiRev} AED · SHJ: {reportMetrics.shjRev} AED</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "revenue", label: "Revenue" },
                { id: "services", label: "Services" },
                { id: "bookings", label: "Bookings" },
                { id: "sales", label: "Sales" },
                { id: "vendors", label: "Vendors" },
                { id: "customers", label: "Customers" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportPane(tab.id as any)}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                    reportPane === tab.id ? "bg-blue-950 text-white" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Date Range Filter & Export */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">Date Range:</span>
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "7d", label: "7 Days" },
                  { id: "30d", label: "30 Days" },
                  { id: "90d", label: "90 Days" },
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => {
                      setReportDateRange(range.id as any);
                      setReportStartDate("");
                      setReportEndDate("");
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      reportDateRange === range.id && !reportStartDate && !reportEndDate
                        ? "bg-blue-950 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-2">
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => {
                      setReportStartDate(e.target.value);
                      setReportDateRange("all");
                    }}
                    className="text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-medical-blue"
                    placeholder="Start"
                  />
                  <span className="text-slate-400 text-[10px]">to</span>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => {
                      setReportEndDate(e.target.value);
                      setReportDateRange("all");
                    }}
                    className="text-[10px] border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-medical-blue"
                    placeholder="End"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold ml-1">
                  ({dateFilteredBookings.length} bookings)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBookings}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-emerald-200"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  Export Bookings
                </button>
                {reportPane === "vendors" && (
                  <button
                    onClick={handleExportVendors}
                    className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-purple-200"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Export Vendors
                  </button>
                )}
                {reportPane === "customers" && (
                  <button
                    onClick={handleExportCustomers}
                    className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-blue-200"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    Export Customers
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">Booking Analytics</h3>
                    <p className="text-[10.5px] text-slate-400">Fulfillment and assignment health</p>
                  </div>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Fulfillment", value: `${reportMetrics.fulfillmentRate}%` },
                    { label: "Assigned", value: reportMetrics.assignedCount },
                    { label: "Unassigned", value: reportMetrics.unassignedCount },
                    { label: "Canceled", value: reportMetrics.cancelledCount },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-[9px] uppercase font-black text-slate-400">{item.label}</span>
                      <div className="text-lg font-black text-blue-950 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">User Roles</h3>
                    <p className="text-[10.5px] text-slate-400">Active access model by account type</p>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-blue-700" />
                </div>
                <div className="space-y-3">
                  {reportMetrics.userRoleData.map((role) => (
                    <div key={role.role} className={`border rounded-xl p-3 flex items-center justify-between ${role.color}`}>
                      <span className="text-xs font-black">{role.role}</span>
                      <span className="text-lg font-black">{role.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">Vendor Access</h3>
                    <p className="text-[10.5px] text-slate-400">Provider account readiness</p>
                  </div>
                  <Building2 className="w-4 h-4 text-purple-700" />
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500">Active vendors</span>
                    <span className="font-black text-emerald-700">{reportMetrics.activeVendorsCount}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-500">Inactive vendors</span>
                    <span className="font-black text-rose-700">{reportMetrics.inactiveVendorsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Vendor user accounts</span>
                    <span className="font-black text-purple-700">{reportMetrics.userRoleCounts.vendor || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Trend Sparkline */}
            {reportMetrics.salesTrendData.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">Booking Revenue Trend</h3>
                    <p className="text-[10.5px] text-slate-400">Monthly revenue over time</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={reportMetrics.salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [`AED ${value}`, 'Revenue']}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1769b3"
                      strokeWidth={2}
                      dot={{ fill: '#1769b3', strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {reportPane === "revenue" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                  <h3 className="font-extrabold text-blue-950 text-sm mb-1">Revenue Report</h3>
                  <p className="text-[10.5px] text-slate-400 mb-4">Regional revenue and average booking value</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={reportMetrics.revenueByRegionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#0f172a" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
                  {[
                    { label: "Total Revenue", value: `${reportMetrics.completedVal} ${settingsData.defaultCurrency || "AED"}` },
                    { label: "Average Booking Value", value: `${reportMetrics.averageBookingValue} ${settingsData.defaultCurrency || "AED"}` },
                    { label: "Dubai Revenue", value: `${reportMetrics.dubaiRev} ${settingsData.defaultCurrency || "AED"}` },
                    { label: "Other Region Revenue", value: `${reportMetrics.shjRev} ${settingsData.defaultCurrency || "AED"}` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-500">{item.label}</span>
                      <span className="font-black text-blue-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportPane === "services" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                <h3 className="font-extrabold text-blue-950 text-sm mb-1">Service Report</h3>
                <p className="text-[10.5px] text-slate-400 mb-4">Service demand and revenue contribution</p>
                <div className="space-y-3">
                  {reportMetrics.serviceReportData.slice(0, 10).map((service) => (
                    <div key={service.name} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <span className="font-black text-blue-950 truncate">{service.name}</span>
                      <span className="font-bold text-slate-500">{service.count} bookings</span>
                      <span className="font-black text-emerald-700">{service.revenue} {settingsData.defaultCurrency || "AED"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportPane === "bookings" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                  <h3 className="font-extrabold text-blue-950 text-sm mb-4">Booking Report</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={reportMetrics.bookingStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={55} outerRadius={80}>
                        {reportMetrics.bookingStatusData.map((entry, index) => (
                          <Cell key={`booking-status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
                  {[
                    { label: "Pending", value: reportMetrics.pendingCount },
                    { label: "Active", value: reportMetrics.activeCount },
                    { label: "Completed", value: reportMetrics.completedCount },
                    { label: "Canceled", value: reportMetrics.cancelledCount },
                    { label: "Unassigned Queue", value: reportMetrics.unassignedCount },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <span className="font-bold text-slate-500">{item.label}</span>
                      <span className="font-black text-blue-950">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportPane === "sales" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                <h3 className="font-extrabold text-blue-950 text-sm mb-1">Sales Analytics</h3>
                <p className="text-[10.5px] text-slate-400 mb-4">Monthly booking value trend</p>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={reportMetrics.salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#00ac8a" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {reportPane === "vendors" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                <h3 className="font-extrabold text-blue-950 text-sm mb-1">Vendor Performance Analytics</h3>
                <p className="text-[10.5px] text-slate-400 mb-4">Provider booking volume, completion, and revenue</p>
                <div className="space-y-3">
                  {reportMetrics.vendorPerformanceData.map((vendor) => (
                    <div key={vendor.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <span className="font-black text-blue-950 truncate">{vendor.name}</span>
                      <span className="font-bold text-slate-500">{vendor.bookings} bookings</span>
                      <span className="font-bold text-slate-500">{vendor.completionRate}% complete</span>
                      <span className="font-black text-emerald-700">{vendor.revenue} {settingsData.defaultCurrency || "AED"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportPane === "customers" && (
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-blue-950 text-sm">Customer Analytics</h3>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[9px] uppercase font-black text-slate-400">Unique Customers</span>
                    <div className="text-xl font-black text-blue-950">{reportMetrics.uniqueCustomers}</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[9px] uppercase font-black text-slate-400">Repeat Customers</span>
                    <div className="text-xl font-black text-blue-950">{reportMetrics.repeatCustomerCount}</div>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
                  <h4 className="font-extrabold text-blue-950 text-sm mb-4">Top Customers by Booking Value</h4>
                  <div className="space-y-3">
                    {reportMetrics.customerReportData.map((customer) => (
                      <div key={`${customer.email}-${customer.name}`} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                        <span className="font-black text-blue-950 truncate">{customer.name}</span>
                        <span className="font-bold text-slate-500">{customer.bookings} bookings</span>
                        <span className="font-black text-emerald-700">{customer.revenue} {settingsData.defaultCurrency || "AED"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hand-drawn Premium Vector SVG Charts to prevent load bottlenecks */}
            {reportPane === "overview" && <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              
              {/* Dynamic Revenue distribution chart visual */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-xs uppercase font-black text-slate-450 tracking-wider">Indexed Performance Grid</h4>
                    <h3 className="font-extrabold text-blue-950 text-sm leading-none mt-1">Operational Gross Revenue By Region Value</h3>
                  </div>
                  <TrendingUp className="w-4 h-4 text-medical-green" />
                </div>

                <div className="flex flex-col items-center justify-center p-4">
                  {/* Custom geometric inline SVG rendering regional billing proportions visually */}
                  <svg className="w-48 h-48 transform -rotate-90">
                    {/* Ring for Dubai: e.g. percent if total booking exists */}
                    {(() => {
                      const total = reportMetrics.dubaiRev + reportMetrics.shjRev || 1;
                      const dxbPercent = (reportMetrics.dubaiRev / total) * 100;
                      const strokeDashDXB = (dxbPercent / 100) * 251.2;
                      const strokeDashSHJ = 251.2 - strokeDashDXB;
                      return (
                        <>
                          {/* Inner placeholder space background */}
                          <circle cx="96" cy="96" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                          {/* Dubai Arc */}
                          <circle cx="96" cy="96" r="40" fill="transparent" stroke="#00ac8a" strokeWidth="12" 
                            strokeDasharray={`${strokeDashDXB} 251.2`}
                          />
                          {/* Sharjah Arc */}
                          <circle cx="96" cy="96" r="40" fill="transparent" stroke="#102a43" strokeWidth="12" 
                            strokeDasharray={`${strokeDashSHJ} 251.2`}
                            strokeDashoffset={-strokeDashDXB}
                          />
                        </>
                      );
                    })()}
                  </svg>

                  <div className="flex justify-center gap-6 mt-5 text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-medical-green inline-block"></span> Dubai Visits ({reportMetrics.dubaiRev} AED)</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#102a43] inline-block"></span> Sharjah Visits ({reportMetrics.shjRev} AED)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Visit Booking Performance Lists */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
                <h4 className="text-xs uppercase font-black text-slate-450 tracking-wider mb-1">Corporate Revenue Contributions</h4>
                <h3 className="font-extrabold text-blue-950 text-sm border-b border-slate-100 pb-3 mb-4">Vendor Operational Incomes</h3>

                <div className="space-y-4">
                  {vendorsList.map((v) => {
                    // Collect aggregate revenue for this vendor
                    const bookingsForVendor = bookingsList.filter(b => b.vendorName === v.name);
                    const grossIncome = bookingsForVendor.reduce((sum, b) => sum + (b.price || 0), 0);
                    const percent = reportMetrics.completedVal > 0 ? (grossIncome / reportMetrics.completedVal) * 100 : 0;
                    return (
                      <div key={v.id} className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-750">{v.name} ({v.type})</span>
                          <span className="font-black text-blue-950">{grossIncome} AED</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-950 h-2 rounded-full" 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>}

          </div>
        )}

        {/* ---- MODULE: VENDOR PERFORMANCE (SLA) ---- */}
        {activePane === "sla" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Vendor Performance Monitor</h3>
                  <p className="text-[10.5px] text-slate-400">Track response times, completion rates, and revenue per vendor</p>
                </div>
                <button
                  onClick={fetchVendorSlaMetrics}
                  disabled={vendorSlaLoading}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${vendorSlaLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {vendorSlaLoading && vendorSlaMetrics.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-xs font-semibold">Loading vendor performance data...</span>
                </div>
              ) : vendorSlaMetrics.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No vendor data available yet</p>
                  <p className="text-[10px] mt-1">Performance metrics will appear once vendors accept bookings</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vendorSlaMetrics.map((vendor: any) => (
                    <div key={vendor.vendorId} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-medical-blue/10 rounded-xl flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-medical-blue" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-blue-950">{vendor.vendorName}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{vendor.totalBookings} total bookings</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-medical-green">{vendor.totalRevenue} AED</span>
                          <p className="text-[10px] text-slate-400 font-semibold">Revenue</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Acceptance Rate</span>
                          <span className={`text-lg font-black ${vendor.acceptanceRate >= 80 ? 'text-emerald-600' : vendor.acceptanceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {vendor.acceptanceRate}%
                          </span>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Completion Rate</span>
                          <span className={`text-lg font-black ${vendor.completionRate >= 80 ? 'text-emerald-600' : vendor.completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                            {vendor.completionRate}%
                          </span>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Avg Response</span>
                          <span className="text-lg font-black text-blue-950">
                            {vendor.avgResponseTimeMinutes !== null ? `${vendor.avgResponseTimeMinutes}m` : 'N/A'}
                          </span>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Avg Completion</span>
                          <span className="text-lg font-black text-blue-950">
                            {vendor.avgCompletionTimeHours !== null ? `${vendor.avgCompletionTimeHours}h` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {vendor.completedBookings} completed
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          {vendor.activeBookings} active
                        </span>
                        <span className="flex items-center gap-1">
                          <X className="w-3 h-3 text-red-400" />
                          {vendor.canceledBookings} canceled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- MODULE G: USER ROLES & PERMISSIONS ---- */}
        {activePane === "roles" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">User Roles & Permissions</h3>
                  <p className="text-[10.5px] text-slate-400">Access model for Super Admin, Admin, Vendor, Staff, and Customer accounts</p>
                </div>
                <ShieldAlert className="w-5 h-5 text-blue-950" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {[
                  { role: "Super Admin", key: "super_admin", desc: "Full system control", color: "bg-slate-900 text-white" },
                  { role: "Admin", key: "admin", desc: "Operations and configuration", color: "bg-blue-50 text-blue-700" },
                  { role: "Vendor", key: "vendor", desc: "Provider portal access", color: "bg-purple-50 text-purple-700" },
                  { role: "Staff", key: "staff", desc: "Internal service operations", color: "bg-amber-50 text-amber-700" },
                  { role: "Customer", key: "customer", desc: "Booking and profile access", color: "bg-emerald-50 text-emerald-700" },
                ].map((item) => (
                  <div key={item.key} className="rounded-2xl border border-slate-150 bg-slate-50 p-4">
                    <div className={`rounded-xl px-3 py-2 text-xs font-black ${item.color}`}>{item.role}</div>
                    <p className="text-[10.5px] text-slate-500 mt-3 min-h-8">{item.desc}</p>
                    <div className="text-xl font-black text-blue-950 mt-2">{reportMetrics.userRoleCounts[item.key] || 0}</div>
                    <span className="text-[9px] uppercase font-black text-slate-400">accounts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs overflow-x-auto">
              <h4 className="font-extrabold text-blue-950 text-sm mb-4">Permission Matrix</h4>
              <table className="w-full min-w-[760px] text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase text-slate-400 border-b border-slate-100">
                    <th className="py-3 font-black">Permission</th>
                    {["Super Admin", "Admin", "Vendor", "Staff", "Customer"].map((role) => (
                      <th key={role} className="py-3 font-black text-center">{role}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { permission: "View analytics dashboard", roles: ["Super Admin", "Admin", "Vendor", "Staff"] },
                    { permission: "Manage platform settings", roles: ["Super Admin", "Admin"] },
                    { permission: "Manage roles and permissions", roles: ["Super Admin"] },
                    { permission: "Manage services and categories", roles: ["Super Admin", "Admin", "Staff"] },
                    { permission: "Manage vendor service access", roles: ["Super Admin", "Admin"] },
                    { permission: "Accept eligible bookings", roles: ["Vendor"] },
                    { permission: "View assigned vendor reports", roles: ["Vendor"] },
                    { permission: "Create customer bookings", roles: ["Customer", "Staff", "Admin", "Super Admin"] },
                    { permission: "View own profile and bookings", roles: ["Customer"] },
                  ].map((row) => (
                    <tr key={row.permission} className="border-b border-slate-50">
                      <td className="py-3 font-bold text-slate-700">{row.permission}</td>
                      {["Super Admin", "Admin", "Vendor", "Staff", "Customer"].map((role) => (
                        <td key={role} className="py-3 text-center">
                          {row.roles.includes(role) ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <h4 className="font-extrabold text-blue-950 text-sm mb-4">Current User Accounts</h4>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {usersList.map((user) => (
                  <div key={user.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 md:items-center rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                    <div>
                      <span className="font-black text-blue-950 block">{user.fullName || user.username || user.email}</span>
                      <span className="text-slate-500">{user.email || user.username || "No email"}</span>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-black text-slate-700 uppercase">{String(user.role || "customer").replace("_", " ")}</span>
                    <span className={`rounded-lg px-3 py-1 font-black ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- MODULE G: PENDING PAYMENTS ---- */}
        {activePane === "pendingPayments" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-blue-950 text-sm">Pending AUTH Transactions</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Transactions authorized but not yet captured. Auto-capture after 24 hours.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setPendingPaymentsLoading(true);
                    try {
                      const res = await fetch("/api/admin/payments/pending", getAdminRequestInit());
                      const data = await res.json();
                      setPendingPaymentsList(Array.isArray(data?.payments) ? data.payments : Array.isArray(data) ? data : []);
                    } catch (e) {
                      toast.error("Failed to refresh");
                    } finally {
                      setPendingPaymentsLoading(false);
                    }
                  }}
                  disabled={pendingPaymentsLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${pendingPaymentsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {pendingPaymentsList.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No pending payments</p>
                  <p className="text-[11px] text-slate-300 mt-1">All authorized transactions have been captured or voided.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-xs">
                    <thead className="text-[10px] uppercase text-slate-400">
                      <tr>
                        {["Order ID", "Customer", "Amount", "Status", "Authorized", "Capture By", "Actions"].map((head) => (
                          <th key={head} className="text-left py-3 border-b border-slate-100">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPaymentsList.map((payment: any) => (
                        <tr key={payment.id} className="border-b border-slate-50">
                          <td className="py-3 font-black text-blue-950">{payment.order_id || payment.app_utr}</td>
                          <td className="py-3">
                            <div className="font-bold text-slate-700">{payment.customer_name || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400">{payment.customer_email || ''}</div>
                          </td>
                          <td className="py-3 font-bold text-emerald-700">AED {payment.authorized_amount}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              payment.status === 'AUTHORIZED' ? 'bg-amber-50 text-amber-700' :
                              payment.status === 'CAPTURED' ? 'bg-emerald-50 text-emerald-700' :
                              payment.status === 'VOIDED' ? 'bg-red-50 text-red-700' :
                              'bg-slate-50 text-slate-600'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">
                            {payment.authorized_at ? new Date(payment.authorized_at).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3">
                            {payment.status === 'AUTHORIZED' ? (
                              <span className={`font-bold ${payment.hours_until_capture <= 0 ? 'text-red-600' : 'text-slate-600'}`}>
                                {payment.hours_until_capture <= 0 ? 'Ready now' : `${Math.round(payment.hours_until_capture)}h remaining`}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            {payment.status === 'AUTHORIZED' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    const newAmount = prompt(`Capture amount (max AED ${payment.authorized_amount}):`, payment.authorized_amount);
                                    if (newAmount === null) return;
                                    const amount = parseFloat(newAmount);
                                    if (isNaN(amount) || amount <= 0) {
                                      toast.error("Invalid amount");
                                      return;
                                    }
                                    try {
                                      const res = await fetch("/api/admin/payments/capture", {
                                        ...getAdminRequestInit(),
                                        method: "POST",
                                        headers: { ...getAdminRequestInit().headers, "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: payment.id, amount }),
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        toast.success(`Captured AED ${amount}`);
                                        setPendingPaymentsList((prev) => prev.map((p) => p.id === payment.id ? { ...p, status: 'CAPTURED', captured_amount: amount } : p));
                                      } else {
                                        toast.error(data.error || "Capture failed");
                                      }
                                    } catch (e) {
                                      toast.error("Capture failed");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Capture
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm("Void this authorization? Customer will not be charged.")) return;
                                    try {
                                      const res = await fetch("/api/admin/payments/void", {
                                        ...getAdminRequestInit(),
                                        method: "POST",
                                        headers: { ...getAdminRequestInit().headers, "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: payment.id }),
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        toast.success("Authorization voided");
                                        setPendingPaymentsList((prev) => prev.map((p) => p.id === payment.id ? { ...p, status: 'VOIDED' } : p));
                                      } else {
                                        toast.error(data.error || "Void failed");
                                      }
                                    } catch (e) {
                                      toast.error("Void failed");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                >
                                  Void
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- MODULE G: CONSOLE SETTINGS ---- */}
        {activePane === "settings" && (
          <form onSubmit={handleSettingsSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xs max-w-3xl mx-auto space-y-6 text-left">
            <div className="border-b border-slate-150 pb-4">
              <span className="text-[10px] bg-sky-50 text-sky-800 font-extrabold py-1 px-2.5 rounded-full uppercase tracking-wider">
                System Global Constants
              </span>
              <h3 className="font-black text-blue-950 text-lg mt-2">Operational Platform Configuration</h3>
              <p className="text-slate-500 text-xs mt-1">Configure VAT percentages, currency variables, technician pricing rates, and backend credentials.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">System Visual Brand Name <span className="text-red-600">*</span></label>
                <input 
                  type="text" 
                  value={settingsForm.siteName} 
                  onChange={e => setSettingsForm({...settingsForm, siteName: e.target.value})} 
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
                {adminFormErrors.siteName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.siteName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Clinical Support Email Router <span className="text-red-600">*</span></label>
                <input 
                  type="email" 
                  value={settingsForm.supportEmail} 
                  onChange={e => setSettingsForm({...settingsForm, supportEmail: e.target.value})} 
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
                {adminFormErrors.supportEmail && <p className="text-red-600 text-xs mt-1">{adminFormErrors.supportEmail}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 block">Dubai Audited VAT Rate (%) <span className="text-red-600">*</span></label>
                <input 
                  type="number" 
                  value={settingsForm.vatPercent} 
                  onChange={e => setSettingsForm({...settingsForm, vatPercent: Number(e.target.value)})} 
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl"
                  required
                />
                {adminFormErrors.vatPercent && <p className="text-red-600 text-xs mt-1">{adminFormErrors.vatPercent}</p>}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-600 block mb-1">Permitted Care Service Regions (Checkboxes)</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {["Dubai", "Sharjah", "Abu Dhabi", "Al Ain"].map((reg) => {
                    const isChecked = settingsForm.serviceRegions.includes(reg);
                    return (
                      <label key={reg} className="flex items-center gap-2 text-xs font-bold text-slate-705 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleRegionToggle(reg)} 
                          className="w-4 h-4 text-emerald-600 accent-emerald-500 rounded"
                        />
                        <span>{reg} Operation</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2 border-t border-slate-100 pt-5 space-y-4">
                <div className="bg-[#FAFDFD] p-4 rounded-xl border border-teal-500/10 mb-2">
                  <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5 mb-1.5">
                    <Key className="w-4 h-4 text-medical-green" />
                    <span>Administrator Profile Configuration</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                    Modify the live credentials required to access this ERP workspace portal. Leave password blank to keep current password.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600 block">Operator Username Account</label>
                      <input 
                        type="text" 
                        value={settingsData.adminUsername || "admin"} 
                        disabled
                        className="w-full text-xs p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-750 block">Authorize New Secret Passcode</label>
                      <input 
                        type="password" 
                        placeholder="•••••••• (Input new credential to lock)"
                        value={settingsForm.adminPassword} 
                        onChange={e => setSettingsForm({...settingsForm, adminPassword: e.target.value})} 
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-medical-green hover:bg-emerald-600 font-extrabold py-4 text-white rounded-xl text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
            >
              <Save className="w-4.5 h-4.5" />
              <span>{isSubmitting ? "STORING PROPERTIES..." : "COMMIT OPERATIONAL CONSTANTS"}</span>
            </button>
          </form>
        )}

        {/* ---- MODULE H: SUBMITTED ENQUIRIES ---- */}
        {activePane === "enquiries" && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex items-start gap-4 text-left">
              <Mail className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Customer General &amp; Service enquiries</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  View customized requests, question logs, and quote estimations. Ensure phlebotomists, therapists, or nurse dispatch parameters are aligned prior to updating callback response flags.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="border-b border-slate-100 pb-3.5 mb-5 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider">Submitted Requests List</h4>
                  <p className="text-[10.5px] text-slate-400">Total of {enquiriesList.length} customized queries registered on MedZiva.</p>
                </div>
                <button
                  onClick={fetchAdminData}
                  className="text-xs text-medical-green font-bold hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {enquiriesList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No medical enquiries have been received through the portal yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {enquiriesList.map((enq) => (
                    <div
                      key={enq.id}
                      className="p-5 border border-slate-200 rounded-2xl bg-[#FCFDFE]/70 hover:bg-white hover:shadow-md transition-all text-left space-y-4 relative overflow-hidden"
                    >
                      {/* Left vertical status helper bar */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                        enq.status === "Pending Response" ? "bg-amber-500" :
                        enq.status === "Answered" ? "bg-emerald-500" : "bg-slate-400"
                      }`} />

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-blue-950">{enq.customerName}</span>
                            <span className="text-[10px] text-slate-400">Submitted {enq.date}</span>
                            <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                              enq.status === "Pending Response" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              enq.status === "Answered" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                              "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {enq.status}
                            </span>
                          </div>
                          
                          <p className="text-[11.5px] text-slate-400 font-semibold uppercase tracking-wider">
                            Interested service: <span className="text-medical-green font-black">{enq.serviceTitle}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateEnquiryStatus(enq.id, enq.status)}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all border ${
                              enq.status === "Pending Response"
                                ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                            }`}
                          >
                            {enq.status === "Pending Response" ? "Mark Contacted ✓" : "Re-open Inquiry ⚙"}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteEnquiry(enq.id)}
                            className="p-2 border border-slate-200 rounded-lg text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content block */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs leading-relaxed text-slate-650 font-medium">
                        <div className="font-bold text-slate-750 uppercase tracking-widest text-[9.5px] mb-1">Customer Query:</div>
                        &ldquo;{enq.message}&rdquo;
                      </div>

                      {/* Contact metadata */}
                      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          Email: <a href={`mailto:${enq.customerEmail}`} className="text-medical-blue hover:underline">{enq.customerEmail}</a>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          Mobile: <span className="font-extrabold">{enq.customerPhone}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activePane === "vendorChangeRequests" && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl flex items-start gap-4 text-left">
              <FileText className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Vendor Profile Change Requests</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Review and approve or reject profile update requests submitted by vendor partners. Changes include name, contact, address, email, and service type updates.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs">
              <div className="border-b border-slate-100 pb-3.5 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-blue-950 text-xs uppercase tracking-wider">Change Requests</h4>
                  <p className="text-[10.5px] text-slate-400">
                    {filteredVendorChangeRequests.length} of {vendorChangeRequestsList.length} requests
                    {vendorChangeRequestsStatusFilter !== "all" && ` (filtered: ${vendorChangeRequestsStatusFilter})`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={vendorChangeRequestsSearch}
                    onChange={(e) => setVendorChangeRequestsSearch(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-2 w-48 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setVendorChangeRequestsStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                        vendorChangeRequestsStatusFilter === status
                          ? "bg-blue-950 text-white border-blue-950"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={fetchAdminData}
                    className="text-xs text-medical-green font-bold hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {filteredVendorChangeRequests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  {vendorChangeRequestsList.length === 0
                    ? "No vendor profile change requests have been submitted yet."
                    : "No requests match your search or filter criteria."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Vendor</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Field</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Current</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Requested</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Reason</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Status</th>
                        <th className="text-left py-3 px-3 font-extrabold text-slate-500 uppercase text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVendorChangeRequests.map((req) => (
                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-blue-950">{req.vendorName || req.vendorId || "—"}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">{req.fieldName}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate" title={req.currentValue}>
                            {req.currentValue || "—"}
                          </td>
                          <td className="py-3 px-3 text-medical-green font-bold max-w-[150px] truncate" title={req.requestedValue}>
                            {req.requestedValue}
                          </td>
                          <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate" title={req.reason}>
                            {req.reason || "—"}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${
                              req.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              req.status === "approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                              "bg-rose-100 text-rose-800 border-rose-200"
                            }`}>
                              {req.status?.charAt(0).toUpperCase() + req.status?.slice(1) || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {req.status === "pending" ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleReviewVendorChangeRequest(req.id, "approved")}
                                  disabled={isReviewingChangeRequest === req.id}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 cursor-pointer transition-all disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReviewVendorChangeRequest(req.id, "rejected")}
                                  disabled={isReviewingChangeRequest === req.id}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer transition-all disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                {req.adminRemarks || "Reviewed"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

      </div>

      {/* Vendor Edit Modal */}
      {isVendorEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-medical-blue">Edit Vendor Partner</h3>
                <p className="text-[11.5px] text-slate-500 font-medium">Update vendor details</p>
              </div>
              <button
                onClick={handleCancelVendorEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Provider Corporate Name <span className="text-red-600">*</span></label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. NMC Clinical Alliance" 
                  value={vendorName} 
                  onChange={e => setVendorName(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                {adminFormErrors.vendorName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.vendorName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Contact Information</label>
                <PhoneInput
                  value={vendorContact}
                  onChange={setVendorContact}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Commission Rate (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={vendorCommission} 
                  onChange={e => setVendorCommission(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Physical Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Dubai Marina, Dubai" 
                  value={vendorAddress} 
                  onChange={e => setVendorAddress(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Logo URL</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://example.com/logo.png" 
                  value={vendorLogo} 
                  onChange={e => setVendorLogo(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Email ID <span className="text-red-600">*</span></label>
                <input 
                  required
                  type="email" 
                  placeholder="e.g. vendor@company.com" 
                  value={vendorEmail} 
                  onChange={e => setVendorEmail(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Password <span className="text-red-600">*</span></label>
                <input 
                  required
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={vendorPassword} 
                  onChange={e => setVendorPassword(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="vendorActive"
                  checked={vendorActive}
                  onChange={e => setVendorActive(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="vendorActive" className="text-xs font-bold text-slate-600">Active Status</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-medical-green hover:bg-[#0fd08f] text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all cursor-pointer disabled:bg-slate-400"
              >
                {isSubmitting ? "UPDATING..." : "UPDATE VENDOR"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Preview Modal */}
      {previewingService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="relative h-56 bg-slate-100">
              <img src={getServiceRecordImage(previewingService)} alt={previewingService.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button onClick={() => setPreviewingService(null)} className="absolute top-3 right-3 p-2 bg-white/90 text-slate-600 hover:text-slate-900 rounded-full shadow cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{previewingService.category}</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{previewingService.status || "active"}</span>
                {previewingService.popular && <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Featured</span>}
              </div>
              <div>
                <h3 className="text-2xl font-black text-blue-950 leading-tight">{previewingService.title}</h3>
                <p className="text-sm text-slate-500 mt-2">{previewingService.shortDescription || previewingService.description}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Price</p><p className="text-sm font-black text-medical-green">AED {previewingService.price}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Duration</p><p className="text-sm font-black text-blue-950">{previewingService.duration}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Location</p><p className="text-sm font-black text-blue-950">{previewingService.serviceLocation || "at-home"}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Priority</p><p className="text-sm font-black text-blue-950">{previewingService.displayPriority ?? 100}</p></div>
              </div>
              {previewingService.fullDescription && <p className="text-sm text-slate-600 leading-relaxed">{previewingService.fullDescription}</p>}
              {previewingService.inclusions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-blue-950 uppercase mb-2">Included</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewingService.inclusions.map((item: string) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-medical-green shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(previewingService.preparationInstructions || previewingService.whoIsItFor || previewingService.availability) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {previewingService.preparationInstructions && <div className="rounded-xl border border-slate-100 p-3"><p className="font-black text-blue-950 mb-1">Preparation</p><p className="text-slate-500">{previewingService.preparationInstructions}</p></div>}
                  {previewingService.whoIsItFor && <div className="rounded-xl border border-slate-100 p-3"><p className="font-black text-blue-950 mb-1">Who Is It For</p><p className="text-slate-500">{previewingService.whoIsItFor}</p></div>}
                  {previewingService.availability && <div className="rounded-xl border border-slate-100 p-3"><p className="font-black text-blue-950 mb-1">Availability</p><p className="text-slate-500">{previewingService.availability}</p></div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Edit Modal */}
      {isServiceEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-medical-blue">Edit Healthcare Service</h3>
                <p className="text-[11.5px] text-slate-500 font-medium">Update service details</p>
              </div>
              <button
                onClick={handleCancelServiceEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Service Title <span className="text-red-600">*</span></label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. At-Home General Nursing Consultation" 
                    value={srvTitle} 
                    onChange={e => setSrvTitle(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  {adminFormErrors.srvTitle && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvTitle}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Base Price (AED) <span className="text-red-600">*</span></label>
                  <input 
                    required
                    type="number" 
                    placeholder="250" 
                    value={srvPrice} 
                    onChange={e => setSrvPrice(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  {adminFormErrors.srvPrice && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvPrice}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Session Duration</label>
                  <input 
                    type="text" 
                    placeholder="1 Hour" 
                    value={srvDuration} 
                    onChange={e => setSrvDuration(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Service Category <span className="text-red-600">*</span></label>
                  <select 
                    required
                    value={srvCategory} 
                    onChange={e => setSrvCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                  >
                    <option value="">-- Select Category --</option>
                    {categoriesList.filter(c => c.type === "service").map(c => (
                      <option key={c.id} value={c.slug}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">Subcategory Specialty Option</label>
                  <select 
                    disabled={!srvCategory}
                    value={srvSubcategory} 
                    onChange={e => setSrvSubcategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg disabled:bg-slate-50 disabled:text-slate-405"
                  >
                    <option value="">-- Optional Bind Subcategory --</option>
                    {filteredSubcategoriesForService.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Image Banner URL</label>
                  <input 
                    type="text" 
                    placeholder="https://images.unsplash.com/..." 
                    value={srvImage} 
                    onChange={e => setSrvImage(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Clinical Narrative Details <span className="text-red-600">*</span></label>
                  <textarea 
                    required
                    rows={2} 
                    placeholder="Enter medical indications, hygiene instructions, nurse certifications..." 
                    value={srvDesc} 
                    onChange={e => setSrvDesc(e.target.value)} 
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  {adminFormErrors.srvDesc && <p className="text-red-600 text-xs mt-1">{adminFormErrors.srvDesc}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="srvPopular" 
                  checked={srvPopular} 
                  onChange={e => setSrvPopular(e.target.checked)} 
                  className="w-4 h-4 text-emerald-600 accent-emerald-500"
                />
                <label htmlFor="srvPopular" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Feature prominently on Home Carousel
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-medical-green hover:bg-emerald-600 font-extrabold py-3.5 text-white rounded-xl text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? "UPDATING..." : "UPDATE SERVICE"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {isCategoryEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-medical-blue">Edit Core Specialty</h3>
                <p className="text-[11.5px] text-slate-500 font-medium">Update category details</p>
              </div>
              <button
                onClick={handleCancelCategoryEdit}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Category Title <span className="text-red-600">*</span></label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Speech Pathology" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                {adminFormErrors.catName && <p className="text-red-600 text-xs mt-1">{adminFormErrors.catName}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Short description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Certified physical mobilizers and speech therapists..." 
                  value={catDesc} 
                  onChange={e => setCatDesc(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Illustration Asset URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  value={catImage} 
                  onChange={e => setCatImage(e.target.value)} 
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-medical-green hover:bg-[#0fd08f] text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all cursor-pointer disabled:bg-slate-400"
              >
                {isSubmitting ? "UPDATING..." : "UPDATE CATEGORY"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking View Modal */}
      {isBookingViewModalOpen && viewingBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs" onClick={handleCloseBookingView}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="text-left">
                <h3 className="text-lg font-extrabold text-medical-blue">Booking Details</h3>
                <p className="text-[11.5px] text-slate-500 font-medium">View complete booking information</p>
              </div>
              <button
                onClick={handleCloseBookingView}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Customer Name</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 pl-6">{viewingBooking.customerName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Email</span>
                </div>
                <p className="text-sm text-slate-600 pl-6">{viewingBooking.customerEmail || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Service</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 pl-6">{viewingBooking.serviceTitle}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Provider</span>
                </div>
                <p className="text-sm text-slate-600 pl-6">{viewingBooking.vendorName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Date</span>
                  </div>
                  <p className="text-sm text-slate-600 pl-6">{viewingBooking.date}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Time</span>
                  </div>
                  <p className="text-sm text-slate-600 pl-6">{viewingBooking.timeSlot || "Flexible"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Region</span>
                </div>
                <p className="text-sm text-slate-600 pl-6">{viewingBooking.region}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Price</span>
                </div>
                <p className="text-sm font-bold text-blue-950 pl-6">{viewingBooking.price} {settingsData.defaultCurrency || 'AED'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Status</span>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold pl-6 ${
                  viewingBooking.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                  viewingBooking.status === "Active" ? "bg-blue-50 text-blue-700" :
                  viewingBooking.status === "Canceled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                }`}>
                  {viewingBooking.status || "Pending"}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">Payment</span>
                </div>
                <div className="pl-6 space-y-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getPaymentBadgeClass(viewingBooking.paymentStatus)}`}>
                    {viewingBooking.paymentStatus || "Unpaid"}
                  </span>
                  {viewingBooking.paymentResponseStatus && (
                    <p className="text-[11px] text-slate-500">Gateway status: {viewingBooking.paymentResponseStatus}</p>
                  )}
                  {viewingBooking.paymentTransactionUtr && (
                    <p className="text-[11px] text-slate-500 break-all">Transaction UTR: {viewingBooking.paymentTransactionUtr}</p>
                  )}
                  {viewingBooking.paymentAppUtr && (
                    <p className="text-[11px] text-slate-500 break-all">App UTR: {viewingBooking.paymentAppUtr}</p>
                  )}
                  {viewingBooking.paidAt && (
                    <p className="text-[11px] text-slate-500">Paid at: {String(viewingBooking.paidAt).slice(0, 19)}</p>
                  )}
                </div>
              </div>

              {viewingBooking.notes && (() => {
                let parsed: any = null;
                try { parsed = JSON.parse(viewingBooking.notes); } catch {}
                const hasItems = parsed?.items && Array.isArray(parsed.items);
                const hasAddress = parsed?.address;
                if (!hasItems && !hasAddress) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">Notes</span>
                      </div>
                      <p className="text-sm text-slate-600 pl-6 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">{viewingBooking.notes}</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Booking Notes</span>
                    </div>
                    <div className="pl-6 bg-slate-50 p-3 rounded-lg space-y-3 text-sm">
                      {hasAddress && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
                          <p className="text-slate-700 text-xs mt-0.5">{parsed.address}</p>
                        </div>
                      )}
                      {hasItems && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                          <div className="mt-1 space-y-2">
                            {parsed.items.map((item: any, idx: number) => (
                              <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-blue-950">{item.product?.title || "Service"}</span>
                                  <span className="text-[10px] font-bold text-slate-500">x{item.quantity || 1}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-[10px] text-slate-400">{item.product?.category || ""}</span>
                                  <span className="text-xs font-bold text-medical-green">{item.product?.price || 0} AED</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        title={pendingConfirm?.title || "Confirm Action"}
        message={pendingConfirm?.message || ""}
        confirmLabel={pendingConfirm?.confirmLabel || "Delete"}
        onConfirm={() => {
          pendingConfirm?.onConfirm();
          setPendingConfirm(null);
        }}
        onCancel={() => setPendingConfirm(null)}
      />

    </div>
  );
}
