import React, { useState } from 'react';
import { Voucher, PassDuration, PASS_PRICING, formatDA, formatRemainingTime } from '../utils/pricing';
import { RiderProfile, DeliveryOrder } from '../types/dispatch';
import { Ticket, Copy, Check, Users, TrendingUp, RefreshCw, Sparkles, Bike } from 'lucide-react';

interface AdminVoucherViewProps {
  vouchers: Voucher[];
  riders: RiderProfile[];
  orders: DeliveryOrder[];
  onGenerateVoucher: (duration: PassDuration) => Voucher;
  onResetData: () => void;
}

export const AdminVoucherView: React.FC<AdminVoucherViewProps> = ({
  vouchers,
  riders,
  orders,
  onGenerateVoucher,
  onResetData,
}) => {
  const [latestVoucher, setLatestVoucher] = useState<Voucher | null>(vouchers[0] || null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleGenerate = (duration: PassDuration) => {
    const v = onGenerateVoucher(duration);
    setLatestVoucher(v);
  };

  const copyToClipboard = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const totalRevenuePassDA = vouchers
    .filter((v) => v.usedAt)
    .reduce((sum, v) => sum + v.priceDA, 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Modèle économique</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 my-1">0% commission</div>
          <span className="text-[11px] text-[#A8A29E]">Revenus sur abonnements</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Ventes de pass</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1917] my-1">{formatDA(totalRevenuePassDA)}</div>
          <span className="text-[11px] text-[#A8A29E]">{vouchers.filter((v) => v.usedAt).length} pass activés</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Livreurs inscrits</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1917] my-1">{riders.length} coursiers</div>
          <span className="text-[11px] text-emerald-700 font-medium">
            {riders.filter((r) => r.passActive).length} actifs sur le radar
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#78716C]">
            <span>Total courses</span>
            <Bike className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#1C1917] my-1">{orders.length} courses</div>
          <button
            type="button"
            onClick={onResetData}
            className="text-[11px] text-rose-600 hover:underline text-left cursor-pointer font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réinitialiser démo</span>
          </button>
        </div>
      </div>

      {/* Generator Section */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1C1917]">Générateur de tickets & codes recharge</h3>
              <p className="text-xs text-[#78716C]">Émission instantanée pour les livreurs moto</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Action Buttons */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleGenerate('24h')}
              className="p-3.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white hover:border-amber-400 text-left transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-semibold text-[#1C1917] block">Générer Code 24 Heures</span>
                <span className="text-[11px] text-[#78716C]">Accès radar 24h sans commission</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                300 DA
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate('7d')}
              className="p-3.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white hover:border-amber-400 text-left transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-semibold text-[#1C1917] block">Générer Code 7 Jours</span>
                <span className="text-[11px] text-[#78716C]">Accès complet pendant 1 semaine</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                1 500 DA
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleGenerate('30d')}
              className="p-3.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white hover:border-amber-400 text-left transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-semibold text-[#1C1917] block">Générer Code 30 Jours</span>
                <span className="text-[11px] text-[#78716C]">Abonnement mensuel coursier pro</span>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                5 000 DA
              </span>
            </button>
          </div>

          {/* Generated Code Display */}
          <div className="lg:col-span-7 bg-amber-500/10 rounded-2xl border border-amber-200 p-6 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-amber-900 block mb-1">
              Dernier code de recharge émis
            </span>

            {latestVoucher ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl sm:text-5xl font-mono font-extrabold text-[#1C1917] tracking-wider my-1 select-all">
                  {latestVoucher.code}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#78716C] mb-3">
                  <span className="font-semibold text-[#1C1917]">{PASS_PRICING[latestVoucher.duration].label}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">{latestVoucher.priceDA} DA</span>
                  <span>•</span>
                  <span>{latestVoucher.usedAt ? `Utilisé par ${latestVoucher.usedByMatricule}` : 'Disponible'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(latestVoucher.code)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {copiedCode === latestVoucher.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Code copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le code pour le livreur</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#78716C] py-4">
                Cliquez sur un des boutons pour générer un nouveau code.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Tables: Riders & Voucher Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Riders Table */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3] mb-2">
            <h4 className="font-bold text-xs text-[#1C1917]">Registre des livreurs ({riders.length})</h4>
            <span className="text-[11px] text-[#A8A29E]">Temps réel</span>
          </div>

          <div className="divide-y divide-[#F2ECE3] text-xs">
            {riders.map((r) => {
              const countdown = formatRemainingTime(r.passExpiresAt);
              return (
                <div key={r.matricule} className="py-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C1917]">{r.name}</span>
                      <span className="text-[11px] text-[#78716C] px-1.5 py-0.2 bg-[#FAF8F5] rounded border border-[#E8E4DC] font-mono">
                        {r.matricule}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#A8A29E] block mt-0.5">
                      {r.motoModel} • Tél: {r.phone}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-full inline-block ${
                        r.passActive && !countdown.isExpired
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.passActive && !countdown.isExpired ? countdown.text : 'Expiré'}
                    </span>
                    <span className="text-[11px] text-[#78716C] block mt-0.5">
                      {r.todayDeliveriesCount} courses • {formatDA(r.todayNetEarningsDA)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voucher History */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3] mb-2">
            <h4 className="font-bold text-xs text-[#1C1917]">Historique des codes ({vouchers.length})</h4>
            <span className="text-[11px] text-[#A8A29E]">Derniers émis</span>
          </div>

          <div className="divide-y divide-[#F2ECE3] max-h-[280px] overflow-y-auto pr-1 text-xs">
            {vouchers.map((v) => (
              <div key={v.code} className="py-2.5 flex items-center justify-between gap-2 hover:bg-[#FAF8F5] px-1.5 rounded-lg transition">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#1C1917]">{v.code}</span>
                  <span className="text-[11px] text-[#78716C]">({v.duration.toUpperCase()})</span>
                  <span className="text-[11px] text-amber-700 font-semibold">{v.priceDA} DA</span>
                </div>

                <div className="flex items-center gap-2">
                  {v.usedAt ? (
                    <span className="text-[10px] text-[#A8A29E] bg-[#FAF8F5] border border-[#E8E4DC] px-2 py-0.5 rounded-md">
                      Utilisé ({v.usedByMatricule})
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                      Disponible
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copyToClipboard(v.code)}
                    className="text-[11px] text-amber-700 hover:underline cursor-pointer font-medium"
                  >
                    Copier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
