/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
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
  Save
} from "lucide-react";
import ConfirmDialog from './ConfirmDialog';
import SocialAuthButtons from './SocialAuthButtons';

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
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    type: "",
    contact: "",
    address: "",
    rating: ""
  });
  const [profileFormErrors, setProfileFormErrors] = useState<Record<string, string>>({});
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    localStorage.removeItem("medziva_vendor_auth");
    localStorage.removeItem("medziva_vendor_id");
    localStorage.removeItem("medziva_vendor_data");
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const token = localStorage.getItem("medziva_vendor_token");
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.user?.role === 'vendor' && data?.vendor) {
            setIsAuthenticated(true);
            setVendorData(data.vendor);
          }
        }
      } catch (error) {
        console.error('Failed to restore vendor session', error);
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
        fetch(`/api/vendorBookings/${vendorData.id}`),
        fetch(`/api/vendorServices/${vendorData.id}`)
      ]);
      
      if (resBookings.ok) {
        const list = await resBookings.json();
        setBookingsList(list);
      }
      if (resServices.ok) {
        const list = await resServices.json();
        setServicesList(list);
      }
    } catch (e) {
      console.error("Error retrieving vendor data", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && vendorData) {
      fetchVendorData();
    }
  }, [isAuthenticated, vendorData]);

  // Handle Login Authentication
  const submitVendorLogin = async (values: VendorLoginFormValues) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch("/api/vendorLogin", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (data.accessToken) {
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
      const message = "Vendor access requires a linked vendor account. Please sign in with your vendor Google or Apple account.";
      setAuthError(message);
      toast.error(message);
      return;
    }

    if (data.accessToken) {
      localStorage.setItem("medziva_vendor_token", data.accessToken);
    }

    const sessionResponse = await fetch('/api/auth/session', {
      credentials: 'include',
      headers: data.accessToken ? { Authorization: `Bearer ${data.accessToken}` } : undefined,
    });
    const sessionData = await sessionResponse.json();
    if (!sessionResponse.ok || !sessionData?.vendor) {
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
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => undefined);
    setIsAuthenticated(false);
    setVendorData(null);
    triggerToast("Logged out successfully.");
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorData?.id) return;
    const newErrors: Record<string, string> = {};
    if (!(profileForm.name || vendorData?.name || '').trim()) newErrors.name = 'Business name is required';
    if (!(profileForm.type || vendorData?.type || '').trim()) newErrors.type = 'Business type is required';
    if (!(profileForm.contact || vendorData?.contact || '').trim()) newErrors.contact = 'Contact number is required';
    if (!(profileForm.address || vendorData?.address || '').trim()) newErrors.address = 'Address is required';
    if (Object.keys(newErrors).length > 0) {
      setProfileFormErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    setProfileFormErrors({});

    try {
      const response = await fetch(`/api/vendorProfile/${vendorData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        triggerToast("Profile updated successfully!");
        setVendorData({ ...vendorData, ...profileForm });
      } else {
        alert("Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    if (!vendorData?.id) return;

    setAcceptingBookingId(bookingId);
    try {
      const response = await fetch(`/api/vendorBookings/${vendorData.id}/${bookingId}/accept`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "This booking is no longer available.");
      }

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

  if (isSessionChecking) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-4 text-slate-500 text-xs">
        Restoring secure vendor session...
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
              <img src="/newlogo.png" alt="MedZiva Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
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

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  reset({
                    email: "vendor@medziva.ae",
                    password: "vendor123",
                  });
                  triggerToast("Demo credentials populated. Press Access Portal to proceed!");
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-bold hover:underline transition-all"
              >
                Use Demo Credentials (vendor@medziva.ae / vendor123)
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- VENDOR DASHBOARD RENDER ---
  return (
    <div id="vendor-portal" className="max-w-7xl mx-auto py-8 px-4 text-left">
      
      {/* 1. PORTAL HEADER BANNER */}
      <div className="border-b border-slate-200 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-purple-600 text-[10px] font-black uppercase tracking-widest block py-0.5 px-2 bg-purple-50 rounded-full">
              VENDOR PARTNER PORTAL
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
          </div>
          <h1 className="text-2xl font-black text-blue-950 tracking-tight flex items-center gap-2">
            <span>{vendorData?.name || "Vendor Dashboard"}</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
            Manage your healthcare services, track bookings, and update your business profile from this centralized vendor console.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => {
              fetchVendorData();
              triggerToast("Data synchronized successfully.");
            }}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border border-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-950 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>

          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 cursor-pointer text-rose-700 px-3.5 py-2 rounded-lg text-xs font-extrabold transition-all border border-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* 2. SIDEBAR NAVIGATION */}
        <aside className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs h-fit lg:sticky lg:top-24">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-xs font-black text-blue-950">Vendor Menu</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Portal navigation</p>
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
                  onClick={() => setActivePane(pane.id as any)}
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

        <div className="min-w-0">
          {/* 3. DASHBOARD METRICS */}
          {activePane === "dashboard" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No bookings yet. Your services will appear here once customers book them.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
                        <div className="flex items-center justify-between gap-3 mt-2">
                          <p className="text-[10px] text-slate-400">{book.date} • {book.price} AED</p>
                          {isAvailableRequest && (
                            <button
                              type="button"
                              onClick={() => handleAcceptBooking(book.id)}
                              disabled={acceptingBookingId === book.id}
                              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1.5 disabled:bg-slate-400"
                            >
                              {acceptingBookingId === book.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Accept
                            </button>
                          )}
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
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No services listed yet. Contact admin to add your services to the platform.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
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
              <div className="py-12 text-center text-slate-400 text-xs">
                No bookings found.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
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
                      <p className="text-[10px] text-slate-400">{book.date} • {book.customerPhone || "No phone"}</p>
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
              <div className="py-12 text-center text-slate-400 text-xs">
                No services found. Contact admin to add your services.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No accepted booking revenue yet.
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
                <h3 className="font-extrabold text-blue-950 text-sm">Profile Settings</h3>
                <p className="text-[10.5px] text-slate-400">Update your business information</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Business Name <span className="text-red-600">*</span></label>
                <input
                  required
                  type="text"
                  value={profileForm.name || vendorData?.name || ""}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                />
                {profileFormErrors.name && <p className="text-red-600 text-xs mt-1">{profileFormErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Business Type <span className="text-red-600">*</span></label>
                <input
                  required
                  type="text"
                  value={profileForm.type || vendorData?.type || ""}
                  onChange={e => setProfileForm({ ...profileForm, type: e.target.value })}
                  className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                />
                {profileFormErrors.type && <p className="text-red-600 text-xs mt-1">{profileFormErrors.type}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Contact Number <span className="text-red-600">*</span></label>
                <input
                  required
                  type="text"
                  value={profileForm.contact || vendorData?.contact || ""}
                  onChange={e => setProfileForm({ ...profileForm, contact: e.target.value })}
                  className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                />
                {profileFormErrors.contact && <p className="text-red-600 text-xs mt-1">{profileFormErrors.contact}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Address <span className="text-red-600">*</span></label>
                <input
                  required
                  type="text"
                  value={profileForm.address || vendorData?.address || ""}
                  onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs px-4 py-3 border border-slate-200 rounded-xl focus:border-medical-green focus:outline-none focus:ring-1 focus:ring-medical-green"
                />
                {profileFormErrors.address && <p className="text-red-600 text-xs mt-1">{profileFormErrors.address}</p>}
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-purple-950 hover:bg-purple-900 text-white text-xs font-bold tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Update Profile
              </button>
            </form>
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
  );
}
