"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubCategoryIcon = void 0;
const constants_1 = require("../constants");
const getSubCategoryIcon = (category, subCategory) => {
    const subCategories = constants_1.SUB_CATEGORIES[category];
    if (!subCategories)
        return subCategory;
    const found = subCategories.find((sub) => sub.value === subCategory);
    return found ? found.icon : subCategory;
};
exports.getSubCategoryIcon = getSubCategoryIcon;
//# sourceMappingURL=categoryUtils.js.map