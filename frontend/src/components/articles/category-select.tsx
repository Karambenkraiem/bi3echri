import { SelectHTMLAttributes, forwardRef } from 'react';
import { Category } from '@/lib/types';
import { Select } from '@/components/ui/input';

interface CategorySelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  categories: Category[] | undefined;
  placeholder?: string;
  placeholderDisabled?: boolean;
}

/**
 * Renders top-level categories with children as optgroups (e.g. "Informatique" grouping
 * "PC"/"Pièces"/"Accessoires"), and top-level categories without children as plain
 * selectable options (e.g. "Petit électroménager"). Parent categories with children are
 * not directly selectable — only their children are.
 */
export const CategorySelect = forwardRef<HTMLSelectElement, CategorySelectProps>(
  ({ categories, placeholder = 'Choisir...', placeholderDisabled = true, ...props }, ref) => {
    const topLevel = (categories ?? []).filter((c) => !c.parentId);

    return (
      <Select ref={ref} {...props}>
        <option value="" disabled={placeholderDisabled}>
          {placeholder}
        </option>
        {topLevel.map((category) =>
          category.children && category.children.length > 0 ? (
            <optgroup key={category.id} label={category.name}>
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
