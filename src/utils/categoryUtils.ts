import { SUB_CATEGORIES } from "../constants";

export const getSubCategoryIcon = (category: string, subCategory: string) => {
  const subCategories = SUB_CATEGORIES[category as keyof typeof SUB_CATEGORIES];
  if (!subCategories) return subCategory;
  const found = subCategories.find((sub) => sub.value === subCategory);
  return found ? found.icon : subCategory;
};
