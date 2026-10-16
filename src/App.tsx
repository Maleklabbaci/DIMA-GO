import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/dispatchStore';
import { AppTab } from './components/TopUtilityBar';
import { MobileAppHeader } from './components/MobileAppHeader';
import { BottomTabBar } from './components/BottomTabBar';
import { RestaurantDispatchView } from './components/RestaurantDispatchView';
import { RiderRadarView } from './components/RiderRadarView';
import { CustomerGpsView } from './components/CustomerGpsView';
import { AdminVoucherView } from './components/AdminVoucherView';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const {
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
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<AppTab>('01_RESTAU');
  const [selectedOrderIdForGps, setSelectedOrderIdForGps] = useState<string>('');
  const [systemToast, setSystemToast] = useState<{ message: string; type: 'info' | 'success' | 'warn' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AppTab | null;
      const orderIdParam = params.get('orderId');

      if (tabParam && ['01_RESTAU', '02_LIVREUR', '03_GPS', '04_ADMIN'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
      if (orderIdParam) {
        setSelectedOrderIdForGps(orderIdParam);
      }
    }
  }, []);

  const showToast = (message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 3500);
  };

  const handleCreateOrder = (orderData: Parameters<typeof createOrder>[0]) => {
    const order = createOrder(orderData);
    showToast(`Commande #${order.orderNumber} envoyée sur le radar !`, 'success');
  };

  const handleAcceptOrder = (orderId: string, matricule: string) => {
    acceptOrder(orderId, matricule);
    showToast(`Course ${orderId} acceptée ! En route vers le restaurant.`, 'success');
  };

  const handleDeliverOrder = (orderId: string) => {
    deliverOrder(orderId);
    showToast(`Course terminée et cash encaissé !`, 'success');
  };

  const handleOpenGpsSimulation = (orderId: string) => {
    setSelectedOrderIdForGps(orderId);
    setActiveTab('03_GPS');
    showToast(`Lien GPS client ouvert pour ${orderId}`, 'info');
  };

  const handleSubmitGpsFromClient = (orderId: string, coords: { lat: number; lng: number }) => {
    updateOrderExactGps(orderId, coords);
    showToast(`Position exacte reçue du client pour ${orderId} !`, 'success');
  };

  const waitingOrdersCount = state.orders.filter((o) => o.status === 'DISPATCH_WAITING').length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Mobile Native App Top Header */}
      <MobileAppHeader />

      {/* Floating System Notification Toast */}
      {systemToast && (
        <aside
          role="status"
          aria-live="polite"
          className={`fixed top-14 right-4 z-50 px-4 py-2.5 text-xs font-semibold rounded-2xl shadow-lg border flex items-center gap-2.5 transition-all ${
            systemToast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : systemToast.type === 'warn'
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-amber-200 bg-amber-50 text-amber-950'
          }`}
        >
          {systemToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : systemToast.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{systemToast.message}</span>
        </aside>
      )}

      {/* Scrollable Main Views Area with Bottom Padding so content is never hidden behind Bottom Navigation */}
      <main className="flex-1 flex flex-col w-full pb-28 pt-1">
        {activeTab === '01_RESTAU' && (
          <RestaurantDispatchView
            orders={state.orders}
            nextOrderNumber={state.nextOrderNumber}
            onCreateOrder={handleCreateOrder}
            onOpenGpsSimulation={handleOpenGpsSimulation}
          />
        )}

        {activeTab === '02_LIVREUR' && (
          <RiderRadarView
            rider={activeRider}
            riders={state.riders}
            orders={state.orders}
            onSelectRider={setActiveRiderMatricule}
            onTogglePass={toggleRiderPassSimulation}
            onRedeemVoucher={redeemPassWithVoucher}
            onAcceptOrder={handleAcceptOrder}
            onDeliverOrder={handleDeliverOrder}
            onSwitchToGpsView={handleOpenGpsSimulation}
          />
        )}

        {activeTab === '03_GPS' && (
          <CustomerGpsView
            orders={state.orders}
            selectedOrderId={selectedOrderIdForGps}
            onSelectOrder={setSelectedOrderIdForGps}
            onSubmitGps={handleSubmitGpsFromClient}
          />
        )}

        {activeTab === '04_ADMIN' && (
          <AdminVoucherView
            vouchers={state.vouchers}
            riders={state.riders}
            orders={state.orders}
            onGenerateVoucher={generateVoucher}
            onResetData={resetAllData}
          />
        )}
      </main>

      {/* Mobile App Bottom Navigation Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        waitingOrdersCount={waitingOrdersCount}
        riderPassActive={activeRider.passActive}
      />
    </div>
  );
}
