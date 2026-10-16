/**
 * Core pricing, distance, voucher, and dispatch calculation engine.
 * Pure logic decoupled from UI for deterministic testing and reliability.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export type PassDuration = '24h' | '7d' | '30d';

export interface Voucher {
  code: string;
  duration: PassDuration;
  priceDA: number;
  createdAt: number;
  usedAt?: number;
  usedByMatricule?: string;
}

export const PASS_PRICING: Record<PassDuration, { priceDA: number; durationMs: number; label: string }> = {
  '24h': {
    priceDA: 300,
    durationMs: 24 * 60 * 60 * 1000,
    label: 'PASS 24 HEURES',
  },
  '7d': {
    priceDA: 1500,
    durationMs: 7 * 24 * 60 * 60 * 1000,
    label: 'PASS 7 JOURS',
  },
  '30d': {
    priceDA: 5000,
    durationMs: 30 * 24 * 60 * 60 * 1000,
    label: 'PASS 30 JOURS',
  },
};

/**
 * Calculate distance in kilometers using the Haversine formula
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Fallback road distance multiplier when OSRM is offline or rate-limited.
 * Empirical urban motorcycle road factor: ~1.28x direct line.
 */
export function estimateRoadDistanceKm(haversineKm: number): number {
  return Number((haversineKm * 1.28).toFixed(1));
}

/**
 * Exact Road Distance & 50 DA Rounding Engine:
 * - Base <= 2.0 km = 200 DA
 * - Above 2.0 km = 200 + ((km - 2) * 40)
 * - Rain/Night Surge: +50 DA
 * - Manual inDrive Adjustment: +/- delta
 * - Rounded to nearest 50 DA multiple
 * - Minimum floor: 200 DA
 */
export function calculateDeliveryFee(
  distanceKm: number,
  surgeBonus: number = 0,
  manualAdjustment: number = 0
): number {
  const effectiveDistance = Math.max(0, distanceKm);
  let raw = 200;
  if (effectiveDistance > 2.0) {
    raw = 200 + (effectiveDistance - 2.0) * 40;
  }
  raw += surgeBonus + manualAdjustment;
  // Always round to the nearest 50 DA multiple
  const rounded = Math.round(raw / 50) * 50;
  return Math.max(200, rounded);
}

/**
 * Calculate total customer cash due
 */
export function calculateTotalCustomer(foodPriceDA: number, deliveryFeeDA: number): number {
  return Math.max(0, foodPriceDA) + Math.max(0, deliveryFeeDA);
}

/**
 * Generate high-contrast, easy-to-read voucher code (e.g. "K9X-24H" or "V7Q-07D")
 */
export function generateVoucherCode(duration: PassDuration): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed ambiguous 0, 1, I, O
  let prefix = '';
  for (let i = 0; i < 3; i++) {
    prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const suffix = duration === '24h' ? '24H' : duration === '7d' ? '07D' : '30D';
  return `${prefix}-${suffix}`;
}

/**
 * Redeem voucher code
 */
export function redeemVoucher(
  inputCode: string,
  vouchers: Voucher[],
  matricule: string
): { success: boolean; durationMs?: number; durationType?: PassDuration; updatedVouchers: Voucher[]; error?: string } {
  const cleaned = inputCode.trim().toUpperCase();
  const index = vouchers.findIndex((v) => v.code.toUpperCase() === cleaned);

  if (index === -1) {
    return {
      success: false,
      updatedVouchers: vouchers,
      error: 'CODE INVALIDE. VÉRIFIEZ LE REÇU OU CONTACTEZ LE DISPATCH.',
    };
  }

  const voucher = vouchers[index];
  if (voucher.usedAt) {
    return {
      success: false,
      updatedVouchers: vouchers,
      error: `CODE DÉJÀ UTILISÉ PAR ${voucher.usedByMatricule || 'UN AUTRE LIVREUR'}.`,
    };
  }

  const passConfig = PASS_PRICING[voucher.duration];
  const now = Date.now();
  const updatedVouchers = [...vouchers];
  updatedVouchers[index] = {
    ...voucher,
    usedAt: now,
    usedByMatricule: matricule,
  };

  return {
    success: true,
    durationMs: passConfig.durationMs,
    durationType: voucher.duration,
    updatedVouchers,
  };
}

/**
 * Format remaining pass countdown into "18H 42M 11S" or "EXPIRÉ"
 */
export function formatRemainingTime(expiresAt: number, now: number = Date.now()): {
  text: string;
  isExpired: boolean;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diffMs = expiresAt - now;
  if (diffMs <= 0) {
    return {
      text: 'PASS EXPIRÉ',
      isExpired: true,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const text = `${hours}H ${pad(minutes)}M ${pad(seconds)}S`;

  return {
    text,
    isExpired: false,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Format Algerian Dinar amounts with tabular spacing
 */
export function formatDA(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} DA`;
}
