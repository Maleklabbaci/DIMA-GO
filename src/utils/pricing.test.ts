import test from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistanceKm,
  estimateRoadDistanceKm,
  calculateDeliveryFee,
  calculateTotalCustomer,
  generateVoucherCode,
  redeemVoucher,
  formatRemainingTime,
  formatDA,
} from './pricing.ts';
import type { Voucher } from './pricing.ts';

test('haversineDistanceKm calculates direct line distance correctly', () => {
  // Koléa center (~36.638, 2.768) to Bou Ismaïl (~36.643, 2.693) is approx ~6.7 km
  const dist = haversineDistanceKm(36.638, 2.768, 36.643, 2.693);
  assert.ok(dist > 6.0 && dist < 7.5, `Expected ~6.7km, got ${dist}`);
});

test('estimateRoadDistanceKm applies 1.28x multiplier', () => {
  const direct = 10;
  const road = estimateRoadDistanceKm(direct);
  assert.equal(road, 12.8);
});

test('calculateDeliveryFee applies base and 50 DA rounding', () => {
  // Base <= 2.0 km is 200 DA
  assert.equal(calculateDeliveryFee(1.2), 200);
  assert.equal(calculateDeliveryFee(2.0), 200);

  // 3.0 km: raw = 200 + (1.0 * 40) = 240 -> rounds to 250 DA
  assert.equal(calculateDeliveryFee(3.0), 250);

  // 4.5 km: raw = 200 + (2.5 * 40) = 300 -> rounds to 300 DA
  assert.equal(calculateDeliveryFee(4.5), 300);

  // With rain/night surge (+50 DA)
  // 3.0 km: raw = 240 + 50 = 290 -> rounds to 300 DA
  assert.equal(calculateDeliveryFee(3.0, 50), 300);

  // With inDrive manual adjustment: +50 DA
  assert.equal(calculateDeliveryFee(2.0, 0, 50), 250);

  // With inDrive manual adjustment: -50 DA, floor remains 200 DA
  assert.equal(calculateDeliveryFee(2.0, 0, -50), 200);
});

test('calculateTotalCustomer sums food and delivery fee', () => {
  assert.equal(calculateTotalCustomer(1200, 250), 1450);
  assert.equal(calculateTotalCustomer(0, 300), 300);
});

test('generateVoucherCode creates valid format', () => {
  const code24 = generateVoucherCode('24h');
  assert.match(code24, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{3}-24H$/);

  const code7 = generateVoucherCode('7d');
  assert.match(code7, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{3}-07D$/);

  const code30 = generateVoucherCode('30d');
  assert.match(code30, /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{3}-30D$/);
});

test('redeemVoucher validates and consumes voucher correctly', () => {
  const vouchers: Voucher[] = [
    {
      code: 'ABC-24H',
      duration: '24h',
      priceDA: 300,
      createdAt: Date.now() - 10000,
    },
  ];

  // Try invalid code
  const resBad = redeemVoucher('XYZ-999', vouchers, '09-1234-16');
  assert.equal(resBad.success, false);
  assert.ok(resBad.error?.includes('CODE INVALIDE'));

  // Redeem valid code
  const resGood = redeemVoucher('abc-24h', vouchers, '09-1234-16');
  assert.equal(resGood.success, true);
  assert.equal(resGood.durationMs, 24 * 60 * 60 * 1000);
  assert.ok(resGood.updatedVouchers[0].usedAt);
  assert.equal(resGood.updatedVouchers[0].usedByMatricule, '09-1234-16');

  // Try redeeming same code again
  const resUsed = redeemVoucher('ABC-24H', resGood.updatedVouchers, '16-5678-16');
  assert.equal(resUsed.success, false);
  assert.ok(resUsed.error?.includes('DÉJÀ UTILISÉ'));
});

test('formatRemainingTime returns accurate countdown and expired status', () => {
  const now = 1000000;
  // 1 hour, 30 mins, 15 secs in future = 5415000 ms
  const future = now + 5415000;
  const active = formatRemainingTime(future, now);
  assert.equal(active.isExpired, false);
  assert.equal(active.text, '1H 30M 15S');

  // Expired
  const past = now - 5000;
  const expired = formatRemainingTime(past, now);
  assert.equal(expired.isExpired, true);
  assert.equal(expired.text, 'PASS EXPIRÉ');
});

test('formatDA formats currency with DA suffix', () => {
  const formatted = formatDA(1450);
  assert.ok(formatted.includes('1') && formatted.includes('450') && formatted.includes('DA'));
});
