import React from 'react';
import { Category, Gender, SaleType } from '../types';
import { Sparkles, Layers, SlidersHorizontal } from 'lucide-react';

interface CategoryFilterProps {
  currentCategory: Category;
  onSelectCategory: (cat: Category) => void;
  currentGender: string;
  onSelectGender: (gender: string) => void;
  currentSaleType: string;
  onSelectSaleType: (type: string) => void;
  sortBy: string;
  onSelectSort: (sort: string) => void;
}

const CATEGORIES: { label: Category; icon: string }[] = [
  { label: 'Todos', icon: '✦' },
  { label: 'Manillas', icon: '⚪' },
  { label: 'Pulseras', icon: '💫' },
  { label: 'Anillos', icon: '💍' },
  { label: 'Aretes', icon: '✨' },
  { label: 'Collares', icon: '📿' },
];

const GENDERS: { label: string; value: string }[] = [
  { label: 'Todos los géneros', value: 'all' },
  { label: 'Dama', value: 'Dama' },
  { label: 'Caballero', value: 'Caballero' },
  { label: 'Unisex', value: 'Unisex' },
];

const SALE_TYPES: { label: string; value: string }[] = [
  { label: 'Cualquier modalidad', value: 'all' },
  { label: 'Venta al Detal', value: 'detal' },
  { label: 'Venta al Por Mayor', value: 'mayor' },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  currentCategory,
  onSelectCategory,
  currentGender,
  onSelectGender,
  currentSaleType,
  onSelectSaleType,
  sortBy,
  onSelectSort,
}) => {
  return (
    <div className="space-y-2.5">
      {/* Category Grid / Wrap for all items to fit on screen */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => onSelectCategory(cat.label)}
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-[#D4AF37] text-black shadow-xs font-semibold'
                  : 'bg-[#FAF8F5] border border-[#E5DFD5] text-gray-700 hover:border-[#D4AF37]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary filter & sorting bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE4D9] text-[11px] sm:text-xs">
        {/* Gender and Sale Type Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-gray-500 font-medium">
            <SlidersHorizontal className="w-3 h-3 text-[#D4AF37]" />
            <span className="hidden sm:inline">Filtros:</span>
          </div>

          {/* Gender Select */}
          <select
            value={currentGender}
            onChange={(e) => onSelectGender(e.target.value)}
            className="px-2 py-1 rounded-md border border-[#E2DDD3] bg-white text-gray-700 text-[11px] sm:text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          {/* Sale Type Select */}
          <select
            value={currentSaleType}
            onChange={(e) => onSelectSaleType(e.target.value)}
            className="px-2 py-1 rounded-md border border-[#E2DDD3] bg-white text-gray-700 text-[11px] sm:text-xs focus:outline-none focus:border-[#D4AF37]"
          >
            {SALE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-gray-400 hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => onSelectSort(e.target.value)}
            className="px-2 py-1 rounded-md border border-[#E2DDD3] bg-white text-gray-800 text-[11px] sm:text-xs font-medium focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="offers">En Oferta</option>
          </select>
        </div>
      </div>
    </div>
  );
};
