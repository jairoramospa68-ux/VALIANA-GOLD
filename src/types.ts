export type Category = 'Todos' | 'Manillas' | 'Collares' | 'Aretes' | 'Anillos' | 'Sets' | 'Tobilleras';

export type Gender = 'Dama' | 'Caballero' | 'Niña' | 'Niño' | 'Unisex';

export type SaleType = 'detal' | 'mayor' | 'ambos';

export type PromoBadge = 'ninguno' | 'mas_vendido' | 'nuevo' | 'edicion_limitada';

export type StoreMode = 'detal' | 'mayorista';

export interface Product {
  id: string;
  name: string;
  price: number; // Precio al detal (1 unidad)
  oldPrice?: number | null;
  wholesalePrice6?: number | null; // Precio unitario llevando 6 unidades
  wholesalePrice12?: number | null; // Precio unitario llevando 12 unidades (docena)
  image: string;
  images?: string[]; // Hasta 3 fotos adicionales opcionales (máx. 4 en total)
  category: 'Manillas' | 'Collares' | 'Aretes' | 'Anillos' | 'Sets' | 'Tobilleras';
  gender: Gender;
  type: SaleType;
  material?: string;
  color?: string;
  stock: number;
  description?: string;
  promoBadge?: PromoBadge;
  promoUntil?: string; // Optional expiry date YYYY-MM-DD
  createdAt?: string;
}

export type WholesaleTier = 'detal' | 'pack6' | 'pack12';

export interface CartItem {
  cartItemId?: string;
  product: Product;
  quantity: number;
  tier?: WholesaleTier;
  unitPrice?: number; // Precio unitario cobrado
  customThreadColor?: string; // Color o combinación de hilos elegida en el carrito
  customNote?: string; // Sugerencia o cambio específico solicitado por el cliente
}
