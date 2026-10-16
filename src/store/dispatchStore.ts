import { useState, useEffect } from 'react';
import { DeliveryOrder, RiderProfile, DEFAULT_RESTAURANT } from '../types/dispatch';
import { Voucher, PASS_PRICING, PassDuration, generateVoucherCode, redeemVoucher } from '../utils/pricing';
import { playDispatchChime, playConfirmTick } from '../utils/audio';

const STORAGE_KEY = 'radar_dispatch_moto_db_v1';

const INITIAL_VOUCHERS: Voucher[] = [
  {
    code: 'K9X-24H',
    duration: '24h',
    priceDA: 300,
    createdAt: Date.now() - 3600000,
  },
  {
    code: 'V7Q-07D',
    duration: '7d',
    priceDA: 1500,
    createdAt: Date.now() - 7200000,
  },
  {
    code: 'R8P-30D',
    duration: '30d',
    priceDA: 5000,
    createdAt: Date.now() - 86400000,
  },
];

const INITIAL_RIDERS: RiderProfile[] = [
  {
    id: 'rider-1',
    name: 'Reda M.',
    phone: '0661 24 55 10',
    matricule: '09-4821-16',
    motoModel: 'Yamaha Crypton 115',
    passActive: true,
    passType: '24h',
    passExpiresAt: Date.now() + 18 * 3600 * 1000 + 42 * 60 * 1000 + 11 * 1000, // 18H 42M 11S
    status: 'EN_LIGNE',
    todayDeliveriesCount: 6,
    todayNetEarningsDA: 1650,
    currentCoords: { lat: 36.6395, lng: 2.769 },
  },
  {
    id: 'rider-2',
    name: 'Yacine B.',
    phone: '0555 78 91 23',
    matricule: '16-1934-21',
    motoModel: 'Sym Symphony ST 150',
    passActive: true,
    passType: '7d',
    passExpiresAt: Date.now() + 4 * 24 * 3600 * 1000,
    status: 'EN_COURSE',
    activeOrderId: 'CMD-102',
    todayDeliveriesCount: 9,
    todayNetEarningsDA: 2450,
    currentCoords: { lat: 36.643, lng: 2.75 },
  },
  {
    id: 'rider-3',
    name: 'Amine K.',
    phone: '0770 33 44 88',
    matricule: '42-0852-19',
    motoModel: 'Peugeot Tweet 125',
    passActive: false,
    passType: '24h',
    passExpiresAt: Date.now() - 3600 * 1000, // Expired 1h ago
    status: 'HORS_LIGNE',
    todayDeliveriesCount: 3,
    todayNetEarningsDA: 750,
    currentCoords: { lat: 36.641, lng: 2.765 },
  },
];

const INITIAL_ORDERS: DeliveryOrder[] = [
  {
    id: 'CMD-102',
    orderNumber: 102,
    restaurantName: DEFAULT_RESTAURANT.name,
    restaurantPhone: DEFAULT_RESTAURANT.phone,
    restaurantCoords: DEFAULT_RESTAURANT.coords,
    customerPhone: '0554 12 88 99',
    destinationName: 'Chaïba (Cité El Wouroud)',
    destinationCoords: { lat: 36.6575, lng: 2.7562 },
    exactGpsReceived: true,
    exactGpsCoords: { lat: 36.6582, lng: 2.7571 },
    exactGpsReceivedAt: Date.now() - 1200000,
    distanceKm: 3.2,
    estimatedDurationMin: 9,
    foodPrice: 1800,
    deliveryFee: 250,
    totalCustomer: 2050,
    surgeBonus: 0,
    bargainDelta: 0,
    status: 'ACCEPTED',
    riderMatricule: '16-1934-21',
    riderName: 'Yacine B.',
    createdAt: Date.now() - 1500000,
    acceptedAt: Date.now() - 1200000,
    routeCoordinates: [
      [36.6382, 2.7681],
      [36.648, 2.762],
      [36.6575, 2.7562],
    ],
  },
  {
    id: 'CMD-103',
    orderNumber: 103,
    restaurantName: DEFAULT_RESTAURANT.name,
    restaurantPhone: DEFAULT_RESTAURANT.phone,
    restaurantCoords: DEFAULT_RESTAURANT.coords,
    customerPhone: '0662 90 41 33',
    destinationName: 'Bou Ismaïl (Face La Poste)',
    destinationCoords: { lat: 36.6432, lng: 2.6931 },
    exactGpsReceived: false,
    distanceKm: 6.8,
    estimatedDurationMin: 16,
    foodPrice: 1350,
    deliveryFee: 400,
    totalCustomer: 1750,
    surgeBonus: 0,
    bargainDelta: 0,
    status: 'DISPATCH_WAITING',
    createdAt: Date.now() - 180000,
    routeCoordinates: [
      [36.6382, 2.7681],
      [36.64, 2.73],
      [36.6432, 2.6931],
    ],
  },
];

