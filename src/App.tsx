import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { Product, CartItem, Category, StoreMode, WholesaleTier } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { buildProductShareData } from './utils/formatters';
import { auth, googleProvider, checkIsAdminUser, isBootstrapAdminUser } from './firebase';
import {
  subscribeToProducts,
  saveProductToCloud,
  deleteProductFromCloud,
  replaceCatalogInCloud,
  subscribeToAuthorizedAdmins,
  authorizeAdminEmail,
  revokeAuthorizedAdminEmail,
  subscribeToAdminPin,
  verifyAdminPin,
  saveAdminPin,
  resetAdminPin,
  AuthorizedAdminRecord,
  AdminPinRecord,
} from './services/catalogService';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Search, Sparkles } from 'lucide-react';

const STORAGE_KEY_PRODUCTS = 'valiana_products_catalog_v2';
const STORAGE_KEY_CART = 'valiana_user_cart_v2';

export default function App() {
  // Local cache fallback while cloud snapshot loads or before first cloud publish
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading products from storage:', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Live Firestore cloud products
  const [cloudProducts, setCloudProducts] = useState<Product[] | null>(null);
  const autoSeededRef = useRef(false);

  // Firebase Auth state for admin management
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdminRecord[]>([]);
  const [adminPinRecord, setAdminPinRecord] = useState<AdminPinRecord | null | undefined>(undefined);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  const isBootstrapAdmin = isBootstrapAdminUser(authUser);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading cart from storage:', e);
    }
    return [];
  });

  // Store Mode (detal or mayorista)
  const [storeMode, setStoreMode] = useState<StoreMode>('detal');

  // Navigation & UI Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Filters & Sorting
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedSaleType, setSelectedSaleType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const catalogRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active catalog shown to storefront visitors
  const isCloudSynced = cloudProducts !== null && cloudProducts.length > 0;
  const products = isCloudSynced ? cloudProducts : fallbackProducts;

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3400);
  };

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        const adminOk = await checkIsAdminUser(user);
        setIsAdmin(adminOk);
      } else {
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for products catalog
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (items) => {
        setCloudProducts(items);
        if (items.length > 0) {
          setFallbackProducts(items);
          try {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(items));
          } catch {
            // Ignore localStorage quota warnings when cloud is active
          }
        }
      },
      (err) => {
        console.error('Cloud subscription error:', err);
        if (err.message.includes('Quota exceeded')) {
          showToast('Cuota diaria de lectura en la nube alcanzada; mostrando copia local.');
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to authorized client emails when bootstrap owner is signed in
  useEffect(() => {
    if (!isBootstrapAdmin) {
      setAuthorizedAdmins([]);
      return;
    }
    const unsubscribe = subscribeToAuthorizedAdmins(
      (list) => setAuthorizedAdmins(list),
      (err) => console.error('Authorized admins listener error:', err)
    );
    return () => unsubscribe();
  }, [isBootstrapAdmin]);

  // Subscribe to Admin PIN lock configuration when a verified admin is signed in
  useEffect(() => {
    if (!isAdmin) {
      setAdminPinRecord(undefined);
      setPinUnlocked(false);
      return;
    }
    setAdminPinRecord(undefined);
    const unsubscribe = subscribeToAdminPin(
      (record) => {
        setAdminPinRecord(record);
      },
      (err) => {
        console.error('Admin PIN listener error:', err);
        setAdminPinRecord(null);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  // Auto-seed cloud catalog the very first time an admin logs in while Firestore is empty
  useEffect(() => {
    if (
      isAdmin &&
      authUser &&
      cloudProducts !== null &&
      cloudProducts.length === 0 &&
      !autoSeededRef.current
    ) {
      autoSeededRef.current = true;
      replaceCatalogInCloud(fallbackProducts, [], authUser.uid)
        .then(() => {
          showToast('Catálogo inicial sincronizado en la nube para todos tus clientes.');
        })
        .catch((err) => {
          console.error('Auto-seed error:', err);
          autoSeededRef.current = false;
        });
    }
  }, [isAdmin, authUser, cloudProducts, fallbackProducts]);

  // Save cart to localStorage on modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  // Check URL hash for direct product link (#producto=id) or admin (#admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setIsAdminOpen(true);
        return;
      }
      if (hash && hash.startsWith('#producto=')) {
        const id = hash.replace('#producto=', '');
        const found = products.find((p) => p.id === id);
        if (found) {
          setSelectedProduct(found);
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [products]);

  // Scroll to catalog section
  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle search input
  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 150);
      }
      return next;
    });
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    tier: WholesaleTier = 'detal',
    unitPrice?: number
  ) => {
    const priceToUse = unitPrice ?? product.price;
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          (item.tier || 'detal') === tier &&
          !item.customThreadColor &&
          !item.customNote
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId: `${product.id}-${tier}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product,
          quantity,
          tier,
          unitPrice: priceToUse,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    setCart((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Producto retirado del pedido');
  };

  const handleUpdateThreadColor = (index: number, customColor: string | undefined) => {
    setCart((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, customThreadColor: customColor } : item
      )
    );
  };

  const handleUpdateItemNote = (index: number, customNote: string | undefined) => {
    setCart((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, customNote } : item
      )
    );
  };

  const handleDuplicateItemInColor = (index: number): number => {
    const source = cart[index];
    if (!source) return index;
    const step = source.tier === 'pack12' ? 12 : source.tier === 'pack6' ? 6 : 1;
    const clonedItem: CartItem = {
      ...source,
      cartItemId: `${source.product.id}-${source.tier || 'detal'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      quantity: step,
      customThreadColor: undefined,
      customNote: undefined,
    };
    const nextIndex = index + 1;
    setCart((prev) => {
      const copy = [...prev];
      copy.splice(nextIndex, 0, clonedItem);
      return copy;
    });
    showToast(`Se agregó otra opción de "${source.product.name}" para elegir otro color`);
    return nextIndex;
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('El pedido ha sido vaciado');
  };

  // Direct share feedback when opening WhatsApp from product image
  const handleShareProduct = (product: Product) => {
    const { text } = buildProductShareData(product);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('Abriendo WhatsApp para compartir este diseño...');
  };

  // Google Sign-In / Sign-Out for Admin
  const handleSignInGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const adminOk = await checkIsAdminUser(cred.user);
      if (adminOk) {
        showToast('Sesión iniciada. Nube sincronizada en tiempo real.');
      } else {
        showToast('Esta cuenta no tiene permisos de administrador.');
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== 'auth/popup-closed-by-user') {
        showToast('No se pudo iniciar sesión con Google. Intenta nuevamente.');
      }
    }
  };

  const handleSignOutGoogle = async () => {
    setPinUnlocked(false);
    await signOut(auth);
    showToast('Sesión de administrador cerrada');
  };

  const handleVerifyAdminPin = async (pin: string): Promise<boolean> => {
    if (!adminPinRecord) return false;
    const valid = await verifyAdminPin(pin, adminPinRecord);
    if (valid) {
      setPinUnlocked(true);
      showToast('PIN verificado. Panel desbloqueado.');
    }
    return valid;
  };

  const handleSetAdminPin = async (pin: string): Promise<void> => {
    if (!authUser || !isAdmin) {
      throw new Error('Debes iniciar sesión como administrador.');
    }
    const hasExisting = Boolean(adminPinRecord);
    await saveAdminPin(pin, authUser.uid, hasExisting);
    setPinUnlocked(true);
    showToast(hasExisting ? 'PIN de seguridad actualizado.' : 'PIN de seguridad activado.');
  };

  const handleResetAdminPin = async (): Promise<void> => {
    if (!authUser || !isBootstrapAdmin) {
      throw new Error('Solo el propietario principal puede restablecer el PIN.');
    }
    await resetAdminPin();
    setPinUnlocked(false);
    showToast('PIN restablecido. Ahora puedes crear uno nuevo.');
  };

  const handleLockAdminPin = () => {
    setPinUnlocked(false);
    showToast('Panel bloqueado con PIN.');
  };

  const handleAuthorizeAdminEmail = async (email: string) => {
    if (!authUser || !isBootstrapAdmin) {
      throw new Error('Solo el propietario principal puede autorizar correos.');
    }
    await authorizeAdminEmail(email, authUser.uid);
  };

  const handleRevokeAdminEmail = async (emailKey: string) => {
    if (!authUser || !isBootstrapAdmin) {
      throw new Error('Solo el propietario principal puede revocar accesos.');
    }
    await revokeAuthorizedAdminEmail(emailKey);
  };

  const ensureUnlockedAdmin = () => {
    if (!authUser || !isAdmin) {
      throw new Error('Debes iniciar sesión como administrador.');
    }
    if (adminPinRecord && !pinUnlocked) {
      throw new Error('Debes ingresar el PIN de seguridad primero.');
    }
  };

  // Cloud Admin operations
  const handleSaveProduct = async (productData: Partial<Product>) => {
    ensureUnlockedAdmin();
    const existingIds = new Set((cloudProducts || []).map((p) => p.id));

    // If cloud is still empty when saving/editing a single item, publish baseline first
    if (cloudProducts !== null && cloudProducts.length === 0) {
      await replaceCatalogInCloud(fallbackProducts, [], authUser!.uid);
      fallbackProducts.forEach((p) => existingIds.add(p.id));
    }

    await saveProductToCloud(productData, authUser!.uid, existingIds);
  };

  const handleDeleteProduct = async (productId: string) => {
    ensureUnlockedAdmin();
    await deleteProductFromCloud(productId);
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
  };

  const handleResetCatalog = async () => {
    ensureUnlockedAdmin();
    const currentIds = (cloudProducts || []).map((p) => p.id);
    await replaceCatalogInCloud(INITIAL_PRODUCTS, currentIds, authUser!.uid);
  };

  const handleRestoreCatalog = async (restoredProducts: Product[]) => {
    ensureUnlockedAdmin();
    const currentIds = (cloudProducts || []).map((p) => p.id);
    await replaceCatalogInCloud(restoredProducts, currentIds, authUser!.uid);
  };

  const handlePublishLocalToCloud = async () => {
    ensureUnlockedAdmin();
    const currentIds = (cloudProducts || []).map((p) => p.id);
    await replaceCatalogInCloud(fallbackProducts, currentIds, authUser!.uid);
    showToast('¡Catálogo publicado en la nube para todos los clientes!');
  };

  // Filter and Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        const matchGender = selectedGender === 'all' || p.gender === selectedGender;
        const matchSaleType =
          selectedSaleType === 'all' ||
          p.type === selectedSaleType ||
          p.type === 'ambos';

        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.material && p.material.toLowerCase().includes(query)) ||
          (p.color && p.color.toLowerCase().includes(query));

        return matchCategory && matchGender && matchSaleType && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'offers') {
          const discountA = a.oldPrice ? a.oldPrice - a.price : 0;
          const discountB = b.oldPrice ? b.oldPrice - b.price : 0;
          return discountB - discountA;
        }
        return 0;
      });
  }, [products, selectedCategory, selectedGender, selectedSaleType, searchQuery, sortBy]);

  const totalCartUnits = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1A1A]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#141414] text-[#F4E8C1] border border-[#D4AF37] px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        cartCount={totalCartUnits}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onScrollToProducts={scrollToCatalog}
        onToggleSearch={handleToggleSearch}
        searchOpen={searchOpen}
        storeMode={storeMode}
        onToggleStoreMode={setStoreMode}
      />

      {/* Search Bar Drawer if opened */}
      {searchOpen && (
        <div className="bg-[#1F1F1F] text-white py-3 px-4 border-b border-[#D4AF37]/30 shadow-md animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Search className="w-4 h-4 text-[#D4AF37]" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por manilla, collar, hilo rojo, oro, San Benito..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <Hero onExploreClick={scrollToCatalog} />

      {/* Main Catalog Section */}
      <main ref={catalogRef} className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8 md:py-10">
        {/* Section Header */}
        <div className="text-center mb-4 sm:mb-6">
          <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#B8941F] block mb-1">
            Catálogo Artesanal Exclusivo
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-gray-900 mb-1.5">
            Descubre tu encanto
          </h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-2" />
          <p className="max-w-xl mx-auto text-sm sm:text-base md:text-lg text-gray-700 font-medium leading-snug">
            Pulseras, anillos y detalles que expresan tu esencia.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-4 bg-white p-2.5 sm:p-4 rounded-xl border border-[#ECE5D8] shadow-xs">
          <CategoryFilter
            currentCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            currentGender={selectedGender}
            onSelectGender={setSelectedGender}
            currentSaleType={selectedSaleType}
            onSelectSaleType={setSelectedSaleType}
            sortBy={sortBy}
            onSelectSort={setSortBy}
          />
        </div>

        {/* Active Filters Summary / Results Count */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 mb-3 px-1">
          <span>
            Mostrando <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'producto' : 'productos'}
            {selectedCategory !== 'Todos' && ` en "${selectedCategory}"`}
            {searchQuery && ` para "${searchQuery}"`}
          </span>

          {(selectedCategory !== 'Todos' || selectedGender !== 'all' || selectedSaleType !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedGender('all');
                setSelectedSaleType('all');
                setSearchQuery('');
              }}
              className="text-[#B8941F] hover:underline font-medium"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#D4AF37]/40 p-8 text-center max-w-md mx-auto my-6">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] flex items-center justify-center mx-auto mb-3 text-[#D4AF37]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">
              No se encontraron productos
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              No hay piezas que coincidan con los filtros aplicados.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSelectedGender('all');
                setSelectedSaleType('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                storeMode={storeMode}
                onOpenModal={setSelectedProduct}
                onAddToCart={(p, quantity, tier, unitPrice) => {
                  handleAddToCart(p, quantity, tier, unitPrice);
                  const label =
                    tier === 'pack12'
                      ? 'Docena (12 uds)'
                      : tier === 'pack6'
                        ? 'Pack x6 uds'
                        : `${quantity} unidad`;
                  showToast(`Se agregó ${label} de "${p.name}" a tu pedido`);
                }}
                onShareProduct={handleShareProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Floating WhatsApp Action Button */}
      <FloatingWhatsApp />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        storeMode={storeMode}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onShowToast={showToast}
      />

      {/* Slide-over Cart / Pedido Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onUpdateThreadColor={handleUpdateThreadColor}
        onUpdateItemNote={handleUpdateItemNote}
        onDuplicateItemInColor={handleDuplicateItemInColor}
        onClearCart={handleClearCart}
      />

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        authUser={authUser}
        isAdmin={isAdmin}
        isBootstrapAdmin={isBootstrapAdmin}
        authLoading={authLoading}
        isCloudSynced={isCloudSynced}
        authorizedAdmins={authorizedAdmins}
        pinLoading={isAdmin && adminPinRecord === undefined}
        hasPinConfigured={Boolean(adminPinRecord)}
        isPinUnlocked={pinUnlocked}
        onVerifyPin={handleVerifyAdminPin}
        onSetPin={handleSetAdminPin}
        onResetPin={handleResetAdminPin}
        onLockPin={handleLockAdminPin}
        onSignInGoogle={handleSignInGoogle}
        onSignOutGoogle={handleSignOutGoogle}
        onAuthorizeAdminEmail={handleAuthorizeAdminEmail}
        onRevokeAdminEmail={handleRevokeAdminEmail}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onResetCatalog={handleResetCatalog}
        onRestoreCatalog={handleRestoreCatalog}
        onPublishLocalToCloud={handlePublishLocalToCloud}
        onShowToast={showToast}
      />
    </div>
  );
}
