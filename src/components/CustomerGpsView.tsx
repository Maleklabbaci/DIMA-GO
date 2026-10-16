import React, { useState } from 'react';
import { DeliveryOrder } from '../types/dispatch';
import { LatLng } from '../utils/pricing';
import { MapPin, CheckCircle2, ShieldCheck, Navigation } from 'lucide-react';

interface CustomerGpsViewProps {
  orders: DeliveryOrder[];
  selectedOrderId?: string;
  onSelectOrder: (id: string) => void;
  onSubmitGps: (orderId: string, coords: LatLng) => void;
}

export const CustomerGpsView: React.FC<CustomerGpsViewProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
  onSubmitGps,
}) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [successCoords, setSuccessCoords] = useState<LatLng | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const currentOrder =
    orders.find((o) => o.id === selectedOrderId) ||
    orders.find((o) => o.status === 'ACCEPTED' || o.status === 'DISPATCH_WAITING') ||
    orders[0];

  const handleCaptureGps = () => {
    if (!currentOrder) return;
    setIsLocating(true);
    setGpsError(null);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: LatLng = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          };
          setSuccessCoords(coords);
          setIsLocating(false);
          onSubmitGps(currentOrder.id, coords);
        },
        (err) => {
          console.warn('Geolocation fallback simulation:', err.message);
          const fallbackCoords: LatLng = {
            lat: Number((currentOrder.destinationCoords.lat + (Math.random() - 0.5) * 0.004).toFixed(5)),
            lng: Number((currentOrder.destinationCoords.lng + (Math.random() - 0.5) * 0.004).toFixed(5)),
          };
          setSuccessCoords(fallbackCoords);
          setIsLocating(false);
          onSubmitGps(currentOrder.id, fallbackCoords);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      const fallbackCoords: LatLng = {
        lat: Number((currentOrder.destinationCoords.lat + 0.0012).toFixed(5)),
        lng: Number((currentOrder.destinationCoords.lng - 0.0015).toFixed(5)),
      };
      setSuccessCoords(fallbackCoords);
      setIsLocating(false);
      onSubmitGps(currentOrder.id, fallbackCoords);
    }
  };

  if (!currentOrder) {
    return (
      <div className="w-full max-w-md mx-auto py-12 text-center text-sm text-[#78716C]">
        Aucune commande active à géolocaliser.
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center gap-4">
      {/* Simulation Selector Bar */}
      <div className="w-full bg-white rounded-2xl border border-[#E8E4DC] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
        <span className="text-[#78716C] font-medium whitespace-nowrap">Commande simulée :</span>
        <select
          value={currentOrder.id}
          onChange={(e) => onSelectOrder(e.target.value)}
          className="bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1C1917] outline-none cursor-pointer w-full sm:w-auto"
        >
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              #{o.orderNumber} - {o.destinationName}
            </option>
          ))}
        </select>
      </div>

      {/* Main Client Mobile Frame */}
      <div className="w-full bg-white rounded-3xl border border-[#E8E4DC] p-6 sm:p-7 flex flex-col gap-5 shadow-sm text-center">
        {/* Header with Icon */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Commande #{currentOrder.orderNumber}
            </span>
            <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
              Envoyer ma position au livreur
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Restaurant : <strong className="text-[#1C1917]">{currentOrder.restaurantName}</strong>
            </p>
          </div>
        </div>

        {/* Order Details Context Card */}
        <div className="bg-[#FAF8F5] rounded-2xl border border-[#E8E4DC] p-4 text-xs flex flex-col gap-2 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[#78716C]">Quartier annoncé :</span>
            <span className="font-semibold text-[#1C1917]">{currentOrder.destinationName}</span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-[#E8E4DC]">
            <span className="text-[#78716C]">Total à régler au livreur :</span>
            <span className="font-bold text-emerald-700 text-sm">{currentOrder.totalCustomer} DA</span>
          </div>
        </div>

        {/* State: Transmitted OR Big Action Button */}
        {currentOrder.exactGpsReceived || successCoords ? (
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 flex flex-col items-center gap-2 text-emerald-900">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-1" />
            <h3 className="font-bold text-base">Position transmise avec succès !</h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-xs">
              Votre livreur moto a reçu vos coordonnées GPS exactes. Il arrive directement devant chez vous sans avoir à vous rappeler !
            </p>

            <button
              type="button"
              onClick={handleCaptureGps}
              className="mt-3 text-xs text-emerald-700 hover:underline cursor-pointer font-medium"
            >
              Ré-actualiser ma position
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[#78716C] leading-relaxed text-left">
              Vous avez commandé par téléphone. Pour éviter les explications compliquées d'adresse et gagner du temps, partagez votre repère GPS en 1 clic.
            </p>

            {/* Warm, Minimalist Big Button */}
            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={isLocating}
              className="w-full py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-base transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <Navigation className="w-5 h-5" />
              <span>{isLocating ? 'Localisation en cours...' : 'Partager ma position exacte'}</span>
            </button>

            {gpsError && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                {gpsError}
              </div>
            )}
          </div>
        )}

        {/* Reassurance footer */}
        <div className="pt-3 border-t border-[#F2ECE3] flex items-center justify-center gap-1.5 text-[11px] text-[#A8A29E]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Partagé uniquement avec votre livreur pour cette course</span>
        </div>
      </div>
    </div>
  );
};
