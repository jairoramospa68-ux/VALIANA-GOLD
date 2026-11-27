import React, { useState, useEffect } from 'react';
import { Product, StoreMode, WholesaleTier } from '../types';
import { 
  formatPrice, getSaleTypeLabel, buildProductWhatsAppLink, 
  getActivePromoBadge, buildProductShareData, getProductGallery,
  getWholesalePrice6, getWholesalePrice12 
} from '../utils/formatters';
import { X, MessageCircle, ShoppingBag, Share2, Check, Crown, Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  storeMode: StoreMode;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, tier: WholesaleTier, unitPrice: number) => void;
  onShowToast: (msg: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  storeMode,
  onClose,
  onAddToCart,
  onShowToast,
}) => {
  const [selectedTier, setSelectedTier] = useState<WholesaleTier>('detal');
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
    if (storeMode === 'mayorista') {
      setSelectedTier('pack6');
      setQuantity(6);
    } else {
      setSelectedTier('detal');
      setQuantity(1);
    }
  }, [storeMode, product]);

  if (!product) return null;

  const gallery = getProductGallery(product);
  const safeImageIndex = activeImageIndex < gallery.length ? activeImageIndex : 0;
  const activeImage = gallery[safeImageIndex];
  const isOutOfStock = product.stock <= 0;
  const activePromo = getActivePromoBadge(product);

  const priceDetal = product.price;
  const price6 = getWholesalePrice6(product);
  const price12 = getWholesalePrice12(product);

  const getEffectiveUnitPrice = () => {
    if (selectedTier === 'pack12') return price12;
    if (selectedTier === 'pack6') return price6;
    return priceDetal;
  };

  const currentUnitPrice = getEffectiveUnitPrice();
  const totalPrice = currentUnitPrice * quantity;

  const handleTierChange = (tier: WholesaleTier) => {
    setSelectedTier(tier);
    if (tier === 'pack12') {
      setQuantity(12);
    } else if (tier === 'pack6') {
      setQuantity(6);
    } else {
      setQuantity(1);
    }
  };

  const shareData = buildProductShareData(product);

  const handleShareClick = () => {
    setCopied(true);
    onShowToast('Abriendo WhatsApp para compartir este diseño...');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareData.text).catch(() => {});
    }
    setTimeout(() => setCopied(false), 1800);
  };

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedTier, currentUnitPrice);
    const tierName = selectedTier === 'pack12' 
      ? `docena (12 uds)` 
      : selectedTier === 'pack6' 
        ? `pack x6 uds` 
        : `${quantity} unidad(es)`;
    onShowToast(`Se agregó ${tierName} de "${product.name}" al pedido`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card */}
      <div 
        className="relative bg-white w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[92vh] border border-[#E5DFD5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 bg-[#F6F3ED] flex flex-col justify-between overflow-hidden">
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={activeImage}
              alt={`${product.name} - foto ${safeImageIndex + 1}`}
              className="w-full h-64 md:h-full object-cover object-center max-h-[420px]"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80';
              }}
            />

            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors shadow-md"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev + 1) % gallery.length)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors shadow-md"
                  aria-label="Siguiente foto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
                  {safeImageIndex + 1} / {gallery.length}
                </div>
              </>
            )}

            <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
              {activePromo && (
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded shadow-sm flex items-center gap-1 ${activePromo.color}`}>
                  <span>{activePromo.icon}</span>
                  <span>{activePromo.label}</span>
                </span>
              )}
              <span className="bg-[#181818]/90 text-[#F4E8C1] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded">
                {getSaleTypeLabel(product.type)}
              </span>
            </div>

            <a
              href={shareData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShareClick}
              className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-full bg-white/95 hover:bg-[#25D366] text-gray-900 hover:text-white shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all active:scale-95 border border-black/10"
              title="Compartir este diseño por WhatsApp"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#25D366]" />}
              <span>{copied ? '¡Listo!' : 'Compartir por WhatsApp'}</span>
            </a>
          </div>

          {/* Thumbnails strip (only shown if 2 or more photos exist) */}
          {gallery.length > 1 && (
            <div className="p-2.5 bg-white/90 border-t border-[#E5DFD5] flex items-center gap-2 overflow-x-auto">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl.slice(0, 40)}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    idx === safeImageIndex
                      ? 'border-[#D4AF37] ring-1 ring-[#D4AF37] scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Ver foto ${idx + 1}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="md:w-1/2 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Header info */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B8941F] mb-1">
              <span>{product.category}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600 font-normal">{product.gender}</span>
            </div>

            <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
              {product.name}
            </h2>

            {/* Wholesale Tier Selector (Tabs) */}
            <div className="mb-4 bg-gray-100 p-1 rounded-xl flex items-center text-xs font-semibold border border-gray-200">
              <button
                type="button"
                onClick={() => handleTierChange('detal')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                  selectedTier === 'detal'
                    ? 'bg-white text-black shadow-xs font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Detal (1 ud)
              </button>
              <button
                type="button"
                onClick={() => handleTierChange('pack6')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  selectedTier === 'pack6'
                    ? 'bg-gray-900 text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Package className="w-3 h-3 text-[#D4AF37]" />
                <span>Pack x6</span>
              </button>
              <button
                type="button"
                onClick={() => handleTierChange('pack12')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                  selectedTier === 'pack12'
                    ? 'bg-[#D4AF37] text-black shadow-xs font-bold'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>Docena (12)</span>
              </button>
            </div>

            {/* Pricing Box based on Tier */}
            <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE3D2] mb-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">Precio unitario:</span>
                <div className="flex items-baseline gap-2">
                  {selectedTier === 'detal' && product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-sm font-medium text-gray-500 line-through decoration-black decoration-1">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(currentUnitPrice)} <span className="text-xs text-gray-500 font-normal">c/u</span>
                  </span>
                </div>
              </div>

              {selectedTier !== 'detal' && (
                <div className="flex items-center justify-between text-xs text-emerald-800 font-medium pt-1 border-t border-gray-200/60">
                  <span>Ahorro por compra mayorista:</span>
                  <span>{formatPrice((priceDetal - currentUnitPrice) * quantity)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                {product.description}
              </p>
            )}

            {/* Specs Table */}
            <div className="bg-[#FAF8F5] rounded-xl p-3 border-l-4 border-[#D4AF37] text-xs space-y-1.5 mb-4">
              {product.material && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Material:</span>
                  <span className="text-gray-800 text-right font-medium max-w-[65%]">{product.material}</span>
                </div>
              )}
              {product.color && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Color:</span>
                  <span className="text-gray-800 text-right font-medium">{product.color}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Disponibilidad:</span>
                <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {isOutOfStock ? 'Agotado' : `${product.stock} unidades en inventario`}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {!isOutOfStock && (
              <div className="flex items-center justify-between mb-4 bg-white p-2.5 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Cantidad:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => {
                        const step = selectedTier === 'pack12' ? 12 : selectedTier === 'pack6' ? 6 : 1;
                        setQuantity((q) => Math.max(step, q - step));
                      }}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold transition-colors text-xs"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-gray-800 min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        const step = selectedTier === 'pack12' ? 12 : selectedTier === 'pack6' ? 6 : 1;
                        setQuantity((q) => Math.min(product.stock, q + step));
                      }}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold transition-colors text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Total a pagar:</span>
                  <span className="text-sm sm:text-base font-bold text-[#A68A36]">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-md'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar al Pedido</span>
              </button>

              <a
                href={buildProductWhatsAppLink(product, selectedTier)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp</span>
              </a>
            </div>

            <a
              href={shareData.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleShareClick}
              className="w-full py-2 rounded-lg border border-gray-200 hover:border-[#25D366] text-gray-700 hover:text-[#168A41] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Abriendo WhatsApp!' : 'Compartir diseño por WhatsApp'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
