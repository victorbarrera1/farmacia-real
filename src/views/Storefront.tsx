import { StoreProvider } from '../store/StoreContext';
import { SvgSprite } from '../components/icons/SvgSprite';
import { LiveAnnouncer } from '../components/common/LiveAnnouncer';
import { TopBar } from '../components/layout/TopBar';
import { Header } from '../components/layout/Header';
import { BranchBar } from '../components/layout/BranchBar';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Banner } from '../components/sections/Banner';
import { Steps } from '../components/sections/Steps';
import { Catalog } from '../components/catalog/Catalog';
import { ProductModal } from '../components/catalog/ProductModal';
import { PoliciesModal } from '../components/legal/Policies';
import { Branches } from '../components/branches/Branches';
import { Services } from '../components/sections/Services';
import { Location } from '../components/sections/Location';
import { Footer } from '../components/layout/Footer';
import { OrderDrawer } from '../components/order/OrderDrawer';
import { BranchDrawer } from '../components/order/BranchDrawer';
import { FloatingWa } from '../components/order/FloatingWa';
import { MobileOrderBar } from '../components/order/MobileOrderBar';
import { StructuredData } from '../components/seo/StructuredData';

/** Página pública: la tienda con catálogo y pedido por WhatsApp. */
export function Storefront() {
  return (
    <StoreProvider>
      <SvgSprite />
      <LiveAnnouncer />

      <TopBar />
      <Header />
      <BranchBar />
      <CategoryNav />

      <main>
        <Banner />
        <Steps />
        <Catalog />
        <Branches />
        <Services />
        <Location />
      </main>

      <Footer />

      {/* Capas flotantes / superpuestas */}
      <OrderDrawer />
      <BranchDrawer />
      <ProductModal />
      <PoliciesModal />
      <FloatingWa />
      <MobileOrderBar />

      <StructuredData />
    </StoreProvider>
  );
}
