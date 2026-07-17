/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { 
  Lock, 
  Unlock, 
  LayoutDashboard, 
  HeartPulse, 
  Calendar, 
  DollarSign, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Clock,
  Loader2,
  LockKeyhole,
  TrendingUp,
  Package,
  LogOut,
  Save,
  FileText,
  Bell,
  Plus,
  ChevronRight,
  X
} from "lucide-react";
import ConfirmDialog from './ConfirmDialog';
import SocialAuthButtons from './SocialAuthButtons';
import SafeImage from './SafeImage';
import { subscribeToVendorChannel } from '../services/pusherClient';

interface VendorDashboardProps {
  triggerToast: (msg: string) => void;
}

interface VendorLoginFormValues {
  email: string;
  password: string;
}

export default function VendorDashboard({ triggerToast }: VendorDashboardProps) {
  // Login Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionChecking, setIsSessionChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [vendorData, setVendorData] = useState<any>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorLoginFormValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Active Pane Tab inside Vendor Console
  const [activePane, setActivePane] = useState<"dashboard" | "bookings" | "services" | "reports" | "profile">("dashboard");

  // Dynamic lists from backend
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);
  const [updatingBookingStatus, setUpdatingBookingStatus] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Profile form states
  const [profileChangeField, setProfileChangeField] = useState("name");
  const [profileChangeValue, setProfileChangeValue] = useState("");
  const [profileChangeReason, setProfileChangeReason] = useState("");
  const [profileChangeRequests, setProfileChangeRequests] = useState<any[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    localStorage.removeItem("medziva_vendor_auth");
    localStorage.removeItem("medziva_vendor_id");
    localStorage.removeItem("medziva_vendor_data");
  }, []);



  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const data = await api.get<{ user?: { role?: string }; vendor?: unknown }>('/api/auth/session');
        if (data?.user?.role === 'vendor' && data?.vendor) {
          setIsAuthenticated(true);
          setVendorData(data.vendor);
        }
      } catch (error) {

        localStorage.removeItem("medziva_vendor_token");
        setIsAuthenticated(false);
      } finally {
        setIsSessionChecking(false);
      }
    };

    hydrateSession();
  }, []);

  // Fetch vendor data
  const fetchVendorData = async () => {
    if (!vendorData?.id) return;
    
    setIsLoadingData(true);
    try {
      const [resBookings, resServices] = await Promise.all([
        api.get<any[]>(`/api/vendorBookings/${vendorData.id}`),
        api.get<any[]>(`/api/vendorServices/${vendorData.id}`)
      ]);

      setBookingsList(resBookings);
      setServicesList(resServices);
    } catch (e) {
      toast.error("Failed to load vendor data. Please try again.");
    } finally {
      setIsLoadingData(false);
      setLastSyncTime(new Date());
    }
  };

  useEffect(() => {
    if (isAuthenticated && vendorData) {
      fetchVendorData();
    }
  }, [isAuthenticated, vendorData]);

  const loadProfileChangeRequests = async () => {
    if (!vendorData?.id) return;
    try {
      const data = await api.get<any[]>(`/api/vendorProfile/${vendorData.id}/change-requests`);
      setProfileChangeRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load profile change requests.");
    }
  };

  useEffect(() => {
    if (activePane === 'profile' && vendorData?.id) { /* no-op */ }
  }, [activePane, vendorData?.id]);

  // Subscribe to real-time booking notifications via Pusher
  useEffect(() => {
    if (!isAuthenticated || !vendorData?.id) return undefined;

    return subscribeToVendorChannel(vendorData.id, (payload) => {
      toast.success(payload.message || 'New booking available!');
      fetchVendorData();
    });
  }, [isAuthenticated, vendorData?.id]);

  // Handle Login Authentication
  const submitVendorLogin = async (values: VendorLoginFormValues) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.post<{ success?: boolean; accessToken?: string; vendor?: unknown; error?: string }>("/api/vendorLogin", {
        body: { email: values.email, password: values.password },
      });
      if (data.success) {
        if (data.accessToken) {
          localStorage.removeItem("medziva_user_token");
          localStorage.removeItem("medziva_admin_token");
          localStorage.setItem("medziva_vendor_token", data.accessToken);
        }
        setIsAuthenticated(true);
        setVendorData(data.vendor);
        setIsSessionChecking(false);
        triggerToast("Welcome back! Vendor dashboard access granted.");
        reset();
      } else {
        const message = data.error || "Invalid credentials. Please retry.";
        setAuthError(message);
        toast.error(message);
      }
    } catch (err) {
      const message = "Internal server connectivity issue. Failed to authenticate.";
      setAuthError(message);
      toast.error(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVendorSocialLogin = async (data: any) => {
    if (data?.user?.role !== "vendor") {
      const message = "Vendor access requires a linked vendor account. Please sign in with your vendor Google account.";
      setAuthError(message);
      toast.error(message);
      return;
    }

    if (data.accessToken) {
      localStorage.setItem("medziva_vendor_token", data.accessToken);
    }

    const sessionData = await api.get<{ vendor?: unknown }>('/api/auth/session');
    if (!sessionData?.vendor) {
      const message = "Vendor account is not linked to a provider profile.";
      setAuthError(message);
      toast.error(message);
      return;
    }

    setIsAuthenticated(true);
    setVendorData(sessionData.vendor);
    setIsSessionChecking(false);
    triggerToast("Welcome back! Vendor dashboard access granted.");
    reset();
  };

  const handleVendorSocialError = (message: string) => {
    setAuthError(message);
    toast.error(message);
  };

  // Perform logout
  const handleLogout = () => {
    localStorage.removeItem("medziva_vendor_token");
    api.post('/api/auth/logout').catch(() => undefined);
    setIsAuthenticated(false);
    setVendorData(null);
    triggerToast("Logged out successfully.");
  };

  // Handle profile update
  const handleProfileChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorData?.id) return;
    if (!profileChangeValue.trim()) {
      toast.error('Please enter the new value');
      return;
    }

    try {
      const response = await api.post<{ error?: string }>(`/api/vendorProfile/${vendorData.id}/change-requests`, {
        body: {
          fieldName: profileChangeField,
          requestedValue: profileChangeValue.trim(),
          reason: profileChangeReason.trim() || undefined,
        },
      });

      toast.success("Change request submitted. Admin will review it.");
      setProfileChangeValue("");
      setProfileChangeReason("");
      loadProfileChangeRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit request.");
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!vendorData?.id) return;

    setAcceptingBookingId(bookingId);
    try {
      await api.post(`/api/vendorBookings/${vendorData.id}/${bookingId}/accept`);

      triggerToast("Booking accepted successfully.");
      await fetchVendorData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not accept booking.";
      toast.error(message);
      await fetchVendorData();
    } finally {
      setAcceptingBookingId(null);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    if (!vendorData?.id) return;

    setUpdatingBookingStatus(bookingId);
    const previousStatus = bookingsList.find(b => b.id === bookingId)?.status;

    setBookingsList(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b)
    );

    try {
      await api.patch(`/api/vendorBookings/${vendorData.id}/${bookingId}/status`, {
        body: { status: newStatus },
      });
      toast.success(`Booking marked as ${newStatus}`);
    } catch (error) {
      if (previousStatus) {
        setBookingsList(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: previousStatus } : b)
        );
      }
      const message = error instanceof Error ? error.message : "Failed to update booking status.";
      toast.error(message);
    } finally {
      setUpdatingBookingStatus(null);
    }
  };

  // Calculate metrics
  const metrics = {
    totalBookings: bookingsList.length,
    completedBookings: bookingsList.filter(b => b.status === "Completed").length,
    pendingBookings: bookingsList.filter(b => b.status === "Pending" || !b.status).length,
    totalRevenue: bookingsList.filter(b => b.vendorId === vendorData?.id).reduce((acc, curr) => acc + (curr.price || 0), 0),
    activeServices: servicesList.length
  };

  const vendorReportMetrics = useMemo(() => {
    const ownedBookings = bookingsList.filter((booking) => booking.vendorId === vendorData?.id || booking.vendorName === vendorData?.name);
    const availableRequests = bookingsList.filter((booking) => !booking.vendorId && (booking.status === "Pending" || !booking.status));
    const completedBookings = ownedBookings.filter((booking) => booking.status === "Completed");
    const activeBookings = ownedBookings.filter((booking) => booking.status === "Active");
    const totalRevenue = ownedBookings.reduce((sum, booking) => sum + (Number(booking.price) || 0), 0);
    const completionRate = ownedBookings.length > 0 ? Math.round((completedBookings.length / ownedBookings.length) * 100) : 0;
    const acceptanceLoad = bookingsList.length > 0 ? Math.round((ownedBookings.length / bookingsList.length) * 100) : 0;
    const revenueByService = ownedBookings.reduce((acc, booking) => {
      const title = booking.serviceTitle || "Unassigned service";
      acc[title] = (acc[title] || 0) + (Number(booking.price) || 0);
      return acc;
    }, {} as Record<string, number>);
    const topServices = (Object.entries(revenueByService) as Array<[string, number]>)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      ownedBookings,
      availableRequests,
      completedBookings,
      activeBookings,
      totalRevenue,
      completionRate,
      acceptanceLoad,
      topServices,
    };
  }, [bookingsList, vendorData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatRelativeTime = (date: Date | null) => {
    if (!date) return "Never";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatExpiryCountdown = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const minutes = Math.floor((diff % 3600000) / 60000);
    return { text: `Expires in ${hours}h ${minutes}m`, urgent: hours < 1 };
  };

  const pendingBookingsCount = bookingsList.filter(b => b.status === "Pending" || !b.status).length;

  if (isSessionChecking) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-4 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span className="text-slate-400 text-xs font-medium">Restoring secure vendor session...</span>
      </div>
    );
  }

  // --- LOGIN PAGE RENDER (WALL) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4 sm:p-6 text-left">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Accent decoration rings */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-purple-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-50 rounded-full mix-blend-multiply filter blur-xl opacity-70 -ml-12 -mb-12"></div>

          <div className="relative text-center space-y-6">
            <div className="w-20 h-20 bg-white mx-auto rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm p-3">
              <SafeImage src="/newlogo.png" alt="MedZiva Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-600 block mb-1">Vendor Portal</span>
              <h2 className="text-2xl font-black text-blue-950">MedZiva Partner Access</h2>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Authorized healthcare providers only. Enter your credentials to manage bookings, services, and profile information.
              </p>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(submitVendorLogin)} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Address <span className="text-red-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="vendor@medziva.ae"
                    {...register("email", {
                      required: "Vendor email is required",
                      pattern: {
                        value: /^\S+@\S+\.\S+$/,
                        message: "Please enter a valid email address",
                      },
                    })}
                    className="w-full text-xs pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                  />
                </div>
                {errors.email && <p className="text-[10px] font-semibold text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Password <span className="text-red-600">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
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
                {errors.password && <p className="text-[10px] font-semibold text-red-600">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 bg-purple-950 hover:bg-purple-900 text-white text-xs font-bold tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
              >
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>ACCESS PORTAL</span>
                  </>
                )}
              </button>
            </form>

            <SocialAuthButtons
              disabled={authLoading}
              googlePath="/api/auth/google/vendor"
              onSuccess={handleVendorSocialLogin}
              onError={handleVendorSocialError}
            />

          </div>

        </div>
      </div>
    );
  }

  // --- VENDOR DASHBOARD RENDER ---
  return (
    <div id="vendor-portal" className="min-h-screen bg-slate-50 lg:bg-transparent">
      {/* Mobile Header Bar */}
      <div className="lg:hidden sticky top-0 bg-white border-b border-slate-200 z-20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-xs font-black text-white">{(vendorData?.name || "V").charAt(0)}</span>
          </div>
          <span className="text-sm font-black text-blue-950">{vendorData?.name?.split(" ")[0] || "Vendor"}</span>
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

      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 text-left">
      
      {/* 1. PORTAL HEADER BANNER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
              {vendorData?.logo ? (
                <SafeImage src={vendorData.logo} alt={vendorData.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-black text-white">{(vendorData?.name || "V").charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest py-0.5 px-2 bg-purple-50 rounded-full">
                  VENDOR PARTNER
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online"></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                {getGreeting()}, {vendorData?.name || "Partner"} <span className="inline-block animate-[wave_0.4s_ease-in-out_1]">👋</span>
              </h1>
              <p className="text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
                Manage your healthcare services, track bookings, and update your business profile.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium">Last Sync: <span className="font-bold text-slate-600">{formatRelativeTime(lastSyncTime)}</span></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                fetchVendorData();
                triggerToast("Data synchronized successfully.");
              }}
              disabled={isLoadingData}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-950 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            <div className="relative">
              <button
                onClick={() => triggerToast(`${pendingBookingsCount} pending booking(s) awaiting your attention.`)}
                className="flex items-center justify-center w-10 h-10 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-600 rounded-xl transition-all border border-slate-200"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
              </button>
              {pendingBookingsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm">
                  {pendingBookingsCount}
                </span>
              )}
            </div>

            <button
              onClick={() => setActivePane("profile")}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200"
              title="Profile"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <span className="hidden sm:inline">{vendorData?.name?.split(" ")[0] || "Profile"}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 cursor-pointer text-rose-700 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all border border-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* 2. SIDEBAR NAVIGATION */}
        <aside className={`bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs h-fit lg:sticky lg:top-24 transition-transform duration-300 ${
          isMobileSidebarOpen ? 'fixed inset-y-0 left-0 w-64 z-40 rounded-none border-r border-y-0 border-y-slate-200 overflow-y-auto' : ''
        }`}>
          <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-blue-950">Vendor Menu</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Portal navigation</p>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "bookings", label: "My Bookings", icon: Calendar },
              { id: "services", label: "My Services", icon: HeartPulse },
              { id: "reports", label: "Reports", icon: TrendingUp },
              { id: "profile", label: "Profile", icon: User }
            ].map((pane) => {
              const isSelected = activePane === pane.id;
              return (
                <button
                  key={pane.id}
                  onClick={() => {
                    setActivePane(pane.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-3 flex items-center gap-2 text-xs font-extrabold rounded-xl cursor-pointer transition-all text-left ${
                    isSelected 
                      ? "bg-purple-50 text-blue-950 border border-purple-100" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <pane.icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                  <span>{pane.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 relative">
          {isLoadingData && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="text-[10px] text-slate-400 font-medium">Loading data...</span>
              </div>
            </div>
          )}

          {/* 3. DASHBOARD METRICS */}
          {activePane === "dashboard" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 overflow-x-auto">
              {[
                { label: "Total Bookings", count: metrics.totalBookings, tag: "All time", color: "bg-blue-50 border-blue-100 text-blue-600", icon: Calendar },
                { label: "Completed", count: metrics.completedBookings, tag: "Successfully delivered", color: "bg-emerald-50 border-emerald-100 text-emerald-600", icon: CheckCircle2 },
                { label: "Pending", count: metrics.pendingBookings, tag: "Awaiting confirmation", color: "bg-amber-50 border-amber-100 text-amber-600", icon: Clock },
                { label: "Total Revenue", count: `${metrics.totalRevenue} AED`, tag: "Gross earnings", color: "bg-purple-50 border-purple-100 text-purple-600", icon: DollarSign }
              ].map((c, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={`w-4 h-4 ${c.color.split(' ')[2]}`} />
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block leading-none">{c.label}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-blue-950 mt-1">{c.count}</div>
                  <span className="text-[9px] text-slate-500 block leading-tight mt-1">{c.tag}</span>
                </div>
              ))}
            </div>
          )}

          {/* 4. CONTENT MODULES */}
          <div className="min-h-[400px]">

        {/* ---- DASHBOARD VIEW ---- */}
        {activePane === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-blue-950">Welcome, {vendorData?.name || "Partner"}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Your vendor dashboard provides real-time insights into your service performance, booking status, and revenue metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Bookings */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">Recent Bookings</h3>
                    <p className="text-[10.5px] text-slate-400">Latest service requests from customers</p>
                  </div>
                </div>

                {bookingsList.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">No bookings yet</p>
                    <p className="text-slate-300 text-[10px] mt-1">Your services will appear here once customers book them.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-auto pr-1">
                    {bookingsList.slice(0, 5).map((book) => {
                      const isAvailableRequest = !book.vendorId && (book.status === "Pending" || !book.status);
                      return (
                      <div key={book.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-blue-950">{book.customerName}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            book.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                            book.status === "Active" ? "bg-blue-50 text-blue-700" :
                            book.status === "Canceled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {isAvailableRequest ? "Available" : book.status || "Pending"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{book.serviceTitle}</p>
                        {(book.category || book.subcategory) && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {book.category && <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-1.5 py-0.5">{book.category}</span>}
                            {book.subcategory && <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5">{book.subcategory}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <p className="text-[10px] text-slate-400">{book.date} • {book.price} AED</p>
                          <div className="flex items-center gap-1.5">
                            {(() => {
                              const expiry = formatExpiryCountdown(book.expires_at);
                              if (expiry && (book.status === "Pending" || !book.status)) {
                                return (
                                  <span className={`text-[9px] font-bold ${expiry.urgent ? 'text-red-600' : 'text-amber-600'}`}>
                                    {expiry.text}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {book.customerPhone && (
                              <a
                                href={`tel:${book.customerPhone}`}
                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100"
                                title={`Call ${book.customerPhone}`}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                            {isAvailableRequest && (
                              <button
                                type="button"
                                onClick={() => handleAcceptBooking(book.id)}
                                disabled={acceptingBookingId === book.id}
                                className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1.5 disabled:bg-slate-400"
                              >
                                {acceptingBookingId === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Accept
                              </button>
                            )}
                            {book.vendorId === vendorData?.id && book.status === "Active" && (
                              <div className="flex items-center gap-1.5">
                              {updatingBookingStatus === book.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(book.id, "In Progress")}
                                    className="h-7 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-bold border border-blue-100"
                                  >
                                    In Progress
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(book.id, "Completed")}
                                    className="h-7 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold border border-emerald-100"
                                  >
                                    Completed
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(book.id, "Canceled")}
                                    className="h-7 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[9px] font-bold border border-rose-100"
                                  >
                                    Canceled
                                  </button>
                                </>
                              )}
                            </div>
                              )}
                            </div>
                          </div>
                          </div>
                        );})}
                      </div>
                    )}
                </div>

              {/* Active Services */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm">My Services</h3>
                    <p className="text-[10.5px] text-slate-400">Healthcare services you offer</p>
                  </div>
                  <span className="text-[10px] uppercase font-black bg-purple-50 text-purple-600 py-0.5 px-2 rounded-full">
                    {metrics.activeServices} Active
                  </span>
                </div>

                {servicesList.length === 0 ? (
                  <div className="py-12 text-center">
                    <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">No services listed yet</p>
                    <p className="text-slate-300 text-[10px] mt-1">Contact admin to add your services to the platform.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-auto pr-1">
                    {servicesList.map((srv) => (
                      <div key={srv.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50">
                        <h4 className="text-xs font-black text-blue-950 mb-1">{srv.title}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2">{srv.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-medical-green">{srv.price} AED</span>
                          <span className="text-[9px] text-slate-400">{srv.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- BOOKINGS VIEW ---- */}
        {activePane === "bookings" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">All Bookings</h3>
                <p className="text-[10.5px] text-slate-400">Complete booking history</p>
              </div>
            </div>

            {bookingsList.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-medium">No bookings found</p>
                <p className="text-slate-300 text-[10px] mt-1">Booking requests will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-auto pr-1">
                {bookingsList.map((book) => {
                  const isAvailableRequest = !book.vendorId && (book.status === "Pending" || !book.status);
                  return (
                  <div key={book.id} className="p-4 border border-slate-150 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-blue-950">{book.customerName}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          book.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                          book.status === "Active" ? "bg-blue-50 text-blue-700" :
                          book.status === "Canceled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {isAvailableRequest ? "Available" : book.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{book.serviceTitle}</p>
                      {(book.category || book.subcategory) && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {book.category && <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-1.5 py-0.5">{book.category}</span>}
                          {book.subcategory && <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5">{book.subcategory}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{book.date}</span>
                        {book.customerPhone && (
                          <>
                            <span>•</span>
                            <a href={`tel:${book.customerPhone}`} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold">
                              <Phone className="w-3 h-3" />{book.customerPhone}
                            </a>
                          </>
                        )}
                        {!book.customerPhone && <span>No phone</span>}
                      </div>
                      {(() => {
                        const expiry = formatExpiryCountdown(book.expires_at);
                        if (expiry && (book.status === "Pending" || !book.status)) {
                          return (
                            <span className={`text-[9px] font-bold ${expiry.urgent ? 'text-red-600' : 'text-amber-600'}`}>
                              {expiry.text}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      <span className="text-sm font-black text-medical-green">{book.price} AED</span>
                      {isAvailableRequest && (
                        <button
                          type="button"
                          onClick={() => handleAcceptBooking(book.id)}
                          disabled={acceptingBookingId === book.id}
                          className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1.5 disabled:bg-slate-400"
                        >
                          {acceptingBookingId === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Accept Booking
                        </button>
                      )}
                      {book.vendorId === vendorData?.id && book.status === "Active" && (
                        <div className="flex items-center gap-1.5">
                          {updatingBookingStatus === book.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(book.id, "In Progress")}
                                className="h-8 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-100"
                              >
                                In Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(book.id, "Completed")}
                                className="h-8 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-100"
                              >
                                Completed
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(book.id, "Canceled")}
                                className="h-8 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-100"
                              >
                                Canceled
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );})}
              </div>
            )}
          </div>
        )}

        {/* ---- SERVICES VIEW ---- */}
        {activePane === "services" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">My Services</h3>
                <p className="text-[10.5px] text-slate-400">Services you provide on the platform</p>
              </div>
            </div>

            {servicesList.length === 0 ? (
              <div className="py-12 text-center">
                <HeartPulse className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-medium">No services found</p>
                <p className="text-slate-300 text-[10px] mt-1">Contact admin to add your services.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto">
                {servicesList.map((srv) => (
                  <div key={srv.id} className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="text-xs font-black text-blue-950 mb-2 line-clamp-1">{srv.title}</h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-3">{srv.description}</p>
                    <div className="space-y-1.5 text-[9.5px] font-bold text-slate-500">
                      <div className="flex items-center justify-between gap-2">
                        <span>Category</span>
                        <span className="text-slate-700 text-right">{srv.category || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Subcategory</span>
                        <span className="text-slate-700 text-right">{srv.subcategory || "None"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span>Status</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">{srv.status || "Enabled"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- REPORTS VIEW ---- */}
        {activePane === "reports" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm">Reports & Analytics</h3>
                  <p className="text-[10.5px] text-slate-400">Booking performance, revenue, and available request load</p>
                </div>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                {[
                  { label: "Accepted Bookings", value: vendorReportMetrics.ownedBookings.length, tag: "Assigned to your account" },
                  { label: "Available Requests", value: vendorReportMetrics.availableRequests.length, tag: "Eligible pending queue" },
                  { label: "Completion Rate", value: `${vendorReportMetrics.completionRate}%`, tag: "Completed from assigned" },
                  { label: "Gross Revenue", value: `${vendorReportMetrics.totalRevenue} AED`, tag: "Assigned booking value" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-150 bg-slate-50/70 p-4">
                    <span className="text-[9px] uppercase font-black text-slate-400">{item.label}</span>
                    <div className="text-lg font-black text-blue-950 mt-1">{item.value}</div>
                    <span className="text-[9px] text-slate-500 block mt-1">{item.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
                <h4 className="font-extrabold text-blue-950 text-sm mb-1">Booking Status Analytics</h4>
                <p className="text-[10.5px] text-slate-400 mb-5">Your current operational workload</p>
                <div className="space-y-4">
                  {[
                    { label: "Active", value: vendorReportMetrics.activeBookings.length, color: "bg-blue-600" },
                    { label: "Completed", value: vendorReportMetrics.completedBookings.length, color: "bg-emerald-600" },
                    { label: "Available", value: vendorReportMetrics.availableRequests.length, color: "bg-amber-500" },
                  ].map((item) => {
                    const total = Math.max(bookingsList.length, 1);
                    const width = Math.max((item.value / total) * 100, item.value > 0 ? 8 : 0);
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600">{item.label}</span>
                          <span className="font-black text-blue-950">{item.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left">
                <h4 className="font-extrabold text-blue-950 text-sm mb-1">Revenue by Service</h4>
                <p className="text-[10.5px] text-slate-400 mb-5">Top assigned service categories by value</p>
                {vendorReportMetrics.topServices.length === 0 ? (
                  <div className="py-12 text-center">
                    <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-xs font-medium">No revenue data yet</p>
                    <p className="text-slate-300 text-[10px] mt-1">Revenue will appear once bookings are completed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendorReportMetrics.topServices.map(([title, value]) => {
                      const width = Math.max((value / Math.max(vendorReportMetrics.totalRevenue, 1)) * 100, 8);
                      return (
                        <div key={title} className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-bold text-slate-600 truncate">{title}</span>
                            <span className="font-black text-blue-950 shrink-0">{value} AED</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-2 rounded-full bg-purple-700" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- PROFILE VIEW ---- */}
        {activePane === "profile" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs text-left max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm">Profile Information</h3>
                <p className="text-[10.5px] text-slate-400">Your business profile (read-only). Submit a change request to update.</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { label: "Business Name", value: vendorData?.name },
                { label: "Business Type", value: vendorData?.type },
                { label: "Email", value: vendorData?.email },
                { label: "Contact Number", value: vendorData?.contact },
                { label: "Address", value: vendorData?.address },
                { label: "Service Area", value: vendorData?.address },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32 shrink-0 pt-0.5">{item.label}</span>
                  <span className="text-xs text-slate-700 font-medium">{item.value || "—"}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-extrabold text-blue-950 text-xs mb-3">Request Profile Change</h4>
              <form onSubmit={handleProfileChangeRequest} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Field to Change</label>
                  <select
                    value={profileChangeField}
                    onChange={e => setProfileChangeField(e.target.value)}
                    className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none"
                  >
                    <option value="name">Business Name</option>
                    <option value="type">Business Type</option>
                    <option value="contact">Contact Number</option>
                    <option value="address">Address</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">New Value <span className="text-red-600">*</span></label>
                  <input
                    required
                    type="text"
                    value={profileChangeValue}
                    onChange={e => setProfileChangeValue(e.target.value)}
                    placeholder={`Enter new ${profileChangeField}`}
                    className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Reason (optional)</label>
                  <textarea
                    value={profileChangeReason}
                    onChange={e => setProfileChangeReason(e.target.value)}
                    placeholder="Why do you need this change?"
                    rows={2}
                    className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-10 bg-purple-950 hover:bg-purple-900 text-white text-xs font-bold tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Submit Change Request
                </button>
              </form>
            </div>

            {profileChangeRequests.length > 0 && (
              <div className="border-t border-slate-100 pt-4 mt-4">
                <h4 className="font-extrabold text-blue-950 text-xs mb-3">Previous Requests</h4>
                <div className="space-y-2">
                  {profileChangeRequests.slice(0, 5).map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl text-[11px]">
                      <div>
                        <span className="font-bold text-slate-600 capitalize">{req.fieldName}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="text-slate-700">{req.requestedValue}</span>
                      </div>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {profileChangeRequests.length === 0 && (
              <div className="border-t border-slate-100 pt-4 mt-4 text-center">
                <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-slate-400 text-[10px]">No previous change requests.</p>
              </div>
            )}
          </div>
        )}

          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
    </div>
  );
}
