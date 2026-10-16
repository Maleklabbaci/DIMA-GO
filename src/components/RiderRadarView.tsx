import React, { useState, useEffect } from 'react';
import { DeliveryOrder, RiderProfile } from '../types/dispatch';
import { formatRemainingTime, formatDA, PASS_PRICING, PassDuration } from '../utils/pricing';
import { DispatchMap } from './DispatchMap';
import {
  Bike,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface RiderRadarViewProps {
  rider: RiderProfile;
  riders: RiderProfile[];
  orders: DeliveryOrder[];
  onSelectRider: (matricule: string) => void;
  onTogglePass: (matricule: string) => void;
  onRedeemVoucher: (code: string, matricule: string) => { success: boolean; error?: string };
  onAcceptOrder: (orderId: string, matricule: string) => void;
  onDeliverOrder: (orderId: string) => void;
  onSwitchToGpsView: (orderId: string) => void;
}

export const RiderRadarView: React.FC<RiderRadarViewProps> = ({
  rider,
  riders,
  orders,
  onSelectRider,
  onTogglePass,
  onRedeemVoucher,
  onAcceptOrder,
  onDeliverOrder,
  onSwitchToGpsView,
}) => {
  const [now, setNow] = useState<number>(Date.now());
  const [voucherInput, setVoucherInput] = useState<string>('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const passCountdown = formatRemainingTime(rider.passExpiresAt, now);
  const isPassValid = rider.passActive && !passCountdown.isExpired;

  const activeOrder = orders.find(
    (o) => (o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT') && o.riderMatricule === rider.matricule
  );

  const waitingOrders = orders.filter((o) => o.status === 'DISPATCH_WAITING');

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    setVoucherSuccess(null);

    if (!voucherInput.trim()) {
      setVoucherError('Veuillez saisir un code de recharge valide.');
      return;
    }

    const res = onRedeemVoucher(voucherInput.trim(), rider.matricule);
    if (res.success) {
      setVoucherSuccess('Pass activé avec succès ! Le radar de courses est déverrouillé.');
      setVoucherInput('');
    } else {
      setVoucherError(res.error || 'Code de recharge invalide.');
    }
  };

  const generateWhatsAppUrl = (order: DeliveryOrder) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const locUrl = `${origin}/?tab=03_GPS&orderId=${order.id}`;
    const cleanPhone = order.customerPhone.replace(/[\s-]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '213' + cleanPhone.slice(1) : cleanPhone;
    const text = encodeURIComponent(
      `Salam ! C'est votre livreur moto pour la commande #${order.orderNumber}. Pour que j'arrive directement devant chez vous en 1 instant, veuillez cliquer sur ce lien et m'envoyer votre position exacte : ${locUrl}`
    );
    return `https://wa.me/${intlPhone}?text=${text}`;
  };

  const getGoogleMapsNavUrl = (order: DeliveryOrder) => {
    const coords = order.exactGpsCoords || order.destinationCoords;
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
      {/* Top Profile & Subscription Status Card */}
      <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Rider Info & Selector */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={rider.matricule}
                onChange={(e) => onSelectRider(e.target.value)}
                className="font-bold text-xs sm:text-sm text-[#1C1917] bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-amber-400 max-w-[180px] sm:max-w-xs truncate"
              >
                {riders.map((r) => (
                  <option key={r.matricule} value={r.matricule}>
                    {r.name} ({r.motoModel})
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#78716C] bg-[#FAF8F5] border border-[#E8E4DC] px-2 py-1 rounded-lg font-mono shrink-0">
                {rider.matricule}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[#78716C] mt-1">
              <span>{rider.todayDeliveriesCount} courses aujourd'hui</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700">
                Gains nets : {formatDA(rider.todayNetEarningsDA)}
              </span>
            </div>
          </div>
        </div>

        {/* Pass Status Badge & Simulation Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              isPassValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isPassValid
                ? `Pass ${rider.passType.toUpperCase()} : ${passCountdown.text} restantes`
                : 'Pass expiré'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onTogglePass(rider.matricule)}
            className="text-xs text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
          >
            {isPassValid ? 'Simuler expiré' : 'Simuler actif'}
          </button>
        </div>
      </div>

      {/* 2. EXPIRED PASS VIEW (Clean & Welcoming) */}
      {!isPassValid ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 text-center max-w-2xl mx-auto w-full shadow-xs my-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-[#1C1917] mb-1.5">Votre abonnement pass est expiré</h3>
          <p className="text-sm text-[#78716C] mb-6 max-w-md mx-auto leading-relaxed">
            Chez Radar Moto, vous conservez <strong>100% du prix de chaque course</strong> (0% de commission).
            Activez un forfait journalier ou hebdomadaire pour débloquer les commandes en direct.
          </p>

          {/* 3 Pass Options Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-left">
            {(Object.keys(PASS_PRICING) as PassDuration[]).map((dur) => {
              const pass = PASS_PRICING[dur];
              return (
                <div
                  key={dur}
                  className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-3.5 flex flex-col justify-between hover:border-amber-400 transition"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-[#78716C] uppercase">{pass.label}</span>
                    <div className="text-2xl font-extrabold text-[#1C1917] my-1">
                      {pass.priceDA} <span className="text-sm font-semibold text-amber-700">DA</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700">0% de commission</span>
                </div>
              );
            })}
          </div>

          {/* Voucher input form */}
          <form
            onSubmit={handleVoucherSubmit}
            className="max-w-md mx-auto bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-4 text-left flex flex-col gap-2"
          >
            <label className="block text-xs font-semibold text-[#78716C]">
              Code de recharge (ex: K9X-24H)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Entrez votre code..."
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                className="flex-1 bg-white border border-[#E8E4DC] rounded-lg px-3 py-2 text-sm font-mono font-bold uppercase text-[#1C1917] outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold uppercase cursor-pointer transition shadow-2xs"
              >
                Activer
              </button>
            </div>

            {voucherError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mt-1">
                {voucherError}
              </div>
            )}
            {voucherSuccess && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 mt-1 font-medium">
                {voucherSuccess}
              </div>
            )}

            <p className="text-[11px] text-[#A8A29E] mt-1 text-center">
              💡 Vous pouvez générer un code dans l'onglet <strong>Forfaits & Pass</strong>.
            </p>
          </form>
        </div>
      ) : activeOrder ? (
        /* 3. ACTIVE DELIVERY VIEW (IN PROGRESS) */
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-sm text-emerald-800">
                Course active en cours #{activeOrder.orderNumber}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
              Votre gain : +{activeOrder.deliveryFee} DA (100% net)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column (6 cols): Finances & Action Buttons */}
            <div className="lg:col-span-6 flex flex-col gap-3">
              {/* Financial Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-3.5">
                  <span className="text-xs text-[#78716C] block">À avancer au restaurant</span>
                  <div className="text-2xl font-extrabold text-[#1C1917] my-0.5">
                    {activeOrder.foodPrice} <span className="text-sm font-semibold text-[#78716C]">DA</span>
                  </div>
                  <span className="text-[11px] text-[#A8A29E]">Prix du repas préparé</span>
                </div>

                <div className="bg-emerald-50/70 rounded-xl border border-emerald-200 p-3.5">
                  <span className="text-xs text-emerald-900 font-medium block">À encaisser chez le client</span>
                  <div className="text-2xl font-extrabold text-emerald-700 my-0.5">
                    {activeOrder.totalCustomer} <span className="text-sm font-semibold text-emerald-900">DA</span>
                  </div>
                  <span className="text-[11px] text-emerald-700">Repas + vos frais de course</span>
                </div>
              </div>

              {/* Exact Location Notification */}
              {activeOrder.exactGpsReceived ? (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3.5 flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Position GPS exacte reçue du client !</span>
                      <span className="text-[11px] text-emerald-700">
                        Coordonnées : {activeOrder.exactGpsCoords?.lat.toFixed(4)}, {activeOrder.exactGpsCoords?.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    Vérifié
                  </span>
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-amber-900 block">En attente du point GPS client</span>
                    <span className="text-[11px] text-amber-700">
                      Demandez au client de partager son repère par WhatsApp.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSwitchToGpsView(activeOrder.id)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100 transition cursor-pointer"
                  >
                    Simuler clic
                  </button>
                </div>
              )}

              {/* Native Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${activeOrder.restaurantPhone}`}
                  className="p-3 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#1C1917] flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-[#78716C]" />
                  <span>Appeler restaurant</span>
                </a>

                <a
                  href={`tel:${activeOrder.customerPhone}`}
                  className="p-3 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white text-xs font-semibold text-[#1C1917] flex items-center justify-center gap-2 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-[#78716C]" />
                  <span>Appeler client</span>
                </a>

                <a
                  href={generateWhatsAppUrl(activeOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>Demander le repère GPS exact via WhatsApp</span>
                </a>

                <a
                  href={getGoogleMapsNavUrl(activeOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 flex items-center justify-center gap-2 transition"
                >
                  <Navigation className="w-4 h-4 text-amber-700" />
                  <span>Ouvrir dans Google Maps / Waze</span>
                </a>
              </div>

              {/* Deliver CTA */}
              <button
                type="button"
                onClick={() => onDeliverOrder(activeOrder.id)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-1"
              >
                <Check className="w-4 h-4" />
                <span>Course livrée et cash encaissé (+{activeOrder.deliveryFee} DA)</span>
              </button>
            </div>

            {/* Right Column (6 cols): Live Map */}
            <div className="lg:col-span-6 flex flex-col gap-2">
              <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-2">
                <div className="px-2 py-1 text-xs text-[#78716C] flex items-center justify-between mb-1">
                  <span>Destination : <strong className="text-[#1C1917]">{activeOrder.destinationName}</strong></span>
                  <span>{activeOrder.distanceKm} km</span>
                </div>
                <DispatchMap
                  origin={activeOrder.restaurantCoords}
                  destination={activeOrder.destinationCoords}
                  exactGpsDestination={activeOrder.exactGpsCoords}
                  routePolyline={activeOrder.routeCoordinates}
                  heightClass="h-[340px]"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. LIVE FEED OF WAITING ORDERS */
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <h3 className="font-bold text-sm text-[#1C1917]">
                Courses disponibles en direct ({waitingOrders.length})
              </h3>
            </div>
            <span className="text-xs text-[#78716C] bg-white px-2.5 py-0.5 rounded-full border border-[#E8E4DC] shadow-2xs">
              Secteur Koléa / Chaïba
            </span>
          </div>

          {waitingOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E4DC] p-12 text-center shadow-xs">
              <Bike className="w-10 h-10 text-[#A8A29E] mx-auto mb-2 opacity-50" />
              <h4 className="font-semibold text-sm text-[#1C1917] mb-1">Radar en écoute...</h4>
              <p className="text-xs text-[#78716C] max-w-sm mx-auto mb-3">
                Dès qu'un restaurant enregistre une course, l'alerte retentit et la commande s'affiche ici avec votre gain net.
              </p>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Passez sur l'onglet Restaurant pour créer une commande de test
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {waitingOrders.map((order) => {
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[#E8E4DC] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE3]">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                            #{order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-[#1C1917]">{order.restaurantName}</span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                          0% com
                        </span>
                      </div>

                      {/* Net Payout Banner */}
                      <div className="bg-amber-500/10 rounded-xl border border-amber-200 p-4 my-3 text-center">
                        <span className="text-xs font-medium text-amber-900 block">Votre gain net (100% pour vous)</span>
                        <div className="text-4xl font-extrabold text-[#1C1917] my-1">
                          +{order.deliveryFee} <span className="text-lg font-bold text-amber-700">DA</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">Zéro commission prélevée</span>
                      </div>

                      {/* Cash Breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-3">
                          <span className="text-[#78716C] block text-[11px]">À avancer :</span>
                          <span className="font-bold text-[#1C1917]">{order.foodPrice} DA</span>
                        </div>
                        <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-3">
                          <span className="text-[#78716C] block text-[11px]">À encaisser :</span>
                          <span className="font-bold text-emerald-700">{order.totalCustomer} DA</span>
                        </div>
                      </div>

                      {/* Destination Info */}
                      <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-3 text-xs flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#78716C]">Destination :</span>
                          <span className="font-semibold text-[#1C1917] truncate max-w-[200px]">{order.destinationName}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#A8A29E]">
                          <span>Distance estimée :</span>
                          <span>{order.distanceKm} km • ~{order.estimatedDurationMin} min</span>
                        </div>
                      </div>
                    </div>

                    {/* Accept Button */}
                    <button
                      type="button"
                      onClick={() => onAcceptOrder(order.id, rider.matricule)}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>Accepter cette course</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
