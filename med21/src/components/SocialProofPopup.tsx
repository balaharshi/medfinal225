import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { HealthcareService, Product } from '../types';

interface SocialProofNotification {
  id: number;
  prefix: string;
  area: string;
  item: string;
  image: string;
  timeAgo: string;
  isService: boolean;
}

const PREFIXES = [
  'A customer',
];

const AREAS = [
  'JBR', 'Downtown Dubai', 'Dubai Marina', 'Business Bay', 'Al Nahda', 'Deira',
  'Bur Dubai', 'Jumeirah', 'Al Barsha', 'Motor City', 'Dubai Sports City',
  'Barsha Heights', 'DIP', 'JLT',
];

const TIME_OPTIONS = [
  { label: '1 min ago', weight: 3 },
  { label: '2 mins ago', weight: 4 },
  { label: '3 mins ago', weight: 5 },
  { label: '4 mins ago', weight: 5 },
  { label: '5 mins ago', weight: 5 },
  { label: '6 mins ago', weight: 4 },
  { label: '7 mins ago', weight: 3 },
  { label: '8 mins ago', weight: 3 },
  { label: '9 mins ago', weight: 2 },
  { label: '10 mins ago', weight: 2 },
];

const FALLBACK_IMAGE = '/images/services/Generic Nurse Visit.jpg';

function weightedRandom<T>(items: T[], weightFn: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + weightFn(item), 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= weightFn(item);
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface SocialProofPopupProps {
  services: HealthcareService[];
  products: Product[];
  cartOpen?: boolean;
}

export default function SocialProofPopup({ services, products, cartOpen }: SocialProofPopupProps) {
  const [notification, setNotification] = useState<SocialProofNotification | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifIdRef = useRef(0);
  const currentDelayRef = useRef(45000 + Math.random() * 30000);

  const generateNotification = (): SocialProofNotification => {
    const isService = Math.random() > 0.4;
    const list = isService ? services : products;
    const fallbackList = isService ? products : services;
    const activeList = list.length > 0 ? list : fallbackList;

    if (activeList.length === 0) {
      notifIdRef.current += 1;
      return {
        id: notifIdRef.current,
        prefix: 'Someone',
        area: 'Dubai',
        item: 'Medical Equipment',
        image: FALLBACK_IMAGE,
        timeAgo: '5 mins ago',
        isService: false,
      };
    }

    const item = pickRandom(activeList as any[]);
    const time = weightedRandom(TIME_OPTIONS, (t) => t.weight);
    notifIdRef.current += 1;

    return {
      id: notifIdRef.current,
      prefix: pickRandom(PREFIXES),
      area: pickRandom(AREAS),
      item: isService ? (item as HealthcareService).title : (item as Product).name,
      image: item.image || FALLBACK_IMAGE,
      timeAgo: time.label,
      isService,
    };
  };

  const showNotif = () => {
    const notif = generateNotification();
    setNotification(notif);
    setVisible(true);
    localStorage.setItem('socialProofLastShown', Date.now().toString());

    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setNotification(null);
        scheduleNext();
      }, 400);
    }, 6000);
  };

  const scheduleNext = () => {
    currentDelayRef.current += 50000 + Math.random() * 40000;
    timerRef.current = setTimeout(showNotif, currentDelayRef.current);
  };

  useEffect(() => {
    if (services.length === 0 && products.length === 0) return;

    const STORAGE_KEY = 'socialProofLastShown';
    const MIN_INTERVAL = 60000;
    const lastShown = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
    const elapsed = Date.now() - lastShown;
    const firstDelay = elapsed < MIN_INTERVAL ? Math.max(MIN_INTERVAL - elapsed, 5000) : 8000 + Math.random() * 12000;

    timerRef.current = setTimeout(showNotif, firstDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [services, products]);

  const handleClose = () => {
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    setTimeout(() => {
      setNotification(null);
      scheduleNext();
    }, 400);
  };

  useEffect(() => {
    if (cartOpen && notification) {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else if (!cartOpen && notification && !visible) {
      setTimeout(() => {
        setVisible(true);
        setTimeout(() => {
          setVisible(false);
          setTimeout(() => {
            setNotification(null);
            scheduleNext();
          }, 400);
        }, 6000);
      }, 300);
    }
  }, [cartOpen]);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 z-[9999] transition-all duration-[400ms] ease-in-out ${
        visible && !cartOpen
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200/80 flex items-center gap-3 p-2.5 pr-3 max-w-[300px] w-[280px]">
        <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
          <img
            src={notification.image}
            alt={notification.item}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-slate-700 leading-snug">
            <span className="font-semibold text-slate-800">{notification.prefix}</span>{' '}
            <span className="text-slate-500">from</span>{' '}
            <span className="font-semibold text-slate-800">{notification.area}</span>{' '}
            <span className="text-slate-500">{notification.isService ? 'booked' : 'rented'}</span>{' '}
          </p>
          <p className="text-[10px] text-slate-500 leading-snug mt-0.5 truncate font-medium">
            {notification.item}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">{notification.timeAgo}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 flex-shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
