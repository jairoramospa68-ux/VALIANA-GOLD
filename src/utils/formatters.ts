import { CartItem, Product, SaleType, WholesaleTier } from '../types';

export const WHATSAPP_PHONE = '573107596760';
export const PUBLIC_STORE_URL = 'https://valiana-gold.netlify.app';

export function formatPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const sign = safe < 0 ? '-' : '';
  const formatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${formatted}`;
}

export function getSaleTypeLabel(type: SaleType): string {
  switch (type) {
    case 'mayor':
      return 'Al Por Mayor';
    case 'detal':
      return 'Al Detal';
    case 'ambos':
      return 'Mayor y Detal';
    default:
      return 'Al Detal';
  }
}

export function getProductGallery(product: Product): string[] {
  const list = [product.image, ...(product.images || [])]
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean);
  const unique: string[] = [];
  for (const url of list) {
    if (!unique.includes(url)) {
      unique.push(url);
    }
    if (unique.length >= 4) break;
  }
  return unique.length > 0
    ? unique
    : ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=80'];
}

export function getWholesalePrice6(product: Product): number {
  if (product.wholesalePrice6 && product.wholesalePrice6 > 0) {
    return product.wholesalePrice6;
  }
  // Default wholesale price for 6 units (approx. 25% off round to thousands)
  return Math.round((product.price * 0.75) / 1000) * 1000;
}

export function getWholesalePrice12(product: Product): number {
  if (product.wholesalePrice12 && product.wholesalePrice12 > 0) {
    return product.wholesalePrice12;
  }
  // Default wholesale price for 12 units (approx. 38% off round to thousands)
  return Math.round((product.price * 0.62) / 1000) * 1000;
}

export function getActivePromoBadge(product: Product): { label: string; color: string; icon: string } | null {
  if (!product.promoBadge || product.promoBadge === 'ninguno') return null;

  // Check if date has expired
  if (product.promoUntil) {
    const today = new Date().toISOString().split('T')[0];
    if (today > product.promoUntil) {
      return null; // Expired promo badge
    }
  }

  switch (product.promoBadge) {
    case 'mas_vendido':
      return { label: 'Más Vendido', color: 'bg-amber-600 text-white', icon: '★' };
    case 'nuevo':
      return { label: 'Nuevo Lanzamiento', color: 'bg-emerald-700 text-white', icon: '✦' };
    case 'edicion_limitada':
      return { label: 'Edición Limitada', color: 'bg-[#181818] text-[#F4E8C1] border border-[#D4AF37]/60', icon: '👑' };
    default:
      return null;
  }
}

export function buildProductShareData(product: Product) {
  const baseUrl = window.location.hostname.includes('netlify.app')
    ? `${window.location.origin}${window.location.pathname}`
    : `${PUBLIC_STORE_URL}/`;
  const url = `${baseUrl}#producto=${product.id}`;
  const price6 = getWholesalePrice6(product);
  const price12 = getWholesalePrice12(product);

  const details = `¡Mira este diseño de VALIANA GOLD! ✨\n\n💎 *${product.name}*\n🏷️ Precio Detal: ${formatPrice(product.price)}\n📦 Mayorista x6 uds: ${formatPrice(price6)} c/u\n👑 Mayorista x12 uds: ${formatPrice(price12)} c/u\n📂 Categoría: ${product.category}`;
  const text = `${details}\n\nMira la foto del diseño y guarda nuestro catálogo en tu celular aquí:\n${url}`;
  const nativeText = `${details}\n\nMira la foto del diseño y guarda nuestra tienda en tu celular:`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return { title: `${product.name} · VALIANA GOLD`, text, nativeText, url, whatsappUrl };
}

