/**
 * Re-exports layer-manager category constants from the shared types module
 * so existing `@/constants/objectCategories` imports keep working.
 */
export {
  OBJECT_CATEGORIES,
  OBJECT_CATEGORY_INFO,
  deriveObjectCategory,
  getObjectCategoryCss,
  isObjectCategoryVisible,
  type ObjectCategory,
} from '@/types/objectCategories';