interface AppState {
  orders: DeliveryOrder[];
  riders: RiderProfile[];
  vouchers: Voucher[];
  activeRiderMatricule: string;
  nextOrderNumber: number;
}

function loadState(): AppState {
  if (typeof window === 'undefined') {
    return {
      orders: INITIAL_ORDERS,
      riders: INITIAL_RIDERS,
      vouchers: INITIAL_VOUCHERS,
      activeRiderMatricule: '09-4821-16',
      nextOrderNumber: 104,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        orders: INITIAL_ORDERS,
        riders: INITIAL_RIDERS,
        vouchers: INITIAL_VOUCHERS,
        activeRiderMatricule: '09-4821-16',
        nextOrderNumber: 104,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      orders: parsed.orders || INITIAL_ORDERS,
      riders: parsed.riders || INITIAL_RIDERS,
      vouchers: parsed.vouchers || INITIAL_VOUCHERS,
      activeRiderMatricule: parsed.activeRiderMatricule || '09-4821-16',
      nextOrderNumber: parsed.nextOrderNumber || 104,
    };
  } catch {
    return {
      orders: INITIAL_ORDERS,
      riders: INITIAL_RIDERS,
      vouchers: INITIAL_VOUCHERS,
      activeRiderMatricule: '09-4821-16',
      nextOrderNumber: 104,
    };
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or disabled
  }
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(loadState);

  // Sync state changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateState = (updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  // Actions
  const createOrder = (orderData: Omit<DeliveryOrder, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => {
    let newOrder: DeliveryOrder;
    updateState((prev) => {
      const num = prev.nextOrderNumber;
      newOrder = {
        ...orderData,
        id: `CMD-${num}`,
        orderNumber: num,
        status: 'DISPATCH_WAITING',
        createdAt: Date.now(),
      };
      return {
        ...prev,
        nextOrderNumber: num + 1,
        orders: [newOrder, ...prev.orders],
      };
    });
    playDispatchChime();
    return newOrder!;
  };

  const acceptOrder = (orderId: string, riderMatricule: string) => {
    updateState((prev) => {
      const rider = prev.riders.find((r) => r.matricule === riderMatricule);
      const orders = prev.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: 'ACCEPTED' as const,
            riderMatricule,
            riderName: rider ? rider.name : riderMatricule,
            acceptedAt: Date.now(),
          };
        }
        return o;
      });

      const riders = prev.riders.map((r) => {
        if (r.matricule === riderMatricule) {
          return {
            ...r,
            status: 'EN_COURSE' as const,
            activeOrderId: orderId,
          };
        }
        return r;
      });

      return {
        ...prev,
        orders,
        riders,
      };
    });
    playConfirmTick();
  };

  const deliverOrder = (orderId: string) => {
    updateState((prev) => {
      let feeEarned = 0;
      let targetMatricule = '';

      const orders = prev.orders.map((o) => {
        if (o.id === orderId) {
          feeEarned = o.deliveryFee;
          targetMatricule = o.riderMatricule || '';
          return {
            ...o,
            status: 'DELIVERED' as const,
            deliveredAt: Date.now(),
          };
        }
        return o;
      });

      const riders = prev.riders.map((r) => {
        if (r.matricule === targetMatricule || r.activeOrderId === orderId) {
          return {
            ...r,
            status: 'EN_LIGNE' as const,
            activeOrderId: undefined,
            todayDeliveriesCount: r.todayDeliveriesCount + 1,
            todayNetEarningsDA: r.todayNetEarningsDA + feeEarned,
          };
        }
        return r;
      });

      return {
        ...prev,
        orders,
        riders,
      };
    });
    playConfirmTick();
  };

  const updateOrderExactGps = (orderId: string, coords: { lat: number; lng: number }) => {
    updateState((prev) => {
      const orders = prev.orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            exactGpsReceived: true,
            exactGpsCoords: coords,
            exactGpsReceivedAt: Date.now(),
          };
        }
        return o;
      });
      return { ...prev, orders };
    });
    playConfirmTick();
  };

  const toggleRiderPassSimulation = (matricule: string) => {
    updateState((prev) => {
      const riders = prev.riders.map((r) => {
        if (r.matricule === matricule) {
          const newActive = !r.passActive;
          return {
            ...r,
            passActive: newActive,
            passExpiresAt: newActive
              ? Date.now() + 18 * 3600 * 1000 + 42 * 60 * 1000
              : Date.now() - 1000,
          };
        }
        return r;
      });
      return { ...prev, riders };
    });
  };

  const redeemPassWithVoucher = (code: string, matricule: string): { success: boolean; error?: string } => {
    let resultError: string | undefined;
    let resultSuccess = false;

    updateState((prev) => {
      const res = redeemVoucher(code, prev.vouchers, matricule);
      if (!res.success) {
        resultError = res.error;
        return prev;
      }
      resultSuccess = true;

      const durationMs = res.durationMs || 24 * 3600 * 1000;
      const durationType = res.durationType || '24h';

      const riders = prev.riders.map((r) => {
        if (r.matricule === matricule) {
          const currentExpiry = r.passExpiresAt > Date.now() ? r.passExpiresAt : Date.now();
          return {
            ...r,
            passActive: true,
            passType: durationType,
            passExpiresAt: currentExpiry + durationMs,
            status: 'EN_LIGNE' as const,
          };
        }
        return r;
      });

      return {
        ...prev,
        vouchers: res.updatedVouchers,
        riders,
      };
    });

    if (resultSuccess) playConfirmTick();
    return { success: resultSuccess, error: resultError };
  };

  const generateVoucher = (duration: PassDuration) => {
    let newVoucher: Voucher;
    updateState((prev) => {
      const code = generateVoucherCode(duration);
      newVoucher = {
        code,
        duration,
        priceDA: PASS_PRICING[duration].priceDA,
        createdAt: Date.now(),
      };
      return {
        ...prev,
        vouchers: [newVoucher, ...prev.vouchers],
      };
    });
    playConfirmTick();
    return newVoucher!;
  };

  const setActiveRiderMatricule = (matricule: string) => {
    updateState((prev) => ({ ...prev, activeRiderMatricule: matricule }));
  };

  const resetAllData = () => {
    const initial: AppState = {
      orders: INITIAL_ORDERS,
      riders: INITIAL_RIDERS,
      vouchers: INITIAL_VOUCHERS,
      activeRiderMatricule: '09-4821-16',
      nextOrderNumber: 104,
    };
    saveState(initial);
    setState(initial);
  };

  const activeRider =
    state.riders.find((r) => r.matricule === state.activeRiderMatricule) || state.riders[0];

  return {
    state,
    activeRider,
    createOrder,
    acceptOrder,
    deliverOrder,
    updateOrderExactGps,
    toggleRiderPassSimulation,
    redeemPassWithVoucher,
    generateVoucher,
    setActiveRiderMatricule,
    resetAllData,
  };
}