export function exportProductsToJSON(products: Product[]) {
  const payload = {
    app: 'VALIANA GOLD',
    version: 2,
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  const date = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `valiana-gold-respaldo-${date}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseCatalogBackupJSON(rawText: string): Product[] | null {
  const parsed = JSON.parse(rawText);
  const list = Array.isArray(parsed)
    ? parsed
    : parsed && Array.isArray(parsed.products)
      ? parsed.products
      : null;

  if (!list || list.length === 0) return null;
  const isValid = list.every(
    (item: any) => item && typeof item.name === 'string' && item.price !== undefined
  );
  return isValid ? (list as Product[]) : null;
}

export function exportProductsToCSV(products: Product[]) {
  const headers = [
    'ID', 'Nombre', 'Precio Detal', 'Precio Mayorista x6', 'Precio Mayorista x12', 
    'Precio Anterior', 'Categoría', 'Género', 'Modalidad', 'Stock', 'Material', 
    'Color', 'Insignia Promocional', 'Fecha Límite Promo', 'Imagen URL'
  ];
  const rows = products.map((p) => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    p.price,
    getWholesalePrice6(p),
    getWholesalePrice12(p),
    p.oldPrice || '',
    p.category,
    p.gender,
    p.type,
    p.stock,
    `"${(p.material || '').replace(/"/g, '""')}"`,
    `"${(p.color || '').replace(/"/g, '""')}"`,
    p.promoBadge || 'ninguno',
    p.promoUntil || '',
    `"${(p.image || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `valiana-gold-catalogo-${date}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function buildProductWhatsAppLink(product: Product, tier: WholesaleTier = 'detal'): string {
  let tierInfo = `• *Precio Detal:* ${formatPrice(product.price)}`;
  if (tier === 'pack6') {
    const p6 = getWholesalePrice6(product);
    tierInfo = `• *Modalidad:* Paquete Mayorista x6 unidades\n• *Precio Unitario Mayorista:* ${formatPrice(p6)} c/u\n• *Total Paquete 6:* ${formatPrice(p6 * 6)}`;
  } else if (tier === 'pack12') {
    const p12 = getWholesalePrice12(product);
    tierInfo = `• *Modalidad:* Docena Mayorista x12 unidades\n• *Precio Unitario Docena:* ${formatPrice(p12)} c/u\n• *Total Docena 12:* ${formatPrice(p12 * 12)}`;
  }

  const text = `¡Hola VALIANA GOLD! ✨\n\nMe interesa conocer disponibilidad para pedido de:\n• *Producto:* ${product.name}\n${tierInfo}\n• *Categoría:* ${product.category}\n${product.material ? `• *Material:* ${product.material}\n` : ''}\n¿Tienen disponibilidad actual para despacho? ¡Muchas gracias!`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}

export interface ThreadColorOption {
  name: string;
  hex: string;
  border?: string;
}

export const THREAD_COLOR_OPTIONS: ThreadColorOption[] = [
  { name: 'Negro', hex: '#1A1A1A' },
  { name: 'Rojo', hex: '#C62828' },
  { name: 'Dorado', hex: '#D4AF37' },
  { name: 'Beige', hex: '#DFC9A6' },
  { name: 'Blanco', hex: '#FFFFFF', border: '#D1D5DB' },
  { name: 'Vinotinto', hex: '#6A1B29' },
  { name: 'Turquesa', hex: '#0097A7' },
  { name: 'Azul Rey', hex: '#1E40AF' },
  { name: 'Esmeralda', hex: '#047857' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Café', hex: '#6D4C41' },
  { name: 'Surtido', hex: 'linear-gradient(135deg, #C62828, #D4AF37, #0097A7, #1A1A1A)' },
];

export function buildCartWhatsAppLink(
  items: CartItem[],
  customer: { name: string; city: string; notes?: string }
): string {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total respecting specific unit prices
  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.unitPrice ?? item.product.price;
    return sum + effectivePrice * item.quantity;
  }, 0);

  const hasWholesaleTiers = items.some(i => i.tier === 'pack6' || i.tier === 'pack12');

  const itemLines = items
    .map((item, idx) => {
      const effectivePrice = item.unitPrice ?? item.product.price;
      const tierLabel = item.tier === 'pack12' 
        ? ' [👑 Docena Mayorista]' 
        : item.tier === 'pack6' 
          ? ' [📦 Pack x6 Mayorista]' 
          : ' [Detal]';
      const colorLine = item.customThreadColor?.trim()
        ? `\n   - *Color de hilo personalizado:* ${item.customThreadColor.trim()}`
        : '';
      const noteLine = item.customNote?.trim()
        ? `\n   - *Sugerencia / cambio:* ${item.customNote.trim()}`
        : '';
      return `${idx + 1}. *${item.product.name}*${tierLabel}\n   - Cantidad: ${item.quantity} un.${colorLine}${noteLine}\n   - Unitario: ${formatPrice(effectivePrice)}\n   - Subtotal: ${formatPrice(effectivePrice * item.quantity)}`;
    })
    .join('\n\n');

  const text = `👑 *PEDIDO VALIANA GOLD - ${hasWholesaleTiers ? 'MAYORISTA / EMPRENDEDOR' : 'BISUTERÍA ARTESANAL'}* 👑\n\n` +
    `👤 *Cliente:* ${customer.name || 'Cliente'}\n` +
    `📍 *Ciudad / Destino:* ${customer.city || 'Colombia'}\n` +
    (customer.notes ? `📝 *Observaciones:* ${customer.notes}\n` : '') +
    `\n📦 *DETALLE DE PIEZAS:* \n${itemLines}\n\n` +
    `--------------------------------\n` +
    `🔹 *Total Piezas:* ${totalQuantity} unidades\n` +
    `⭐ *TOTAL ESTIMADO:* ${formatPrice(subtotal)}\n` +
    `--------------------------------\n` +
    `¿Me confirman disponibilidad y medios de pago para coordinar el despacho? Gracias.`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
