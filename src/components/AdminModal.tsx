import React, { useState, useRef } from 'react';
import { User } from 'firebase/auth';
import { Product, Category, Gender, SaleType, PromoBadge } from '../types';
import { PRESET_IMAGES } from '../data/initialProducts';
import { MAX_IMAGE_LENGTH, MAX_EXTRA_IMAGE_LENGTH, MAX_EXTRA_IMAGES } from '../services/catalogService';
import {
  formatPrice,
  getActivePromoBadge,
  exportProductsToJSON,
  exportProductsToCSV,
  parseCatalogBackupJSON,
  getWholesalePrice6,
  getWholesalePrice12,
  getProductGallery,
} from '../utils/formatters';
import {
  X,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  Search,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  FileCode,
  Tag,
  Calendar,
  Crown,
  Package,
  Cloud,
  LogOut,
  LogIn,
  KeyRound,
  UserPlus,
  UserCheck,
} from 'lucide-react';
import { AuthorizedAdminRecord } from '../services/catalogService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  authUser: User | null;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  authLoading: boolean;
  isCloudSynced: boolean;
  authorizedAdmins: AuthorizedAdminRecord[];
  pinLoading: boolean;
  hasPinConfigured: boolean;
  isPinUnlocked: boolean;
  onVerifyPin: (pin: string) => Promise<boolean>;
  onSetPin: (pin: string) => Promise<void>;
  onResetPin: () => Promise<void>;
  onLockPin: () => void;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onAuthorizeAdminEmail: (email: string) => Promise<void>;
  onRevokeAdminEmail: (emailKey: string) => Promise<void>;
  onSaveProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onResetCatalog: () => Promise<void>;
  onRestoreCatalog: (products: Product[]) => Promise<void>;
  onPublishLocalToCloud: () => Promise<void>;
  onShowToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  products,
  authUser,
  isAdmin,
  isBootstrapAdmin,
  authLoading,
  isCloudSynced,
  authorizedAdmins,
  pinLoading,
  hasPinConfigured,
  isPinUnlocked,
  onVerifyPin,
  onSetPin,
  onResetPin,
  onLockPin,
  onSignInGoogle,
  onSignOutGoogle,
  onAuthorizeAdminEmail,
  onRevokeAdminEmail,
  onSaveProduct,
  onDeleteProduct,
  onResetCatalog,
  onRestoreCatalog,
  onPublishLocalToCloud,
  onShowToast,
}) => {
  // Client allowlist & PIN state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [wholesalePrice6, setWholesalePrice6] = useState('');
  const [wholesalePrice12, setWholesalePrice12] = useState('');
  const [category, setCategory] = useState<Category>('Manillas');
  const [gender, setGender] = useState<Gender>('Dama');
  const [saleType, setSaleType] = useState<SaleType>('ambos');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('');
  const [stock, setStock] = useState('10');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [extraUrlInput, setExtraUrlInput] = useState('');
  const [promoBadge, setPromoBadge] = useState<PromoBadge>('ninguno');
  const [promoUntil, setPromoUntil] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  // Loading & UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');

  // File backup tracking
  const [hasPendingBackup, setHasPendingBackup] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() =>
    localStorage.getItem('valiana_last_backup_at')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsAuthActionLoading(true);
    try {
      await onSignInGoogle();
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleUnlockPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!pinInput.trim()) {
      setPinError('Ingresa el PIN de seguridad.');
      return;
    }
    setIsAuthActionLoading(true);
    try {
      const ok = await onVerifyPin(pinInput);
      if (ok) {
        setPinInput('');
      } else {
        setPinError('PIN incorrecto. Verifica e intenta de nuevo.');
      }
    } catch {
      setPinError('No se pudo verificar el PIN.');
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSaveNewPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();
    if (cleanNew.length < 4 || cleanNew.length > 16) {
      setPinError('El PIN debe tener entre 4 y 16 caracteres o dígitos.');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setPinError('Los dos PIN no coinciden.');
      return;
    }
    setIsAuthActionLoading(true);
    try {
      await onSetPin(cleanNew);
      setNewPinInput('');
      setConfirmPinInput('');
    } catch (err) {
      setPinError(err instanceof Error ? err.message : 'No se pudo guardar el PIN.');
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleAddAuthorizedAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setIsSubmitting(true);
    try {
      await onAuthorizeAdminEmail(newAdminEmail);
      setNewAdminEmail('');
      onShowToast('¡Correo autorizado como administrador!');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'No se pudo autorizar el correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportJSONBackup = () => {
    exportProductsToJSON(products);
    const nowLabel = new Date().toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    localStorage.setItem('valiana_last_backup_at', nowLabel);
    setLastBackupAt(nowLabel);
    setHasPendingBackup(false);
    onShowToast('¡Información guardada en archivo de respaldo (.json)!');
  };

  const compressImageToLimit = (img: HTMLImageElement, maxSize: number, quality: number): string => {
    let { width, height } = img;
    if (width > maxSize || height > maxSize) {
      if (width > height) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  };

  const compressFileToDataUrl = (file: File, maxLimit: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('La imagen supera 8MB. Selecciona una foto más liviana.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('No se pudo leer la imagen.'));
          return;
        }
        const img = new Image();
        img.onload = () => {
          let compressed = compressImageToLimit(img, 680, 0.74);
          if (compressed.length > maxLimit) {
            compressed = compressImageToLimit(img, 520, 0.62);
          }
          if (compressed && compressed.length <= maxLimit) {
            resolve(compressed);
          } else {
            reject(new Error('La foto sigue siendo muy pesada para la nube.'));
          }
        };
        img.onerror = () => {
          if (result.length <= maxLimit) {
            resolve(result);
          } else {
            reject(new Error('No se pudo procesar la imagen.'));
          }
        };
        img.src = result;
      };
      reader.onerror = () => reject(new Error('Error leyendo el archivo.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const optimized = await compressFileToDataUrl(file, MAX_IMAGE_LENGTH);
      setImage(optimized);
      onShowToast('Foto principal optimizada para la nube');
    } catch (err) {
      onShowToast(err instanceof Error ? err.message : 'No se pudo cargar la foto.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleExtraFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_EXTRA_IMAGES - extraImages.length;
    if (remainingSlots <= 0) {
      onShowToast('Ya alcanzaste el máximo de 4 fotos por producto.');
      if (e.target) e.target.value = '';
      return;
    }

    const selected = files.slice(0, remainingSlots);
    const added: string[] = [];
    for (const file of selected) {
      try {
        const optimized = await compressFileToDataUrl(file, MAX_EXTRA_IMAGE_LENGTH);
        added.push(optimized);
      } catch (err) {
        onShowToast(err instanceof Error ? err.message : 'Una foto no se pudo cargar.');
      }
    }

    if (added.length > 0) {
      setExtraImages((prev) => [...prev, ...added].slice(0, MAX_EXTRA_IMAGES));
      onShowToast(
        added.length === 1
          ? 'Foto adicional agregada'
          : `Se agregaron ${added.length} fotos adicionales`
      );
    }
    if (e.target) e.target.value = '';
  };

  const handleAddExtraUrl = () => {
    const trimmed = extraUrlInput.trim();
    if (!trimmed) return;
    if (extraImages.length >= MAX_EXTRA_IMAGES) {
      onShowToast('Ya alcanzaste el máximo de 4 fotos por producto.');
      return;
    }
    if (trimmed === image.trim() || extraImages.includes(trimmed)) {
      onShowToast('Esa foto ya está agregada en este producto.');
      return;
    }
    if (trimmed.length > MAX_EXTRA_IMAGE_LENGTH) {
      onShowToast('El enlace es demasiado largo.');
      return;
    }
    setExtraImages((prev) => [...prev, trimmed]);
    setExtraUrlInput('');
  };

  const handlePromoteExtraToPrimary = (idx: number) => {
    const target = extraImages[idx];
    if (!target) return;
    const prevPrimary = image.trim();
    setImage(target);
    setExtraImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prevPrimary) {
        next.splice(idx, 0, prevPrimary);
      }
      return next.slice(0, MAX_EXTRA_IMAGES);
    });
    onShowToast('Foto establecida como principal');
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setOldPrice(p.oldPrice ? p.oldPrice.toString() : '');
    setWholesalePrice6(p.wholesalePrice6 ? p.wholesalePrice6.toString() : '');
    setWholesalePrice12(p.wholesalePrice12 ? p.wholesalePrice12.toString() : '');
    setCategory(p.category);
    setGender(p.gender);
    setSaleType(p.type);
    setMaterial(p.material || '');
    setColor(p.color || '');
    setStock(p.stock.toString());
    setDescription(p.description || '');
    setImage(p.image);
    setExtraImages((p.images || []).slice(0, MAX_EXTRA_IMAGES));
    setExtraUrlInput('');
    setPromoBadge(p.promoBadge || 'ninguno');
    setPromoUntil(p.promoUntil || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onShowToast(`Editando: ${p.name}`);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setOldPrice('');
    setWholesalePrice6('');
    setWholesalePrice12('');
    setCategory('Manillas');
    setGender('Dama');
    setSaleType('ambos');
    setMaterial('');
    setColor('');
    setStock('10');
    setDescription('');
    setImage('');
    setExtraImages([]);
    setExtraUrlInput('');
    setPromoBadge('ninguno');
    setPromoUntil('');
    setShowPresets(false);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !image.trim()) {
      onShowToast('Por favor completa los campos requeridos (nombre, precio, imagen)');
      return;
    }

    if (image.trim().length > MAX_IMAGE_LENGTH) {
      onShowToast('La imagen supera el tamaño permitido en la nube. Sube una foto más liviana o pega un enlace URL.');
      return;
    }

    const productData: Partial<Product> = {
      ...(editingId ? { id: editingId } : {}),
      name: name.trim(),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      wholesalePrice6: wholesalePrice6 ? Number(wholesalePrice6) : null,
      wholesalePrice12: wholesalePrice12 ? Number(wholesalePrice12) : null,
      category: category === 'Todos' ? 'Manillas' : category,
      gender,
      type: saleType,
      material: material.trim() || undefined,
      color: color.trim() || undefined,
      stock: Number(stock) || 0,
      description: description.trim() || undefined,
      image: image.trim(),
      images: extraImages.filter((u) => u && u !== image.trim()).slice(0, MAX_EXTRA_IMAGES),
      promoBadge: promoBadge !== 'ninguno' ? promoBadge : undefined,
      promoUntil: promoUntil.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSaveProduct(productData);
      handleResetForm();
      setHasPendingBackup(true);
      onShowToast(
        editingId
          ? '¡Producto actualizado en la nube para todos los clientes!'
          : '¡Producto publicado en la nube para todos los clientes!'
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo guardar en la nube.';
      onShowToast(msg.includes('{') ? 'Error de permisos o conexión con la nube.' : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const restored = parseCatalogBackupJSON(content);
        if (restored) {
          if (
            confirm(
              `Se encontraron ${restored.length} productos en el archivo. ¿Deseas subirlos a la nube para todos tus clientes?`
            )
          ) {
            setIsSubmitting(true);
            try {
              await onRestoreCatalog(restored);
              setHasPendingBackup(false);
              onShowToast(`¡Archivo restaurado en la nube! ${restored.length} productos actualizados.`);
            } finally {
              setIsSubmitting(false);
            }
          }
        } else {
          onShowToast('El archivo no contiene un catálogo válido de VALIANA GOLD.');
        }
      } catch {
        onShowToast('Error al leer o subir el archivo JSON de respaldo.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D4AF37]/30 my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-[#161616] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#D4AF37]" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
                Panel de Administración
              </h2>
              <p className="text-[10px] sm:text-xs text-[#F4E8C1]/70">
                Catálogo en la nube en tiempo real · VALIANA GOLD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Gate */}
        {authLoading ? (
          <div className="p-10 text-center text-xs text-gray-500">
            Verificando sesión de administrador...
          </div>
        ) : !authUser || !isAdmin ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 text-[#D4AF37]">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-1.5">
              Acceso de Administrador
            </h3>

            {authUser && !isAdmin ? (
              <div className="space-y-4 mt-3">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
                  La cuenta <strong>{authUser.email}</strong> no está autorizada para administrar esta tienda. Solo el propietario o los correos Gmail autorizados dentro del panel pueden ingresar.
                </div>
                <button
                  type="button"
                  onClick={onSignOutGoogle}
                  className="w-full py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión y probar otra cuenta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Inicia sesión con tu cuenta autorizada de Google para publicar y actualizar productos al instante en todos los celulares.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isAuthActionLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isAuthActionLoading ? 'Conectando...' : 'Ingresar con Google'}</span>
                </button>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Acceso restringido: cualquier otro correo Gmail externo es bloqueado automáticamente.
                </p>
              </div>
            )}
          </div>
        ) : pinLoading ? (
          <div className="p-10 text-center text-xs text-gray-500">
            Verificando seguridad del panel...
          </div>
        ) : !hasPinConfigured ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 text-[#D4AF37]">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-1">
              Crea tu PIN de Seguridad
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Cuenta verificada: <strong>{authUser.email}</strong>. Crea un PIN personal para que solo tú puedas abrir el panel aunque el celular esté desbloqueado.
            </p>

            <form onSubmit={handleSaveNewPinSubmit} className="space-y-3 text-left">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Nuevo PIN (4 a 16 dígitos o letras)
                </label>
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Ej: 4829"
                  maxLength={16}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-sm tracking-widest text-center focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Confirmar PIN
                </label>
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Repite tu PIN"
                  maxLength={16}
                  className="w-full p-2.5 rounded-lg border border-gray-300 text-sm tracking-widest text-center focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-600 text-center font-medium">{pinError}</p>
              )}

              <button
                type="submit"
                disabled={isAuthActionLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-60"
              >
                {isAuthActionLoading ? 'Guardando PIN...' : 'Guardar PIN y Entrar'}
              </button>
            </form>

            <button
              type="button"
              onClick={onSignOutGoogle}
              className="mt-4 text-xs text-gray-500 hover:text-gray-800 underline"
            >
              Cerrar sesión de Google
            </button>
          </div>
        ) : !isPinUnlocked ? (
          <div className="p-6 sm:p-10 max-w-md mx-auto text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#D4AF37] flex items-center justify-center mx-auto mb-3 text-[#D4AF37]">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-1">
              Ingresa tu PIN de Seguridad
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Sesión activa: <strong>{authUser.email}</strong>. Confirma el PIN de la tienda para editar productos y precios.
            </p>

            <form onSubmit={handleUnlockPinSubmit} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="••••"
                maxLength={16}
                autoFocus
                className="w-full p-3 rounded-xl border border-gray-300 text-base tracking-[0.35em] text-center focus:outline-none focus:border-[#D4AF37]"
                required
              />

              {pinError && (
                <p className="text-xs text-rose-600 font-medium">{pinError}</p>
              )}

              <button
                type="submit"
                disabled={isAuthActionLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-60"
              >
                {isAuthActionLoading ? 'Verificando...' : 'Desbloquear Panel'}
              </button>
            </form>

            <div className="mt-4 flex flex-col items-center gap-2">
              {isBootstrapAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        '¿Restablecer el PIN actual para crear uno nuevo? Solo tú como propietario puedes hacer esto.'
                      )
                    ) {
                      await onResetPin();
                    }
                  }}
                  className="text-[11px] text-[#8B6D16] hover:underline font-medium"
                >
                  ¿Olvidaste el PIN? Restablecer como propietario
                </button>
              )}
              <button
                type="button"
                onClick={onSignOutGoogle}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Salir y cambiar de cuenta
              </button>
            </div>
          </div>
        ) : (
          /* Admin Dashboard Content */
          <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto space-y-6">
            {/* Cloud Sync Status Strip */}
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-xs text-emerald-900">
                <Cloud className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div>
                  <span className="font-bold">
                    {isCloudSynced ? 'Nube conectada en tiempo real' : 'Catálogo listo para publicar en la nube'}
                  </span>
                  <span className="text-emerald-700 ml-1.5">· {authUser.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isCloudSynced && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await onPublishLocalToCloud();
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
                  >
                    Publicar catálogo inicial en la nube
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLockPin}
                  className="px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/60 bg-white hover:bg-[#FAF8F5] text-gray-800 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Bloquear con PIN"
                >
                  <Lock className="w-3.5 h-3.5 text-[#B8941F]" />
                  <span>Bloquear PIN</span>
                </button>
                <button
                  type="button"
                  onClick={onSignOutGoogle}
                  className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {/* Quick File Save / Restore Banner */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                hasPendingBackup
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-[#F8F6F0] border-[#D4AF37]/40'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  {hasPendingBackup ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  ) : (
                    <Download className="w-4 h-4 text-[#B8941F] flex-shrink-0" />
                  )}
                  <span>
                    {hasPendingBackup
                      ? 'Cambios recientes · descarga copia opcional en archivo'
                      : 'Copia de seguridad en archivo'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {lastBackupAt
                    ? `Último archivo guardado: ${lastBackupAt}`
                    : 'Además de la nube, puedes descargar un archivo de respaldo en tu equipo o celular.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleExportJSONBackup}
                  className="px-3 py-2 rounded-lg bg-[#161616] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Guardar en Archivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg border border-[#D4AF37] bg-white hover:bg-[#D4AF37]/10 text-gray-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Cargar Archivo</span>
                </button>
              </div>
            </div>

            {/* Product Add / Edit Form */}
            <div className="bg-[#FAF8F5] p-5 sm:p-6 rounded-xl border border-[#EAE3D2]">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2DDD3]">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>{editingId ? 'Editar Producto' : 'Agregar Nuevo Producto al Catálogo'}</span>
                </h3>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Image Section */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    Imagen de la pieza *{' '}
                    <span className="text-gray-400 font-normal">
                      (URL o sube una foto desde tu galería/cámara)
                    </span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="https://... o sube archivo abajo"
                      className="flex-1 p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-lg border border-gray-300 hover:border-[#D4AF37] bg-white text-gray-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Subir foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="px-3 py-2 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-black text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#D4AF37]/20 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Fotos de muestra</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Preset library picker */}
                  {showPresets && (
                    <div className="p-3 bg-white rounded-lg border border-gray-200 mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImage(preset.url);
                            setShowPresets(false);
                            onShowToast(`Foto de muestra seleccionada: ${preset.label}`);
                          }}
                          className="flex items-center gap-2 p-1.5 rounded border border-gray-100 hover:border-[#D4AF37] hover:bg-[#FAF8F5] cursor-pointer text-[11px]"
                        >
                          <img src={preset.url} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="truncate">{preset.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Image Preview */}
                  {image && (
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={image}
                        alt="Vista previa"
                        className="w-16 h-16 rounded-lg object-cover border border-gray-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Foto principal lista para publicar
                      </span>
                    </div>
                  )}

                  {/* Optional Additional Gallery Photos (0 to 3 extra, total max 4) */}
                  <div className="pt-2 border-t border-[#E6DFD1] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">
                        Fotos adicionales <span className="text-gray-400 font-normal">(Opcional · solo se muestran las que subas, máx. 3 extras)</span>
                      </span>
                      <span className="text-[11px] font-medium text-[#8B6D16]">
                        {(image.trim() ? 1 : 0) + extraImages.length} / 4 fotos
                      </span>
                    </div>

                    {extraImages.length > 0 && (
                      <div className="flex flex-wrap gap-2.5">
                        {extraImages.map((extraUrl, idx) => (
                          <div
                            key={`${extraUrl.slice(0, 32)}-${idx}`}
                            className="relative w-20 bg-white rounded-lg border border-gray-200 p-1 shadow-xs"
                          >
                            <img
                              src={extraUrl}
                              alt={`Foto adicional ${idx + 2}`}
                              className="w-full h-16 rounded object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setExtraImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
                              title="Quitar foto"
                            >
                              ×
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromoteExtraToPrimary(idx)}
                              className="w-full mt-1 text-[9px] text-gray-600 hover:text-[#8B6D16] font-semibold truncate text-center"
                              title="Usar como foto principal"
                            >
                              Hacer principal
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {extraImages.length < MAX_EXTRA_IMAGES && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => extraFileInputRef.current?.click()}
                          className="px-3 py-2 rounded-lg border border-dashed border-[#D4AF37] bg-white hover:bg-[#D4AF37]/10 text-gray-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Agregar foto(s) extra (opcional)</span>
                        </button>

                        <div className="flex-1 flex gap-1.5">
                          <input
                            type="text"
                            value={extraUrlInput}
                            onChange={(e) => setExtraUrlInput(e.target.value)}
                            placeholder="O pega URL de otra foto..."
                            className="flex-1 p-2 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            type="button"
                            onClick={handleAddExtraUrl}
                            className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold"
                          >
                            + URL
                          </button>
                        </div>

                        <input
                          ref={extraFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleExtraFilesUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Manilla trenzada roja con balines dorados"
                    maxLength={160}
                    className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Precio de venta al Detal (COP) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ej: 28000"
                      min="0"
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Precio anterior / tachado (Opcional)
                    </label>
                    <input
                      type="number"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value)}
                      placeholder="Ej: 35000"
                      min="0"
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Wholesale Prices (x6 and x12) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-amber-700" />
                      <span>Precio Mayorista x6 uds (COP c/u)</span>
                    </label>
                    <input
                      type="number"
                      value={wholesalePrice6}
                      onChange={(e) => setWholesalePrice6(e.target.value)}
                      placeholder="Ej: 21000 (Opcional)"
                      min="0"
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Vacío para calcular automático (~25% dto).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 text-amber-700" />
                      <span>Precio Mayorista x12 / Docena (COP c/u)</span>
                    </label>
                    <input
                      type="number"
                      value={wholesalePrice12}
                      onChange={(e) => setWholesalePrice12(e.target.value)}
                      placeholder="Ej: 17500 (Opcional)"
                      min="0"
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Vacío para calcular automático (~38% dto).
                    </span>
                  </div>
                </div>

                {/* Category & Gender & SaleType */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Manillas">Manillas</option>
                      <option value="Collares">Collares</option>
                      <option value="Aretes">Aretes</option>
                      <option value="Anillos">Anillos</option>
                      <option value="Sets">Sets</option>
                      <option value="Tobilleras">Tobilleras</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Género *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="Dama">Dama</option>
                      <option value="Caballero">Caballero</option>
                      <option value="Unisex">Unisex</option>
                      <option value="Niña">Niña</option>
                      <option value="Niño">Niño</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Modalidad de venta *
                    </label>
                    <select
                      value={saleType}
                      onChange={(e) => setSaleType(e.target.value as SaleType)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="ambos">Mayor y Detal</option>
                      <option value="detal">Solo Detal</option>
                      <option value="mayor">Solo Por Mayor</option>
                    </select>
                  </div>
                </div>

                {/* Material, Color & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="Ej: Hilos encerados y balines oro"
                      maxLength={300}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Color(es)
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ej: Rojo y Dorado"
                      maxLength={160}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Stock disponible
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      min="0"
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Promotional Badges & Expiry Control */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70">
                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-700" />
                      <span>Insignia Promocional</span>
                    </label>
                    <select
                      value={promoBadge}
                      onChange={(e) => setPromoBadge(e.target.value as PromoBadge)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="ninguno">Sin insignia especial</option>
                      <option value="mas_vendido">★ Más Vendido</option>
                      <option value="nuevo">✦ Nuevo Lanzamiento</option>
                      <option value="edicion_limitada">👑 Edición Limitada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Vencimiento de la Promoción (Opcional)</span>
                    </label>
                    <input
                      type="date"
                      value={promoUntil}
                      onChange={(e) => setPromoUntil(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      {promoUntil ? `Activa hasta el ${promoUntil}` : 'Permanecerá activa sin fecha límite.'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Descripción del producto
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Describe los detalles artesanales, ajuste y cuidados..."
                    className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 rounded-lg bg-[#D4AF37] hover:bg-[#B8941F] text-black font-semibold text-xs sm:text-sm transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'Publicando en la nube...'
                        : editingId
                          ? 'Guardar Cambios en la Nube'
                          : 'Publicar en la Nube'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-3 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>

            {/* Backup & Restore Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-serif text-lg font-bold text-gray-900">
                  Copia de Seguridad (Archivo) & Descarga Excel
                </h3>
              </div>
              <p className="text-xs text-gray-600">
                Descarga una copia completa de tus productos con fotos o exporta la lista de precios en formato Excel para clientes mayoristas.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleExportJSONBackup}
                  className="px-3.5 py-2 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Descargar Archivo Completo (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    exportProductsToCSV(products);
                    onShowToast('¡Catálogo descargado exitosamente en formato Excel / CSV!');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 hover:border-emerald-600 bg-white text-gray-800 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Descargar Excel / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg border border-[#D4AF37] hover:bg-[#D4AF37]/10 text-gray-900 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Restaurar Copia (.json)</span>
                </button>

                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleBackupRestore}
                  className="hidden"
                />
              </div>
            </div>

            {/* Current Products Inventory Table */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900">
                    Inventario en la Nube ({products.length})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Cada cambio que guardes se refleja al instante en todos los celulares
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                    <input
                      type="text"
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={async () => {
                      if (
                        confirm(
                          '¿Restablecer el catálogo en la nube con las piezas artesanales iniciales?'
                        )
                      ) {
                        setIsSubmitting(true);
                        try {
                          await onResetCatalog();
                          onShowToast('Catálogo restablecido en la nube con éxito');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-gray-300 hover:border-[#D4AF37] text-gray-600 hover:text-black text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Restaurar productos predeterminados"
                  >
                    <RotateCcw className="w-3 h-3 text-[#D4AF37]" />
                    <span className="hidden sm:inline">Restablecer</span>
                  </button>
                </div>
              </div>

              {/* Table / List */}
              <div className="space-y-2">
                {filteredProducts.map((p) => {
                  const promo = getActivePromoBadge(p);
                  const photoCount = getProductGallery(p).length;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                            {photoCount > 1 && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                {photoCount} fotos
                              </span>
                            )}
                            {promo && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${promo.color}`}
                              >
                                {promo.icon} {promo.label}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500">
                            {p.category} · Detal: {formatPrice(p.price)} · x6:{' '}
                            {formatPrice(getWholesalePrice6(p))} · x12:{' '}
                            {formatPrice(getWholesalePrice12(p))} · Stock:{' '}
                            <span
                              className={
                                p.stock <= 3
                                  ? 'text-rose-600 font-bold'
                                  : 'text-emerald-700 font-semibold'
                              }
                            >
                              {p.stock} un.
                            </span>
                            {p.promoUntil && (
                              <span className="text-[10px] text-gray-400 ml-1.5">
                                (Promo vence: {p.promoUntil})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(p)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#D4AF37] hover:text-black text-gray-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              confirm(`¿Eliminar "${p.name}" de la nube? Esta acción no se puede deshacer.`)
                            ) {
                              setIsSubmitting(true);
                              try {
                                await onDeleteProduct(p.id);
                                setHasPendingBackup(true);
                                onShowToast(`Se eliminó "${p.name}"`);
                              } finally {
                                setIsSubmitting(false);
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-600 hover:text-white text-gray-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Client Admin Authorization Section (only visible to bootstrap owner) */}
            {isBootstrapAdmin && (
              <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#D4AF37]/40 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E5DFD5]">
                  <UserCheck className="w-4 h-4 text-[#B8941F]" />
                  <h4 className="font-serif text-base font-bold text-gray-900">
                    Acceso para tu Cliente (Correos Gmail Autorizados)
                  </h4>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Agrega aquí el correo Gmail de tu cliente. Cuando ella toque el candado en su celular y presione <strong>Ingresar con Google</strong> con su propia cuenta, podrá administrar la tienda sin usar tu correo.
                </p>

                <form onSubmit={handleAddAuthorizedAdmin} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Ej: gmaildetucliente@gmail.com"
                    className="flex-1 p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg bg-[#161616] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Autorizar correo</span>
                  </button>
                </form>

                {authorizedAdmins.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {authorizedAdmins.map((admin) => (
                      <div
                        key={admin.emailKey}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs"
                      >
                        <span className="font-medium text-gray-800">{admin.email}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`¿Quitar acceso administrativo a ${admin.email}?`)) {
                              await onRevokeAdminEmail(admin.emailKey);
                              onShowToast(`Acceso revocado para ${admin.email}`);
                            }
                          }}
                          className="text-[11px] text-rose-600 hover:underline font-medium"
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Change Admin PIN Card (visible to unlocked owner & client) */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-serif text-base font-bold text-gray-900">
                  Cambiar PIN de Seguridad
                </h4>
              </div>
              <p className="text-[11px] text-gray-600">
                Actualiza el PIN adicional que se solicita después de iniciar sesión con Google.
              </p>

              <form onSubmit={handleSaveNewPinSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="password"
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Nuevo PIN (mín. 4)"
                  maxLength={16}
                  className="p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <input
                  type="password"
                  value={confirmPinInput}
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="Confirmar nuevo PIN"
                  maxLength={16}
                  className="p-2.5 rounded-lg border border-gray-300 bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button
                  type="submit"
                  disabled={isAuthActionLoading}
                  className="px-4 py-2.5 rounded-lg bg-[#161616] hover:bg-black text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {isAuthActionLoading ? 'Guardando...' : 'Actualizar PIN'}
                </button>
              </form>
              {pinError && (
                <p className="text-xs text-rose-600 font-medium">{pinError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
