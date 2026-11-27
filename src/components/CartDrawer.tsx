import React, { useState } from 'react';
import { CartItem } from '../types';
import { formatPrice, buildCartWhatsAppLink, THREAD_COLOR_OPTIONS } from '../utils/formatters';
import { X, Trash2, ShoppingBag, MessageCircle, Crown, Package, Palette, Check, CopyPlus, MessageSquarePlus } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateThreadColor: (index: number, customColor: string | undefined) => void;
  onUpdateItemNote: (index: number, customNote: string | undefined) => void;
  onDuplicateItemInColor: (index: number) => number;
  onClearCart: () => void;
}

const COMMON_CITIES = [
  'Bogotá D.C.',
  'Medellín (Antioquia)',
  'Cali (Valle del Cauca)',
  'Barranquilla (Atlántico)',
  'Bucaramanga (Santander)',
  'Cartagena (Bolívar)',
  'Pereira (Risaralda)',
  'Cúcuta (Norte de Santander)',
  'Santa Marta (Magdalena)',
  'Manizales (Caldas)',
  'Ibagué (Tolima)',
  'Villavicencio (Meta)',
  'Pasto (Nariño)',
  'Armenia (Quindío)',
  'Otra ciudad / municipio',
];

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateThreadColor,
  onUpdateItemNote,
  onDuplicateItemInColor,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [city, setCity] = useState(COMMON_CITIES[0]);
  const [customCity, setCustomCity] = useState('');
  const [notes, setNotes] = useState('');
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  // Calculate total respecting each item's specific unit price (wholesale or retail)
  const totalAmount = items.reduce((sum, i) => {
    const effectivePrice = i.unitPrice ?? i.product.price;
    return sum + effectivePrice * i.quantity;
  }, 0);

  const hasWholesaleItems = items.some((i) => i.tier === 'pack6' || i.tier === 'pack12');

  const handleToggleColorPreset = (index: number, currentVal: string | undefined, colorName: string) => {
    const tokens = (currentVal || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const exists = tokens.some((t) => t.toLowerCase() === colorName.toLowerCase());
    let nextTokens: string[];
    if (exists) {
      nextTokens = tokens.filter((t) => t.toLowerCase() !== colorName.toLowerCase());
    } else {
      nextTokens = [...tokens, colorName];
    }

    onUpdateThreadColor(index, nextTokens.length > 0 ? nextTokens.join(', ') : undefined);
  };

  const finalCity = city === 'Otra ciudad / municipio' ? (customCity || 'Colombia') : city;
  const whatsappCheckoutUrl = buildCartWhatsAppLink(items, {
    name: customerName,
    city: finalCity,
    notes,
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-[#161616] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-serif text-xl font-bold tracking-wide">
              Tu Pedido ({totalQuantity} uds)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar pedido"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode / Benefit Notification Bar */}
        <div className="bg-[#FAF7EE] px-4 py-2.5 border-b border-[#EAE3D2] text-xs">
          {hasWholesaleItems ? (
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <Crown className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pedido con tarifas mayoristas aplicadas. Puedes elegir colores por ítem.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-700">
              <Palette className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span>¿Quieres otro color de hilo en tu pieza? Personalízalo aquí abajo.</span>
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-serif text-lg text-gray-800 mb-1">Tu carrito está vacío</p>
              <p className="text-xs text-gray-500 mb-4">
                Explora nuestras manillas, collares, aretes y conjuntos tejidos a mano.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs transition-colors"
              >
                Ver Colección
              </button>
            </div>
          ) : (
            <>
              {items.map((item, idx) => {
                const effectivePrice = item.unitPrice ?? item.product.price;
                const step = item.tier === 'pack12' ? 12 : item.tier === 'pack6' ? 6 : 1;
                const isEditingColor = editingColorIndex === idx;
                const isEditingNote = editingNoteIndex === idx;
                const selectedTokens = (item.customThreadColor || '')
                  .split(',')
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean);

                return (
                  <div
                    key={item.cartItemId || `${item.product.id}-${item.tier || 'detal'}-${idx}`}
                    className="p-2.5 rounded-xl border border-gray-200/80 bg-[#FAF8F5] relative transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-200 flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-gray-900 truncate max-w-[75%]">
                            {item.product.name}
                          </p>
                          {item.tier === 'pack12' && (
                            <span className="bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Docena
                            </span>
                          )}
                          {item.tier === 'pack6' && (
                            <span className="bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Package className="w-2.5 h-2.5 text-[#D4AF37]" /> Pack x6
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-500 mb-1.5">
                          {item.product.category} · {formatPrice(effectivePrice)} c/u
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-gray-300 rounded bg-white">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, item.quantity - step)}
                              className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                              aria-label="Disminuir cantidad"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-semibold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, Math.min(item.product.stock, item.quantity + step))}
                              className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold text-gray-900">
                            {formatPrice(effectivePrice * item.quantity)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (editingColorIndex === idx) setEditingColorIndex(null);
                          if (editingNoteIndex === idx) setEditingNoteIndex(null);
                          onRemoveItem(idx);
                        }}
                        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-rose-600 p-1"
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Thread Color & Suggestion Summary + Triggers */}
                    <div className="mt-2 pt-2 border-t border-gray-200/70 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-gray-600">
                          {item.customThreadColor ? (
                            <span className="text-[#8B6D16] font-semibold">
                              Hilo elegido: {item.customThreadColor}
                            </span>
                          ) : (
                            <span>
                              Color foto: {item.product.color || 'Original'}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.customNote?.trim() && (
                        <div className="text-[11px] text-gray-700 bg-white/80 border border-[#D4AF37]/30 rounded-md px-2 py-1">
                          <span className="font-semibold text-[#8B6D16]">Sugerencia: </span>
                          <span>{item.customNote}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteIndex(null);
                            setEditingColorIndex(isEditingColor ? null : idx);
                          }}
                          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                            isEditingColor
                              ? 'bg-gray-900 text-white'
                              : item.customThreadColor
                                ? 'bg-[#D4AF37]/20 text-[#7A5E10] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50'
                                : 'bg-white text-gray-700 hover:text-black border border-gray-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <Palette className="w-3 h-3" />
                          <span>{isEditingColor ? 'Cerrar hilo' : item.customThreadColor ? 'Editar hilo' : 'Cambiar hilo'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingColorIndex(null);
                            setEditingNoteIndex(isEditingNote ? null : idx);
                          }}
                          className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                            isEditingNote
                              ? 'bg-gray-900 text-white'
                              : item.customNote?.trim()
                                ? 'bg-[#D4AF37]/20 text-[#7A5E10] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50'
                                : 'bg-white text-gray-700 hover:text-black border border-gray-300 hover:border-[#D4AF37]'
                          }`}
                        >
                          <MessageSquarePlus className="w-3 h-3" />
                          <span>{isEditingNote ? 'Cerrar nota' : item.customNote?.trim() ? 'Editar cambio' : 'Sugerir cambio'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Thread Color Customizer */}
                    {isEditingColor && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-[#D4AF37]/40 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-800">
                            Elige el color o combinación de hilos:
                          </span>
                          {item.customThreadColor && (
                            <button
                              type="button"
                              onClick={() => onUpdateThreadColor(idx, undefined)}
                              className="text-[10px] text-gray-500 hover:text-rose-600 underline"
                            >
                              Usar color original
                            </button>
                          )}
                        </div>

                        {/* Tappable Swatches */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {THREAD_COLOR_OPTIONS.map((opt) => {
                            const isSelected = selectedTokens.includes(opt.name.toLowerCase());
                            return (
                              <button
                                key={opt.name}
                                type="button"
                                onClick={() => handleToggleColorPreset(idx, item.customThreadColor, opt.name)}
                                className={`px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1.5 border transition-all text-left ${
                                  isSelected
                                    ? 'border-[#D4AF37] bg-[#FAF6E8] text-gray-900 font-semibold ring-1 ring-[#D4AF37]'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{
                                    background: opt.hex,
                                    border: opt.border ? `1px solid ${opt.border}` : '1px solid rgba(0,0,0,0.12)',
                                  }}
                                />
                                <span className="truncate">{opt.name}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Free text custom color/mix note */}
                        <div>
                          <input
                            type="text"
                            value={item.customThreadColor || ''}
                            onChange={(e) => onUpdateThreadColor(idx, e.target.value || undefined)}
                            placeholder="O escribe detalle (ej: Rojo con dorado, o 3 negras y 3 rojas)"
                            className="w-full text-[11px] p-2 rounded-md border border-gray-300 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newIdx = onDuplicateItemInColor(idx);
                              setEditingColorIndex(newIdx);
                            }}
                            className="px-2.5 py-1.5 rounded-md border border-gray-300 hover:border-[#D4AF37] text-[11px] font-medium text-gray-700 hover:text-black flex items-center gap-1 transition-colors"
                            title="Agregar otra unidad/paquete de esta pieza en otro color"
                          >
                            <CopyPlus className="w-3 h-3 text-[#B8941F]" />
                            <span>Pedir otra en otro color</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingColorIndex(null)}
                            className="px-3 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#B8941F] text-black text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Listo</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Per-Product Suggestion / Change Request Box */}
                    {isEditingNote && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-[#D4AF37]/40 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-gray-800">
                            Sugerencia o cambio para esta pieza:
                          </span>
                          {item.customNote && (
                            <button
                              type="button"
                              onClick={() => onUpdateItemNote(idx, undefined)}
                              className="text-[10px] text-gray-500 hover:text-rose-600 underline"
                            >
                              Borrar nota
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={2}
                          value={item.customNote || ''}
                          onChange={(e) => onUpdateItemNote(idx, e.target.value || undefined)}
                          placeholder="Ej: Ajustar medida a 16 cm, cambiar dije, sin balines en los extremos..."
                          className="w-full text-[11px] p-2 rounded-md border border-gray-300 bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#D4AF37]"
                        />

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingNoteIndex(null)}
                            className="px-3 py-1.5 rounded-md bg-[#D4AF37] hover:bg-[#B8941F] text-black text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Guardar sugerencia</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Customer information form for WhatsApp dispatch */}
              <div className="mt-4 pt-3 border-t border-gray-200 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Datos de Envío en Colombia
                </p>

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">Tu Nombre o Negocio</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: Carolina Morales / Joyas y Estilo"
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">Ciudad o Municipio de Destino</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {COMMON_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {city === 'Otra ciudad / municipio' && (
                  <div>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="Escribe tu ciudad o municipio"
                      className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1">Sugerencias generales o cambios en el pedido (Opcional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Medida de muñeca, empaque de regalo, indicaciones de entrega..."
                    className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-200 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Total de piezas:</span>
                <span className="font-semibold text-gray-900">{totalQuantity} unidades</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total a Pagar:</span>
                <span className="text-[#A68A36] text-base">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <a
              href={whatsappCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Enviar Pedido por WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClearCart}
              className="w-full text-[11px] text-gray-400 hover:text-gray-600 text-center"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
