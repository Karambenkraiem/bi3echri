import { SelectHTMLAttributes, forwardRef } from 'react';
import { Supplier } from '@/lib/types';
import { Select } from '@/components/ui/input';

interface SupplierSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  suppliers: Supplier[] | undefined;
}

/**
 * Lists suppliers grouped by type (Souks/marchés, Particuliers) as optgroups. The
 * selected value is the supplier's name (purchaseSource stays a free-text field on
 * Article, not a foreign key), so this stays a plain string dropdown.
 */
export const SupplierSelect = forwardRef<HTMLSelectElement, SupplierSelectProps>(
  ({ suppliers, value, ...props }, ref) => {
    const souks = (suppliers ?? []).filter((s) => s.type === 'SOUK');
    const particuliers = (suppliers ?? []).filter((s) => s.type === 'PARTICULIER');
    const knownNames = new Set((suppliers ?? []).map((s) => s.name));
    const isUnknownValue = typeof value === 'string' && value !== '' && !knownNames.has(value);

    return (
      <Select ref={ref} value={value} {...props}>
        <option value="">Aucun / non renseigné</option>
        {isUnknownValue && (
          <option value={value as string}>{value} (texte existant, hors liste)</option>
        )}
        {souks.length > 0 && (
          <optgroup label="Souks / marchés">
            {souks.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
        {particuliers.length > 0 && (
          <optgroup label="Particuliers">
            {particuliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
    );
  },
);
SupplierSelect.displayName = 'SupplierSelect';
