import { LatLng, PassDuration, Voucher } from '../utils/pricing';

export interface QuartierZone {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  description: string;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: number;
  restaurantName: string;
  restaurantPhone: string;
  restaurantCoords: LatLng;
  customerPhone: string;
  destinationName: string;
  destinationCoords: LatLng;
  exactGpsReceived: boolean;
  exactGpsCoords?: LatLng;
  exactGpsReceivedAt?: number;
  distanceKm: number;
  estimatedDurationMin: number;
  foodPrice: number;
  deliveryFee: number;
  totalCustomer: number;
  surgeBonus: number;
  bargainDelta: number;
  status: 'DISPATCH_WAITING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED';
  riderMatricule?: string;
  riderName?: string;
  createdAt: number;
  acceptedAt?: number;
  deliveredAt?: number;
  routeCoordinates?: [number, number][]; // [lat, lng] array for polyline
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  matricule: string;
  motoModel: string;
  passActive: boolean;
  passType: PassDuration;
  passExpiresAt: number;
  status: 'EN_LIGNE' | 'EN_COURSE' | 'HORS_LIGNE';
  activeOrderId?: string;
  todayDeliveriesCount: number;
  todayNetEarningsDA: number;
  currentCoords: LatLng;
}

// Pre-configured Algerian Coastal Mitidja / Tipaza zone around Koléa (36.638, 2.768)
export const PRE_WIRED_QUARTIERS: QuartierZone[] = [
  {
    id: 'kolea-centre',
    name: 'Koléa Centre',
    tag: 'LOCAL (0-2 KM)',
    lat: 36.6385,
    lng: 2.7684,
    description: 'Place des Martyrs / Marché couvert',
  },
  {
    id: 'chaiba',
    name: 'Chaïba',
    tag: 'NORD (3.2 KM)',
    lat: 36.6575,
    lng: 2.7562,
    description: 'Avenue Principale / Entrée Sud',
  },
  {
    id: 'cite-5-juillet',
    name: 'Cité 5 Juillet',
    tag: 'EST (2.1 KM)',
    lat: 36.6421,
    lng: 2.7825,
    description: 'Bâtiments AADL / Rond-point',
  },
  {
    id: 'bou-ismail',
    name: 'Bou Ismaïl',
    tag: 'OUEST (6.8 KM)',
    lat: 36.6432,
    lng: 2.6931,
    description: 'Corniche / Port de pêche',
  },
  {
    id: 'fouka',
    name: 'Fouka',
    tag: 'OUEST (5.4 KM)',
    lat: 36.6663,
    lng: 2.7211,
    description: 'Fouka Ville / Route Nationale 11',
  },
  {
    id: 'douaouda',
    name: 'Douaouda',
    tag: 'NORD-EST (6.5 KM)',
    lat: 36.6698,
    lng: 2.7865,
    description: 'Douaouda Marine / Plage',
  },
  {
    id: 'zeralda',
    name: 'Zéralda',
    tag: 'PÉRIPH (11.2 KM)',
    lat: 36.7118,
    lng: 2.8427,
    description: 'Gare / Cité 1600 logts',
  },
  {
    id: 'attatba',
    name: 'Attatba',
    tag: 'SUD (9.0 KM)',
    lat: 36.5794,
    lng: 2.6842,
    description: 'Carrefour Agricole / Sortie Autoroute',
  },
];

export const DEFAULT_RESTAURANT = {
  name: 'SNACK & TACOS EL MEDINA',
  phone: '0550 14 28 90',
  coords: {
    lat: 36.6382,
    lng: 2.7681,
  },
  address: 'Rue Frères Boufatis, Koléa Centre',
};
