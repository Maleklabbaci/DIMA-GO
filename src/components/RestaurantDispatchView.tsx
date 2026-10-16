import React, { useState, useEffect, useRef } from 'react';
import { PRE_WIRED_QUARTIERS, QuartierZone, DEFAULT_RESTAURANT, DeliveryOrder } from '../types/dispatch';
import { calculateDeliveryFee, calculateTotalCustomer, formatDA, LatLng } from '../utils/pricing';
import { fetchOSRMRoute, searchLandmarkNominatim, NominatimPlace } from '../utils/routing';
import { DispatchMap } from './DispatchMap';
import { Search, MapPin, Phone, Banknote, Sparkles, Send, Clock, Navigation } from 'lucide-react';

interface RestaurantDispatchViewProps {
  orders: DeliveryOrder[];
  nextOrderNumber: number;
  onCreateOrder: (orderData: Omit<DeliveryOrder, 'id' | 'orderNumber' | 'createdAt' | 'status'>) => void;
  onOpenGpsSimulation: (orderId: string) => void;
}

export const RestaurantDispatchView: React.FC<RestaurantDispatchViewProps> = ({
  orders,
  nextOrderNumber,
  onCreateOrder,
  onOpenGpsSimulation,
}) => {
  const [restaurantOrigin] = useState<LatLng>(DEFAULT_RESTAURANT.coords);

  const [selectedZone, setSelectedZone] = useState<QuartierZone>(PRE_WIRED_QUARTIERS[1]); // Chaïba
  const [destinationCoords, setDestinationCoords] = useState<LatLng>({
    lat: PRE_WIRED_QUARTIERS[1].lat,
    lng: PRE_WIRED_QUARTIERS[1].lng,
  });
  const [destinationName, setDestinationName] = useState<string>(PRE_WIRED_QUARTIERS[1].name);

  const [customerPhone, setCustomerPhone] = useState<string>('0554 12 34 56');
  const [foodPrice, setFoodPrice] = useState<number>(1450);

  const [isSurgeActive, setIsSurgeActive] = useState<boolean>(false);
  const [bargainDelta, setBargainDelta] = useState<number>(0);

  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(3.2);
  const [routeDurationMin, setRouteDurationMin] = useState<number>(7);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [isRoutingLoading, setIsRoutingLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<NominatimPlace[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const surgeBonus = isSurgeActive ? 50 : 0;
  const deliveryFee = calculateDeliveryFee(routeDistanceKm, surgeBonus, bargainDelta);
  const totalCustomer = calculateTotalCustomer(foodPrice, deliveryFee);

  const calculateRouteForCoords = async (dest: LatLng, name: string) => {
    setIsRoutingLoading(true);
    setDestinationCoords(dest);
    setDestinationName(name);

    const result = await fetchOSRMRoute(restaurantOrigin, dest);
    setRouteDistanceKm(result.distanceKm);
    setRouteDurationMin(result.durationMin);
    setRoutePolyline(result.coordinates);
    setIsRoutingLoading(false);
  };

  useEffect(() => {
    calculateRouteForCoords(
      { lat: selectedZone.lat, lng: selectedZone.lng },
      selectedZone.name
    );
  }, []);

  const handleZoneSelect = (zone: QuartierZone) => {
    setSelectedZone(zone);
    setSearchQuery('');
    setSearchResults([]);
    calculateRouteForCoords({ lat: zone.lat, lng: zone.lng }, zone.name);
  };

  const handleMapClick = (latLng: LatLng) => {
    const customName = `Point sur carte (${latLng.lat.toFixed(3)}, ${latLng.lng.toFixed(3)})`;
    calculateRouteForCoords(latLng, customName);
  };

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (val.trim().length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchLandmarkNominatim(val);
        setSearchResults(results);
        setIsSearching(false);
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectNominatim = (place: NominatimPlace) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setSearchQuery(place.display_name.split(',')[0]);
    setSearchResults([]);
    calculateRouteForCoords({ lat, lng }, place.display_name.split(',')[0]);
  };

  const handleDispatchOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerPhone.trim()) {
      alert('Veuillez saisir le numéro de téléphone du client');
      return;
    }

    onCreateOrder({
      restaurantName: DEFAULT_RESTAURANT.name,
      restaurantPhone: DEFAULT_RESTAURANT.phone,
      restaurantCoords: restaurantOrigin,
      customerPhone: customerPhone.trim(),
      destinationName,
      destinationCoords,
      exactGpsReceived: false,
      distanceKm: routeDistanceKm,
      estimatedDurationMin: routeDurationMin,
      foodPrice,
      deliveryFee,
      totalCustomer,
      surgeBonus,
      bargainDelta,
      routeCoordinates: routePolyline,
    });

    setCustomerPhone('055');
  };

  const waitingOrders = orders.filter((o) => o.status === 'DISPATCH_WAITING');
  const activeOrders = orders.filter((o) => o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT');

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-4">
      {/* Restaurant Info Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-[#E8E4DC] p-3 sm:p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#1C1917]">{DEFAULT_RESTAURANT.name}</h2>
            <p className="text-xs text-[#78716C]">{DEFAULT_RESTAURANT.address}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E8E4DC] font-medium text-[#78716C]">
            Commande suivante : <strong className="text-[#1C1917]">#{nextOrderNumber}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Map & Live List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Phone Order Calculator */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Price Readout Card */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#F2ECE3]">
              <div>
                <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wide block">
                  Calculateur de commande
                </span>
                <p className="text-xs text-[#A8A29E]">Tarif calculé par route en temps réel</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRoutingLoading ? 'Calcul...' : `${routeDistanceKm} km • ~${routeDurationMin} min`}</span>
              </div>
            </div>

            {/* Price Readout Panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Delivery Fee */}
              <div className="bg-[#FAF8F5] rounded-xl border border-[#E8E4DC] p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-[#78716C]">Tarif livraison (net livreur)</span>
                  <div className="text-4xl font-extrabold text-[#1C1917] tracking-tight my-1">
                    {deliveryFee} <span className="text-lg font-bold text-amber-600">DA</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#A8A29E]">Arrondi au 50 DA • 0% retenu</p>
              </div>

              {/* Total Customer */}
              <div className="bg-amber-500/10 rounded-xl border border-amber-200 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-900">Total à annoncer au client</span>
                  <div className="text-4xl font-extrabold text-[#1C1917] tracking-tight my-1">
                    {totalCustomer} <span className="text-lg font-bold text-amber-700">DA</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-emerald-700">
                  Repas ({foodPrice} DA) + Course ({deliveryFee} DA)
                </p>
              </div>
            </div>

            {/* Adjustment Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F2ECE3]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#78716C] mr-1">Ajuster tarif :</span>
                <button
                  type="button"
                  onClick={() => setBargainDelta((prev) => Math.max(-100, prev - 50))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white text-[#1C1917] transition shadow-2xs"
                >
                  - 50 DA
                </button>
                <button
                  type="button"
                  onClick={() => setBargainDelta((prev) => prev + 50)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E8E4DC] bg-[#FAF8F5] hover:bg-white text-[#1C1917] transition shadow-2xs"
                >
                  + 50 DA
                </button>
                {bargainDelta !== 0 && (
                  <button
                    type="button"
                    onClick={() => setBargainDelta(0)}
                    className="text-xs text-rose-600 hover:underline ml-1"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSurgeActive(!isSurgeActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isSurgeActive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-[#FAF8F5] border border-[#E8E4DC] text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSurgeActive ? 'Mode nuit / pluie actif (+50 DA)' : 'Mode pluie / nuit (+50 DA)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Zone Selection & Search Card */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wide">
                1. Sélectionner le quartier (au téléphone)
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Choix : {destinationName}
              </span>
            </div>

            {/* Pre-wired grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRE_WIRED_QUARTIERS.map((zone) => {
                const isSelected = selectedZone.id === zone.id && destinationName === zone.name;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => handleZoneSelect(zone)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex flex-col justify-between h-[68px] cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-semibold ring-2 ring-amber-500/20'
                        : 'border-[#E8E4DC] bg-[#FAF8F5] text-[#1C1917] hover:border-[#D6D0C5] hover:bg-white'
                    }`}
                  >
                    <span className="text-xs font-medium leading-snug truncate">{zone.name}</span>
                    <span className="text-[11px] text-[#A8A29E] font-normal">{zone.tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Landmark autocomplete search */}
            <div className="relative pt-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3 text-[#A8A29E] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ou rechercher une mosquée, école, cité..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1C1917] outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
                {isSearching && (
                  <span className="absolute right-3 text-[11px] text-amber-600 animate-pulse font-medium">
                    Recherche...
                  </span>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-xl border border-[#E8E4DC] shadow-lg divide-y divide-[#F2ECE3] overflow-hidden">
                  {searchResults.map((place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() => handleSelectNominatim(place)}
                      className="w-full text-left px-3.5 py-2.5 text-xs text-[#1C1917] hover:bg-amber-50 transition truncate block cursor-pointer"
                    >
                      {place.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phone Form & Dispatch CTA */}
          <form
            onSubmit={handleDispatchOrder}
            className="bg-white rounded-2xl border border-[#E8E4DC] p-5 shadow-xs flex flex-col gap-4"
          >
            <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wide">
              2. Coordonnées de la commande
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1.5">
                  Téléphone client
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 absolute left-3 text-[#A8A29E] pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#1C1917] font-mono outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#78716C] mb-1.5">
                  Repas à avancer par le livreur
                </label>
                <div className="relative flex items-center">
                  <Banknote className="w-4 h-4 absolute left-3 text-[#A8A29E] pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={foodPrice}
                    onChange={(e) => setFoodPrice(Number(e.target.value))}
                    className="w-full bg-[#FAF8F5] border border-[#E8E4DC] rounded-xl pl-9 pr-12 py-2.5 text-sm text-[#1C1917] font-mono outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                  <span className="absolute right-3 text-xs font-bold text-[#78716C]">DA</span>
                </div>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <Send className="w-4 h-4" />
              <span>Dépêcher un livreur moto maintenant</span>
            </button>
          </form>
        </div>

        {/* Right Column (5 cols): Map & Live Dispatch List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Map Preview */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-3 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-[#1C1917]">Aperçu du trajet</span>
              <span className="text-xs text-[#78716C]">{destinationName}</span>
            </div>

            <DispatchMap
              origin={restaurantOrigin}
              destination={destinationCoords}
              routePolyline={routePolyline}
              onMapClick={handleMapClick}
              heightClass="h-[260px]"
            />

            <div className="flex items-center justify-between pt-1 px-1 text-xs text-[#78716C]">
              <span>Distance : <strong className="text-[#1C1917]">{routeDistanceKm} km</strong></span>
              <span>Temps estimé : <strong className="text-[#1C1917]">~{routeDurationMin} min</strong></span>
            </div>
          </div>

          {/* Active Deliveries Queue */}
          <div className="bg-white rounded-2xl border border-[#E8E4DC] p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#1C1917]">Courses du restaurant</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E4DC] text-[11px] font-semibold text-[#78716C]">
                  {orders.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-amber-700 font-medium">{waitingOrders.length} en attente</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">{activeOrders.length} en cours</span>
              </div>
            </div>

            <div className="divide-y divide-[#F2ECE3] max-h-[340px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#A8A29E]">
                  Aucune commande enregistrée pour l'instant.
                </div>
              ) : (
                orders.map((order) => {
                  const isWaiting = order.status === 'DISPATCH_WAITING';
                  const isAccepted = order.status === 'ACCEPTED' || order.status === 'IN_TRANSIT';

                  return (
                    <div key={order.id} className="py-3 flex flex-col gap-1.5 first:pt-1 last:pb-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1C1917]">#{order.orderNumber}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                              isWaiting
                                ? 'bg-amber-100 text-amber-800'
                                : isAccepted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-[#FAF8F5] text-[#78716C]'
                            }`}
                          >
                            {isWaiting
                              ? 'En attente livreur'
                              : isAccepted
                              ? `En route (${order.riderName || order.riderMatricule})`
                              : 'Livrée'}
                          </span>
                        </div>
                        <span className="font-bold text-xs text-[#1C1917]">{formatDA(order.totalCustomer)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#78716C]">
                        <span className="truncate max-w-[200px] flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-[#A8A29E]" />
                          {order.destinationName}
                        </span>
                        <span>{order.distanceKm} km</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#A8A29E] pt-1">
                        <span>Client : {order.customerPhone}</span>
                        {order.exactGpsReceived ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <span>●</span> GPS reçu
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenGpsSimulation(order.id)}
                            className="text-amber-700 hover:underline font-medium cursor-pointer"
                          >
                            Tester lien GPS
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
