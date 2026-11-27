import React from 'react';
import { MessageCircle, Sparkles, MapPin, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="bg-[#141414] text-white pt-8 pb-14 sm:pt-12 sm:pb-20 border-t border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#D4AF37] font-serif text-xl sm:text-2xl font-bold tracking-widest">
                VALIANA GOLD
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-3">
              Bisutería artesanal hecha 100% a mano con hilos trenzados de alta resistencia y acabados en oro laminado 18k. Cada creación cuenta una historia.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#F4E8C1]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Calidad y dedicación artesanal</span>
            </div>
          </div>

          {/* Wholesale & Retail Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
              Ventas y Modalidades
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>• Ventas al detal con entrega inmediata</li>
              <li>• Ventas al por mayor para distribuidores</li>
              <li>• Descuento especial a partir de 6 piezas</li>
              <li>• Diseños personalizados bajo pedido</li>
              <li>• Empaque individual para revendedores</li>
            </ul>
          </div>

          {/* Shipping & Coverage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
              Envíos y Cobertura
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                <span>Despachos a toda Colombia (ciudades principales y municipios)</span>
              </li>
              <li>• Envíos coordinados por transportadoras certificadas</li>
              <li>• Pagos por Nequi, Daviplata, Bancolombia y transferencias</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3">
              Atención Directa
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              ¿Deseas una cotización o pedido personalizado? Escríbenos directamente a nuestra línea de atención:
            </p>
            <a
              href="https://wa.me/573107596760?text=Hola%20VALIANA%20GOLD!%20Me%20gustar%C3%ADa%20hacer%20una%20consulta."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>WhatsApp: +57 310 759 6760</span>
            </a>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs text-gray-500 gap-3">
          <p>© {new Date().getFullYear()} VALIANA GOLD · Bisutería Artesanal Colombiana. Todos los derechos reservados.</p>
          <div className="flex items-center justify-center gap-3">
            <span>Hecho a mano con esmero y amor en Colombia</span>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="p-1 rounded text-gray-700 hover:text-[#D4AF37] transition-colors"
                title="Gestión interna"
                aria-label="Gestión interna"
              >
                <Lock className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
