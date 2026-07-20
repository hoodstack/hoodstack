export { MODULES, MODULE_LIST } from "./modules.js";

export {
  PRODUCTS,
  PRODUCT_LIST,
  PRODUCT_ORDER,
  SURFACE_LABELS,
  getProduct,
  findProduct,
} from "./products.js";

export {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  getModule,
  findModule,
  getModulesByCategory,
  getPublicModules,
  getAllPublicProductRoutes,
  getRelatedModules,
  getProductModules,
  getProductForModule,
  buildAppNavigation,
  isModuleEnabled,
  isModulePreview,
  type NavSection,
} from "./registry.js";

export type {
  HoodStackModuleId,
  HoodStackModuleCategory,
  HoodStackProductId,
  HoodStackIconName,
  ModuleAvailability,
  ModuleDefinition,
  ProductDefinition,
  ProductSurface,
} from "./types.js";
