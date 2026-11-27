import React, { useState, useEffect } from 'react';
import { Product, StoreMode, WholesaleTier } from '../types';
import { 
  formatPrice, getSaleTypeLabel, getActivePromoBadge, 
  getWholesalePrice6, getWholesalePrice12, buildProductShareData, getProductGallery
} from '../utils/formatters';
import { Plus, Eye, Share2, Crown, Package, ChevronLeft, ChevronRight, Images } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  storeMode: StoreMode;
  onOpenModal: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number, tier: WholesaleTier, unitPrice: number) => void;
  onShareProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  storeMode,
  onOpenModal,
  onAddToCart,
  onShareProduct,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 4;
  const activePromo = getActivePromoBadge(product);
  const gallery = getProductGallery(product);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(0);
  }, [product.id, gallery.length]);

  const currentImage = gallery[photoIndex] || gallery[0];

  const price6 = getWholesalePrice6(product);
  const price12 = getWholesalePrice12(product);

  return (
    <div className="group bg-white rounded-xl border border-[#ECE5D8] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-[#D4AF37]/50 relative">
      {/* Top Left Badges: Promo Badge & Discount */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start max-w-[70%]">
        {activePromo && (
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${activePromo.color}`}>
            <span>{activePromo.icon}</span>
            <span className="truncate">{activePromo.label}</span>
          </span>
        )}
        {storeMode === 'detal' && product.oldPrice && product.oldPrice > product.price && (
          <span className="bg-[#D4AF37] text-black font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
            Oferta
          </span>
        )}
      </div>

      {/* Top Right Mode / Sale Type Badge */}
      <div className="absolute top-2.5 right-2.5 z-10">
        {storeMode === 'mayorista' ? (
          <span className="bg-[#D4AF37] text-black text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
            <Crown className="w-3 h-3" />
            <span>Mayorista</span>
          </span>
        ) : (
          <span className="bg-[#181818]/90 text-[#F4E8C1] text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded shadow-sm backdrop-blur-xs">
            {getSaleTypeLabel(product.type)}
          </span>
        )}
      </div>

      {/* Product Image Area */}
      <div 
        onClick={() => onOpenModal(product)} 
        className="relative aspect-square w-full overflow-hidden bg-[#F7F4EE] cursor-pointer"
      >
        <img
          src={currentImage}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Multi-photo controls (only rendered if product has 2+ photos) */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
              }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhotoIndex((prev) => (prev + 1) % gallery.length);
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center transition-colors"
              aria-label="Siguiente foto"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold flex items-center gap-1 backdrop-blur-xs">
              <Images className="w-2.5 h-2.5 text-[#D4AF37]" />
              <span>{photoIndex + 1}/{gallery.length}</span>
            </div>
          </>
        )}

        {/* Quick View Overlay on hover (Desktop) */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <span className="px-3 py-1.5 rounded-full bg-white/95 text-gray-900 text-xs font-semibold shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
            Ver Detalles
          </span>
        </div>

        {/* Quick Share Button directly on the Image -> Opens WhatsApp */}
        <a
          href={buildProductShareData(product).whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            onShareProduct(product);
          }}
          className="group/share absolute bottom-2 right-2 z-20 px-2.5 py-1 rounded-full bg-white/95 hover:bg-[#25D366] text-gray-800 hover:text-white shadow-md flex items-center gap-1 transition-all duration-200 active:scale-95 border border-black/10 text-[10px] sm:text-[11px] font-semibold"
          title="Compartir este diseño por WhatsApp"
          aria-label={`Compartir ${product.name} por WhatsApp`}
        >
          <Share2 className="w-3 h-3 text-[#25D366] group-hover/share:text-white transition-colors" />
          <span>Compartir</span>
        </a>
      </div>

      {/* Product Information */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between bg-white">
        <div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#A68A36] uppercase tracking-wider font-semibold mb-0.5">
            <span>{product.category}</span>
            <span className="text-gray-400 font-normal">· {product.gender}</span>
          </div>

          <h3 
            onClick={() => onOpenModal(product)}
            className="font-serif text-xs sm:text-sm md:text-base font-medium text-gray-900 leading-snug line-clamp-2 hover:text-[#B8941F] transition-colors cursor-pointer mb-1.5 min-h-[32px] sm:min-h-[38px]"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        <div>
          {/* WHOLESALE PRICING VIEW */}
          {storeMode === 'mayorista' ? (
            <div className="space-y-1 mb-2 bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE3D2] text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1 font-medium text-[10px]">
                  <Package className="w-2.5 h-2.5 text-[#A68A36]" />
                  <span>Pack x6:</span>
                </span>
                <span className="font-bold text-gray-900">
                  {formatPrice(price6)} <span className="text-[9px] text-gray-500 font-normal">c/u</span>
                </span>
              </div>
              <div className="text-[9px] text-gray-400 text-right -mt-1">
                Total: {formatPrice(price6 * 6)}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                <span className="text-gray-700 flex items-center gap-1 font-semibold text-[10px]">
                  <Crown className="w-2.5 h-2.5 text-[#D4AF37]" />
                  <span>Docena x12:</span>
                </span>
                <span className="font-bold text-[#A68A36] text-[12px]">
                  {formatPrice(price12)} <span className="text-[9px] text-gray-500 font-normal">c/u</span>
                </span>
              </div>
              <div className="text-[9px] text-[#A68A36] font-medium text-right -mt-1">
                Total: {formatPrice(price12 * 12)}
              </div>
            </div>
          ) : (
            /* RETAIL PRICING VIEW */
            <div className="mb-1.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm sm:text-base md:text-lg font-bold text-[#1F1F1F]">
                  {formatPrice(product.price)}
                </span>
                {product.oldPrice && product.oldPrice > product.price && (
                  <span className="text-[11px] text-gray-400 line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] text-[#A68A36] font-medium mt-0.5">
                Mayorista: {formatPrice(price6)} c/u (x6)
              </div>
            </div>
          )}

          {/* Stock state */}
          <div className="text-[10px] sm:text-[11px] mb-2">
            {isOutOfStock ? (
              <span className="text-rose-600 font-medium">Agotado</span>
            ) : isLowStock ? (
              <span className="text-amber-600 font-medium">¡Solo {product.stock} disponibles!</span>
            ) : (
              <span className="text-emerald-700 font-medium">{product.stock} disponibles</span>
            )}
          </div>

          {/* Action Buttons */}
          {storeMode === 'mayorista' ? (
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => onAddToCart(product, 6, 'pack6', price6)}
                disabled={isOutOfStock}
                className="px-1.5 py-1.5 rounded-md bg-gray-900 hover:bg-black text-white text-[10px] sm:text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-all active:scale-95 shadow-xs"
                title={`Añadir 6 unidades por ${formatPrice(price6 * 6)}`}
              >
                <Plus className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span>+ Pack 6</span>
              </button>

              <button
                onClick={() => onAddToCart(product, 12, 'pack12', price12)}
                disabled={isOutOfStock}
                className="px-1.5 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#B8941F] text-black text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-0.5 transition-all active:scale-95 shadow-xs"
                title={`Añadir 12 unidades por ${formatPrice(price12 * 12)}`}
              >
                <Crown className="w-2.5 h-2.5" />
                <span>+ Docena</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onOpenModal(product)}
                className="px-2 py-1.5 rounded-md border border-[#DCD6C9] hover:border-[#D4AF37] text-gray-700 hover:text-black text-[11px] sm:text-xs font-medium transition-colors text-center"
              >
                Detalles
              </button>
              <button
                onClick={() => onAddToCart(product, 1, 'detal', product.price)}
                disabled={isOutOfStock}
                className={`px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  isOutOfStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#D4AF37] hover:bg-[#B8941F] text-black shadow-xs active:scale-95'
                }`}
              >
                <Plus className="w-3 h-3" />
                <span>Añadir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
