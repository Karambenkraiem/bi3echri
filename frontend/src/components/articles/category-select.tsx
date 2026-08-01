import { SelectHTMLAttributes, forwardRef } from 'react';
import { Category } from '@/lib/types';
import { Select } from '@/components/ui/input';

interface CategorySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  categories: Category[] | undefined;
  placeholder?: string;
  placeholderDisabled?: boolean;
  /**
   * Quand true (contexte filtre), la catégorie mère devient elle-même
   * sélectionnable — pour filtrer sur elle et toutes ses sous-catégories.
   * Par défaut false : un article ne peut être rattaché qu'à une catégorie
   * sans enfants (feuille), donc le formulaire d'article garde le
   * comportement d'origine (mère non sélectionnable, juste un regroupement).
   */
  includeParents?: boolean;
}

/**
 * Renders top-level categories with children as optgroups (e.g. "Informatique" grouping
 * "PC"/"Pièces"/"Accessoires"), and top-level categories without children as plain
 * selectable options (e.g. "Petit électroménager"). Parent categories with children are
 * not directly selectable — only their children are.
 */
export const CategorySelect = forwardRef<HTMLSelectElement, CategorySelectProps>(
  ({ categories, placeholder = 'Choisir...', placeholderDisabled = true, includeParents = false, ...props }, ref) => {
    const topLevel = (categories ?? []).filter((c) => !c.parentId);

    return (
      <Select ref={ref} {...props}>
        <option value="" disabled={placeholderDisabled}>
          {placeholder}
        </option>
        {topLevel.map((category) =>
          category.children && category.children.length > 0 ? (
            <optgroup key={category.id} label={category.name}>
              {includeParents && (
                <option value={category.id}>{category.name} (tout)</option>
              )}
              {category.children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ),
        )}
      </Select>
    );
  },
);
CategorySelect.displayName = 'CategorySelect';
