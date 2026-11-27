import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, emailToKey } from '../firebase';
import { Product } from '../types';

export const PRODUCTS_COLLECTION = 'products';
export const AUTHORIZED_ADMINS_COLLECTION = 'authorizedAdmins';
export const ADMIN_SECURITY_COLLECTION = 'adminSecurity';
export const ADMIN_PIN_DOC_ID = 'pin';
export const MAX_IMAGE_LENGTH = 220000;
export const MAX_EXTRA_IMAGE_LENGTH = 200000;
export const MAX_EXTRA_IMAGES = 3;

export interface AuthorizedAdminRecord {
  emailKey: string;
  email: string;
  createdAt?: string;
}

export interface AdminPinRecord {
  salt: string;
  pinHash: string;
}

const VALID_CATEGORIES = new Set(['Manillas', 'Collares', 'Aretes', 'Anillos', 'Sets', 'Tobilleras']);
const VALID_GENDERS = new Set(['Dama', 'Caballero', 'Niña', 'Niño', 'Unisex']);
const VALID_TYPES = new Set(['detal', 'mayor', 'ambos']);
const VALID_PROMOS = new Set(['ninguno', 'mas_vendido', 'nuevo', 'edicion_limitada']);

function sanitizeId(rawId?: string): string {
  const cleaned = (rawId || `val-${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '-');
  return (cleaned || `val-${Date.now()}`).slice(0, 128);
}

function clampNumber(val: unknown, fallback = 0, max = 100000000): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.min(Math.round(num), max);
}

function toIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

export function buildFirestoreProductPayload(
  input: Partial<Product>,
  id: string,
  uid: string,
  isCreate: boolean
): Record<string, unknown> {
  const imageStr = (input.image || '').trim();
  if (!imageStr) {
    throw new Error('La imagen principal del producto es obligatoria.');
  }
  if (imageStr.length > MAX_IMAGE_LENGTH) {
    throw new Error('La foto principal es muy pesada para la nube. Usa una más liviana o un enlace URL.');
  }

  const rawExtra = Array.isArray(input.images) ? input.images : [];
  const extraImages = rawExtra
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => u.length > 0 && u !== imageStr)
    .slice(0, MAX_EXTRA_IMAGES);

  for (const extra of extraImages) {
    if (extra.length > MAX_EXTRA_IMAGE_LENGTH) {
      throw new Error('Una de las fotos adicionales es muy pesada para la nube.');
    }
  }

  const totalImageBytes = imageStr.length + extraImages.reduce((sum, u) => sum + u.length, 0);
  if (totalImageBytes > 820000) {
    throw new Error('Las fotos combinadas superan el límite por producto. Reduce el peso de alguna foto.');
  }

  const name = (input.name || 'Nueva Pieza').trim().slice(0, 160);
  if (!name) {
    throw new Error('El nombre del producto es obligatorio.');
  }

  const category = VALID_CATEGORIES.has(input.category || '') ? input.category! : 'Manillas';
  const gender = VALID_GENDERS.has(input.gender || '') ? input.gender! : 'Unisex';
  const type = VALID_TYPES.has(input.type || '') ? input.type! : 'ambos';

  const payload: Record<string, unknown> = {
    id,
    name,
    price: clampNumber(input.price, 0, 100000000),
    oldPrice: input.oldPrice && Number(input.oldPrice) > 0 ? clampNumber(input.oldPrice, 0, 100000000) : null,
    wholesalePrice6:
      input.wholesalePrice6 && Number(input.wholesalePrice6) > 0
        ? clampNumber(input.wholesalePrice6, 0, 100000000)
        : null,
    wholesalePrice12:
      input.wholesalePrice12 && Number(input.wholesalePrice12) > 0
        ? clampNumber(input.wholesalePrice12, 0, 100000000)
        : null,
    image: imageStr,
    images: extraImages,
    category,
    gender,
    type,
    stock: clampNumber(input.stock, 0, 1000000),
    material: (input.material || '').trim().slice(0, 300),
    color: (input.color || '').trim().slice(0, 160),
    description: (input.description || '').trim().slice(0, 1000),
    promoBadge: VALID_PROMOS.has(input.promoBadge || '') ? input.promoBadge! : 'ninguno',
    promoUntil: /^\d{4}-\d{2}-\d{2}$/.test((input.promoUntil || '').trim())
      ? (input.promoUntil || '').trim()
      : '',
    updatedAt: serverTimestamp(),
    updatedBy: uid.slice(0, 128),
  };

  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
}

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: Product[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: typeof d.id === 'string' ? d.id : docSnap.id,
          name: String(d.name || ''),
          price: Number(d.price || 0),
          oldPrice: d.oldPrice ?? null,
          wholesalePrice6: d.wholesalePrice6 ?? null,
          wholesalePrice12: d.wholesalePrice12 ?? null,
          image: String(d.image || ''),
          images: Array.isArray(d.images)
            ? d.images.filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0).slice(0, MAX_EXTRA_IMAGES)
            : undefined,
          category: VALID_CATEGORIES.has(d.category) ? d.category : 'Manillas',
          gender: VALID_GENDERS.has(d.gender) ? d.gender : 'Unisex',
          type: VALID_TYPES.has(d.type) ? d.type : 'ambos',
          material: d.material || undefined,
          color: d.color || undefined,
          stock: Number(d.stock ?? 0),
          description: d.description || undefined,
          promoBadge: VALID_PROMOS.has(d.promoBadge) && d.promoBadge !== 'ninguno' ? d.promoBadge : undefined,
          promoUntil: d.promoUntil || undefined,
          createdAt: toIsoDate(d.createdAt),
        };
      });

      items.sort((a, b) => {
        const dateA = a.createdAt ? Date.parse(a.createdAt) : 0;
        const dateB = b.createdAt ? Date.parse(b.createdAt) : 0;
        return dateB - dateA;
      });

      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PRODUCTS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveProductToCloud(
  productData: Partial<Product>,
  uid: string,
  existingIds: Set<string>
): Promise<string> {
  const id = productData.id ? sanitizeId(productData.id) : sanitizeId(`val-${Date.now()}`);
  const isUpdate = Boolean(productData.id && existingIds.has(id));
  const docPath = `${PRODUCTS_COLLECTION}/${id}`;
  const docRef = doc(db, PRODUCTS_COLLECTION, id);

  try {
    const payload = buildFirestoreProductPayload(productData, id, uid, !isUpdate);
    if (isUpdate) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, payload);
    }
    return id;
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, docPath);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const id = sanitizeId(productId);
  const docPath = `${PRODUCTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function replaceCatalogInCloud(
  targetProducts: Product[],
  currentCloudIds: string[],
  uid: string
): Promise<void> {
  const targetIdSet = new Set<string>();
  const operations: Array<{ type: 'create' | 'update' | 'delete'; id: string; data?: Record<string, unknown> }> = [];

  for (const p of targetProducts) {
    const id = sanitizeId(p.id);
    targetIdSet.add(id);
    const existsInCloud = currentCloudIds.includes(id);
    const payload = buildFirestoreProductPayload(p, id, uid, !existsInCloud);
    operations.push({ type: existsInCloud ? 'update' : 'create', id, data: payload });
  }

  for (const oldId of currentCloudIds) {
    if (!targetIdSet.has(oldId)) {
      operations.push({ type: 'delete', id: oldId });
    }
  }

  const chunkSize = 400;
  try {
    for (let i = 0; i < operations.length; i += chunkSize) {
      const chunk = operations.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(db, PRODUCTS_COLLECTION, op.id);
        if (op.type === 'delete') {
          batch.delete(ref);
        } else if (op.type === 'update' && op.data) {
          batch.update(ref, op.data);
        } else if (op.data) {
          batch.set(ref, op.data);
        }
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PRODUCTS_COLLECTION);
  }
}

export function subscribeToAuthorizedAdmins(
  onData: (admins: AuthorizedAdminRecord[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, AUTHORIZED_ADMINS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AuthorizedAdminRecord[] = snapshot.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          emailKey: String(d.emailKey || dSnap.id),
          email: String(d.email || ''),
          createdAt: toIsoDate(d.createdAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, AUTHORIZED_ADMINS_COLLECTION);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function authorizeAdminEmail(email: string, addedByUid: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase().slice(0, 160);
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Ingresa un correo electrónico válido.');
  }
  const key = emailToKey(cleanEmail).slice(0, 128);
  const path = `${AUTHORIZED_ADMINS_COLLECTION}/${key}`;
  try {
    await setDoc(doc(db, AUTHORIZED_ADMINS_COLLECTION, key), {
      emailKey: key,
      email: cleanEmail,
      role: 'admin',
      addedBy: addedByUid.slice(0, 128),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeAuthorizedAdminEmail(emailKey: string): Promise<void> {
  const path = `${AUTHORIZED_ADMINS_COLLECTION}/${emailKey}`;
  try {
    await deleteDoc(doc(db, AUTHORIZED_ADMINS_COLLECTION, emailKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSaltHex(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${pin.trim()}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function verifyAdminPin(pin: string, record: AdminPinRecord): Promise<boolean> {
  const candidate = await hashPinWithSalt(pin, record.salt);
  if (candidate.length !== record.pinHash.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ record.pinHash.charCodeAt(i);
  }
  return diff === 0;
}

export function subscribeToAdminPin(
  onData: (record: AdminPinRecord | null) => void,
  onError?: (error: Error) => void
): () => void {
  const pinRef = doc(db, ADMIN_SECURITY_COLLECTION, ADMIN_PIN_DOC_ID);
  const path = `${ADMIN_SECURITY_COLLECTION}/${ADMIN_PIN_DOC_ID}`;
  return onSnapshot(
    pinRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const d = snapshot.data();
      if (typeof d.salt === 'string' && typeof d.pinHash === 'string') {
        onData({ salt: d.salt, pinHash: d.pinHash });
      } else {
        onData(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveAdminPin(
  pin: string,
  uid: string,
  hasExistingPin: boolean
): Promise<void> {
  const cleanPin = pin.trim();
  if (cleanPin.length < 4 || cleanPin.length > 16) {
    throw new Error('El PIN debe tener entre 4 y 16 dígitos o caracteres.');
  }
  const salt = generateSaltHex();
  const pinHash = await hashPinWithSalt(cleanPin, salt);
  const path = `${ADMIN_SECURITY_COLLECTION}/${ADMIN_PIN_DOC_ID}`;
  const pinRef = doc(db, ADMIN_SECURITY_COLLECTION, ADMIN_PIN_DOC_ID);

  try {
    if (hasExistingPin) {
      await updateDoc(pinRef, {
        salt,
        pinHash,
        updatedBy: uid.slice(0, 128),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(pinRef, {
        salt,
        pinHash,
        updatedBy: uid.slice(0, 128),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, hasExistingPin ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function resetAdminPin(): Promise<void> {
  const path = `${ADMIN_SECURITY_COLLECTION}/${ADMIN_PIN_DOC_ID}`;
  try {
    await deleteDoc(doc(db, ADMIN_SECURITY_COLLECTION, ADMIN_PIN_DOC_ID));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
