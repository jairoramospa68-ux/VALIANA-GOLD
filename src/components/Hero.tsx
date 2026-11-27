import React from 'react';
import { Sparkles, MessageCircle, ArrowDown } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative overflow-hidden bg-[#181818] text-white py-6 sm:py-10 md:py-14 border-b border-[#D4AF37]/20">
      {/* Background with luxury mood overlay */}
      <div 
        className="absolute inset-0 opacity-25 mix-blend-luminosity bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1600&q=80')"
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#161616]/85 to-[#1c1c1c]/90 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Subtle Pill-free Kicker */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[#D4AF37] font-medium mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Colección Encanto de Mi Tierra</span>
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        </div>

        <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-normal leading-tight text-white mb-1.5">
          Donde el estilo se convierte en <span className="font-semibold italic gold-text-gradient">elegancia</span>
        </h2>

        <p className="font-serif text-base sm:text-xl md:text-2xl text-[#F4E8C1] italic font-normal tracking-wide max-w-3xl mx-auto mb-2">
          «Más que un accesorio, una expresión de estilo y buen gusto»
        </p>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-gray-300 font-light leading-relaxed mb-4">
          Piezas únicas elaboradas a mano con hilos trenzados de alta calidad, oro laminado 18k y detalles que realzan tu esencia.
        </p>

        {/* Feature Points */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 text-[11px] sm:text-xs text-gray-300 mb-5">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Ventas al por mayor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Ventas al detal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span>Envíos a toda Colombia</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
          <button
            onClick={onExploreClick}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-1.5 group"
          >
            <span>Ver Catálogo</span>
            <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
          </button>

          <a
            href="https://wa.me/573107596760?text=Hola%20VALIANA%20GOLD!%20Me%20interesa%20conocer%20precios%20al%20por%20mayor%20y%20al%20detal%20de%20su%20bisuter%C3%ADa."
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
