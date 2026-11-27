import React from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_PHONE } from '../utils/formatters';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <aside aria-label="Contacto rápido" className="fixed bottom-6 right-6 z-40 flex items-center group">
      <span className="hidden md:inline-block mr-2 px-3 py-1.5 rounded-full bg-[#161616] text-[#F4E8C1] text-xs font-medium shadow-lg border border-[#D4AF37]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        ¿Dudas o pedidos? Escríbenos
      </span>
      <a
        href={`https://wa.me/${WHATSAPP_PHONE}?text=Hola%20VALIANA%20GOLD!%20Deseo%20hacer%20un%20pedido%20o%20consultar%20su%20cat%C3%A1logo.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar a VALIANA GOLD por WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping" />
        <MessageCircle className="w-7 h-7 fill-current relative z-10" />
      </a>
    </aside>
  );
};
