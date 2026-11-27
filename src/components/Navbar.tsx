import React from 'react';
import { StoreMode } from '../types';
import { ShoppingBag, Lock, Sparkles, MessageCircle, Search, Crown } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onScrollToProducts: () => void;
  onToggleSearch: () => void;
  searchOpen: boolean;
  storeMode: StoreMode;
  onToggleStoreMode: (mode: StoreMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onScrollToProducts,
  onToggleSearch,
  searchOpen,
  storeMode,
  onToggleStoreMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#161616] text-white shadow-xl border-b border-[#D4AF37]/20">
      {/* Top Banner Bar with subtle shimmer */}
      <div className="gold-gradient-bg py-1.5 px-3 text-center text-[10px] md:text-xs font-semibold tracking-widest uppercase text-white shadow-inner flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Envíos a todo Colombia · Ventas al por Mayor y al Detal · 100% Hecho a Mano</span>
        <Sparkles className="w-3.5 h-3.5 hidden sm:inline" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Brand Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/assets/aistudio/Logotipo_de_lujo_Valiana_Gold_6646a32e.webp"
              alt="Logo VALIANA GOLD"
              className="w-11 h-11 rounded-lg border border-[#D4AF37] bg-white object-contain p-0.5 group-hover:scale-105 transition-transform shadow-md"
            />
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-[0.2em] gold-text-gradient leading-none">
                  VALIANA GOLD
                </h1>
              </div>
              <p className="text-[9px] sm:text-[10px] tracking-[0.25em] text-[#F4E8C1]/80 uppercase font-light mt-0.5">
                Bisutería Artesanal · Hilos Trenzados
              </p>
            </div>
          </div>

          {/* Center Mode Selector (Desktop & Tablet) */}
          <div className="hidden md:flex items-center bg-[#202020] p-1 rounded-xl border border-[#D4AF37]/40 shadow-inner">
            <button
              onClick={() => onToggleStoreMode('detal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                storeMode === 'detal'
                  ? 'bg-white text-black shadow-md'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <span>Venta al Detal</span>
            </button>
            <button
              onClick={() => onToggleStoreMode('mayorista')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                storeMode === 'mayorista'
                  ? 'bg-[#D4AF37] text-black shadow-md'
                  : 'text-gray-300 hover:text-[#D4AF37]'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Catálogo Mayorista (x6 / x12)</span>
            </button>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Trigger */}
            <button
              onClick={onToggleSearch}
              className={`p-2 rounded-full border transition-colors ${
                searchOpen
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-white/10 hover:border-[#D4AF37]/60 text-white/80 hover:text-white'
              }`}
              title="Buscar en catálogo"
              aria-label="Buscar productos"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Direct WhatsApp Action */}
            <a
              href="https://wa.me/573107596760?text=Hola%20VALIANA%20GOLD!%20Me%20interesa%20solicitar%20asesor%C3%ADa%20y%20conocer%20su%20cat%C3%A1logo."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all text-xs font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>+57 310 759 6760</span>
            </a>

            {/* Cart / Pedido Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-all shadow-md active:scale-95"
              aria-label="Ver pedido"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Pedido</span>
              {cartCount > 0 && (
                <span className="bg-black text-[#D4AF37] border border-[#D4AF37] text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={onOpenAdmin}
              className="p-2 rounded-lg border border-white/10 hover:border-[#D4AF37]/60 text-white/70 hover:text-[#D4AF37] transition-colors"
              title="Panel de Administración"
              aria-label="Panel de Administración"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Mode Switcher Bar */}
        <div className="flex md:hidden items-center justify-center pb-2.5 pt-0.5">
          <div className="w-full flex items-center bg-[#202020] p-1 rounded-xl border border-[#D4AF37]/30 shadow-inner">
            <button
              onClick={() => onToggleStoreMode('detal')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                storeMode === 'detal'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-gray-300'
              }`}
            >
              Venta al Detal
            </button>
            <button
              onClick={() => onToggleStoreMode('mayorista')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all flex items-center justify-center gap-1 ${
                storeMode === 'mayorista'
                  ? 'bg-[#D4AF37] text-black shadow-xs font-bold'
                  : 'text-gray-300'
              }`}
            >
              <Crown className="w-3 h-3" />
              <span>Mayoristas (x6/x12)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wholesale Active Banner Bar */}
      {storeMode === 'mayorista' && (
        <div className="bg-[#1f1a0e] text-[#F4E8C1] py-2 px-3 border-t border-[#D4AF37]/30 text-[11px] sm:text-xs text-center flex items-center justify-center gap-2">
          <Crown className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
          <span>
            <strong>Modo Mayorista Activo:</strong> Estás viendo precios especiales por <strong>6 unidades</strong> y por <strong>docena (12 unidades)</strong>.
          </span>
          <button
            onClick={() => onToggleStoreMode('detal')}
            className="underline text-white font-medium hover:text-[#D4AF37] ml-1.5"
          >
            Cambiar a detal
          </button>
        </div>
      )}
    </header>
  );
};
