'use client';

import { StoreProvider } from '../store/StoreContext';
import { SvgSprite } from '../components/icons/SvgSprite';
import { LiveAnnouncer } from '../components/common/LiveAnnouncer';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { BranchBar } from '../components/layout/BranchBar';
import { LocationGate } from '../components/layout/LocationGate';
import { MobileNav } from '../components/layout/MobileNav';
import { Catalog } from '../components/catalog/Catalog';
import { ProductModal } from '../components/catalog/ProductModal';
import { PoliciesModal } from '../components/legal/Policies';
import { Branches } from '../components/branches/Branches';
import { Footer } from '../components/layout/Footer';
import { OrderDrawer } from '../components/order/OrderDrawer';
import { BranchDrawer } from '../components/order/BranchDrawer';
import { FiltersDrawer } from '../components/order/FiltersDrawer';
import { MenuDrawer } from '../components/order/MenuDrawer';
import { FloatingWa } from '../components/order/FloatingWa';
import { StructuredData } from '../components/seo/StructuredData';

/** Storefront público: búsqueda y catálogo inmediatos, reserva por WhatsApp. */
export function Storefront() {
  return (
    <StoreProvider>
      <div className="tienda">
        <SvgSprite />
        <LiveAnnouncer />

        <TopBar />
        <Header />
        <BranchBar />

        <main>
          <Catalog />
          <Branches />
        </main>

        <Footer />

        <OrderDrawer />
        <BranchDrawer />
        <FiltersDrawer />
        <MenuDrawer />
        <ProductModal />
        <PoliciesModal />
        <LocationGate />
        <FloatingWa />
        <MobileNav />

        <StructuredData />
      </div>
    </StoreProvider>
  );
}
