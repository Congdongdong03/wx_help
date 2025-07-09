"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@tarojs/components");
const PostContent = ({
  title,
  description,
  category,
  price,
  displayTimeText,
}) => {
  return (0, jsx_runtime_1.jsxs)(components_1.View, {
    className: "pcc-content",
    role: "article",
    children: [
      (0, jsx_runtime_1.jsx)(components_1.Text, {
        className: "pcc-title",
        numberOfLines: 2,
        role: "heading",
        "aria-level": 2,
        children: title,
      }),
      description &&
        (0, jsx_runtime_1.jsxs)(components_1.Text, {
          className: "pcc-description",
          numberOfLines: 2,
          role: "contentinfo",
          children: [description.substring(0, 50), "..."],
        }),
      (0, jsx_runtime_1.jsxs)(components_1.View, {
        className: "pcc-footer",
        children: [
          (0, jsx_runtime_1.jsxs)(components_1.View, {
            className: "pcc-tags",
            role: "list",
            children: [
              (0, jsx_runtime_1.jsx)(components_1.Text, {
                className: "pcc-category-tag",
                style: { backgroundColor: category.color },
                role: "listitem",
                children: category.name,
              }),
              price &&
                (0, jsx_runtime_1.jsx)(components_1.Text, {
                  className: "pcc-price-tag",
                  role: "listitem",
                  children: price,
                }),
            ],
          }),
          (0, jsx_runtime_1.jsx)(components_1.Text, {
            className: "pcc-time",
            role: "contentinfo",
            "aria-label": `Posted ${displayTimeText}`,
            children: displayTimeText,
          }),
        ],
      }),
    ],
  });
};
exports.default = PostContent;
//# sourceMappingURL=PostContent.js.map
