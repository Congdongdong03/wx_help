"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const taro_1 = require("@tarojs/taro");
const react_1 = require("react");
const components_1 = require("@tarojs/components");
const BottomActionBar_1 = require("@/components/BottomActionBar");
const env_1 = require("@/utils/env");
const request_1 = require("@/utils/request");
require("./index.scss");
const BASE_API_URL = `${env_1.BASE_URL}/api`;
const MAIN_CATEGORIES = [
    { label: "房源", value: "rent" },
    { label: "闲置", value: "used" },
    { label: "帮帮", value: "help" },
];
const SUB_CATEGORIES = {
    rent: [
        { label: "出租", value: "rent", icon: "租" },
        { label: "求租", value: "wanted_rent", icon: "求租" },
        { label: "出售", value: "sell", icon: "售" },
        { label: "求购", value: "wanted_buy", icon: "求购" },
    ],
    used: [
        { label: "出售", value: "sell", icon: "卖" },
        { label: "求购", value: "wanted", icon: "收" },
    ],
    help: [
        { label: "求助", value: "need_help", icon: "求助" },
        { label: "提供帮助", value: "offer_help", icon: "帮助" },
    ],
};
const PostForm = ({ postId }) => {
    var _a, _b, _c, _d;
    const router = (0, taro_1.useRouter)();
    const id = postId || ((_a = router.params) === null || _a === void 0 ? void 0 : _a.id);
    const [formData, setFormData] = (0, react_1.useState)({
        title: "",
        description: "",
        categoryMain: "",
        categorySub: "",
        cityCode: "",
        price: "",
    });
    const [imageFiles, setImageFiles] = (0, react_1.useState)([]);
    const [cities, setCities] = (0, react_1.useState)([]);
    const [isFormValid, setIsFormValid] = (0, react_1.useState)(false);
    const [isSavingDraft, setIsSavingDraft] = (0, react_1.useState)(false);
    const [isPublishing, setIsPublishing] = (0, react_1.useState)(false);
    const [isLoadingData, setIsLoadingData] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchCities = async () => {
            try {
                const res = await (0, request_1.request)(`${BASE_API_URL}/home/cities`, {
                    method: "GET",
                });
                if (res && res.code === 0 && Array.isArray(res.data)) {
                    setCities(res.data);
                    if (res.data.length > 0) {
                        setFormData((prev) => (Object.assign(Object.assign({}, prev), { cityCode: res.data[0].code })));
                    }
                }
            }
            catch (error) {
                taro_1.default.showToast({ title: "获取城市列表失败", icon: "error" });
            }
            finally {
                setIsLoadingData(false);
            }
        };
        fetchCities();
    }, []);
    (0, react_1.useEffect)(() => {
        if (id) {
            (0, request_1.request)(`${BASE_API_URL}/posts/${id}`, {
                method: "GET",
            }).then((res) => {
                if (res && (res.code === 0 || res.status === 0)) {
                    const post = res.data;
                    setFormData({
                        title: post.title || "",
                        description: post.content || "",
                        categoryMain: post.category || "",
                        categorySub: post.sub_category || "",
                        cityCode: post.city_code || "",
                        price: post.price ? String(post.price) : "",
                    });
                    if (post.images) {
                        try {
                            const imagesArray = typeof post.images === "string"
                                ? JSON.parse(post.images)
                                : post.images;
                            setImageFiles(Array.isArray(imagesArray)
                                ? imagesArray.map((url) => ({ path: url }))
                                : []);
                        }
                        catch (_a) {
                            setImageFiles([]);
                        }
                    }
                    else {
                        setImageFiles([]);
                    }
                }
            });
        }
    }, [id]);
    (0, react_1.useEffect)(() => {
        const { title, description, categoryMain, categorySub, cityCode } = formData;
        const validation = {
            title: title.trim() !== "",
            description: description.trim() !== "",
            categoryMain: categoryMain !== "",
            categorySub: categorySub !== "",
            cityCode: cityCode !== "",
        };
        setIsFormValid(Object.values(validation).every(Boolean));
    }, [formData]);
    const getMissingFields = () => {
        const missingFields = [];
        if (!formData.title.trim())
            missingFields.push("标题");
        if (!formData.description.trim())
            missingFields.push("描述");
        if (!formData.categoryMain)
            missingFields.push("分类");
        if (!formData.categorySub)
            missingFields.push("类型");
        if (!formData.cityCode)
            missingFields.push("城市");
        return missingFields;
    };
    const handleInputChange = (field, value) => {
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { [field]: value })));
    };
    const handleMainCategoryChange = (e) => {
        const selectedMainCategory = MAIN_CATEGORIES[e.detail.value];
        const subCategories = SUB_CATEGORIES[selectedMainCategory.value];
        setFormData((prev) => {
            var _a;
            return (Object.assign(Object.assign({}, prev), { categoryMain: selectedMainCategory.value, categorySub: ((_a = subCategories[0]) === null || _a === void 0 ? void 0 : _a.value) || "" }));
        });
    };
    const handleSubCategoryChange = (e) => {
        const subCategories = SUB_CATEGORIES[formData.categoryMain];
        const selectedSubCategory = subCategories[e.detail.value];
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { categorySub: selectedSubCategory.value })));
    };
    const handleCityChange = (e) => {
        const selectedCity = cities[e.detail.value];
        setFormData((prev) => (Object.assign(Object.assign({}, prev), { cityCode: selectedCity.code })));
    };
    const handleChooseImage = () => {
        taro_1.default.chooseImage({
            count: 6 - imageFiles.length,
            sizeType: ["compressed"],
            sourceType: ["album", "camera"],
            success: (res) => {
                setImageFiles((prev) => [...prev, ...res.tempFiles]);
            },
        });
    };
    const handleRemoveImage = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
    };
    const generateImageFromText = async (text) => {
        return new Promise((resolve) => {
            const ctx = taro_1.default.createCanvasContext("title-canvas");
            const canvasWidth = 600;
            const canvasHeight = 300;
            // 设置背景
            ctx.setFillStyle("#ffffff");
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            // 设置文字样式
            ctx.setFillStyle("#333333");
            ctx.setFontSize(32);
            ctx.setTextBaseline("middle");
            // 计算文字位置
            const maxWidth = canvasWidth - 80;
            const lines = [];
            let currentLine = "";
            const words = text.split("");
            for (let i = 0; i < words.length; i++) {
                const testLine = currentLine + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine !== "") {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
                else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }
            // 绘制文字
            const lineHeight = 40;
            const totalHeight = lines.length * lineHeight;
            const startY = (canvasHeight - totalHeight) / 2;
            lines.forEach((line, index) => {
                const y = startY + index * lineHeight + lineHeight / 2;
                ctx.fillText(line, 40, y);
            });
            ctx.draw(false, () => {
                taro_1.default.canvasToTempFilePath({
                    canvasId: "title-canvas",
                    success: (res) => {
                        resolve({ path: res.tempFilePath });
                    },
                    fail: () => {
                        resolve({ path: "" });
                    },
                });
            });
        });
    };
    const handleSaveDraft = async () => {
        if (!formData.title && !formData.description && imageFiles.length === 0) {
            taro_1.default.showToast({ title: "内容为空", icon: "none" });
            return;
        }
        setIsSavingDraft(true);
        const payload = Object.assign(Object.assign({}, formData), { status: "draft", images: imageFiles.map((file) => file.path) });
        try {
            const res = await (0, request_1.request)(`${BASE_API_URL}/posts`, {
                method: "POST",
                data: payload,
                header: {
                    "Content-Type": "application/json",
                },
            });
            if (res && res.code === 0) {
                taro_1.default.showToast({
                    title: "草稿已保存",
                    icon: "success",
                });
            }
            else {
                throw new Error("保存失败");
            }
        }
        catch (error) {
            taro_1.default.showToast({ title: "草稿保存失败", icon: "error" });
        }
        finally {
            setIsSavingDraft(false);
        }
    };
    const handlePublish = async () => {
        if (!isFormValid) {
            const missingFields = getMissingFields();
            taro_1.default.showToast({
                title: `请填写${missingFields.join("、")}`,
                icon: "none",
                duration: 2000,
            });
            return;
        }
        setIsPublishing(true);
        taro_1.default.showLoading({ title: "发布中...", mask: true });
        try {
            if (!formData.title ||
                !formData.description ||
                !formData.categoryMain ||
                !formData.cityCode) {
                throw new Error("请填写所有必填字段");
            }
            const processedImages = imageFiles.map((file) => {
                if (file.path.startsWith("wxfile://") ||
                    file.path.startsWith("http://tmp/")) {
                    return file.path;
                }
                if (file.path.startsWith("/uploads/")) {
                    return `${env_1.BASE_URL}${file.path}`;
                }
                return file.path;
            });
            if (processedImages.length === 0 && formData.title) {
                const generatedImage = await generateImageFromText(formData.title);
                const imageUrl = generatedImage.path.startsWith("/uploads/")
                    ? `${env_1.BASE_URL}${generatedImage.path}`
                    : generatedImage.path;
                processedImages.push(imageUrl);
            }
            const selectedCategory = MAIN_CATEGORIES.find((cat) => cat.value === formData.categoryMain);
            const selectedCity = cities.find((city) => city.code === formData.cityCode);
            if (!selectedCategory || !selectedCity) {
                throw new Error("分类或城市信息无效");
            }
            const finalImages = processedImages.map((img) => {
                if (img.startsWith("/uploads/")) {
                    return `${env_1.BASE_URL}${img}`;
                }
                return img;
            });
            const payload = Object.assign(Object.assign({}, formData), { status: "publish", images: finalImages, createTime: new Date().toISOString(), category: formData.categoryMain, city: formData.cityCode, price: formData.price || undefined, boostTime: undefined, image_url: finalImages[0] || undefined, description: formData.description || "暂无描述" });
            const res = await (0, request_1.request)(`${BASE_API_URL}/posts`, {
                method: "POST",
                data: payload,
                header: {
                    "Content-Type": "application/json",
                },
            });
            taro_1.default.hideLoading();
            if (res && res.code === 0) {
                taro_1.default.showToast({
                    title: "发布成功，等待审核",
                    icon: "success",
                    duration: 1500,
                });
                setFormData({
                    title: "",
                    description: "",
                    categoryMain: "",
                    categorySub: "",
                    cityCode: "",
                    price: "",
                });
                setImageFiles([]);
                setTimeout(() => {
                    taro_1.default.redirectTo({ url: "/pages/my/my-posts/my-posts" });
                }, 1500);
            }
            else {
                throw new Error((res === null || res === void 0 ? void 0 : res.message) || "发布失败");
            }
        }
        catch (error) {
            taro_1.default.hideLoading();
            let errorMessage = "发布失败，请重试";
            if (error instanceof Error) {
                if (error.message.includes("timeout")) {
                    errorMessage = "网络超时，请检查网络连接";
                }
                else if (error.message.includes("network")) {
                    errorMessage = "网络错误，请检查网络连接";
                }
                else {
                    errorMessage = error.message;
                }
            }
            taro_1.default.showToast({
                title: errorMessage,
                icon: "error",
                duration: 2000,
            });
        }
        finally {
            setIsPublishing(false);
        }
    };
    const getCurrentSubCategories = () => {
        return formData.categoryMain
            ? SUB_CATEGORIES[formData.categoryMain] || []
            : [];
    };
    const shouldShowPrice = () => {
        return formData.categoryMain === "rent" || formData.categoryMain === "used";
    };
    const getCurrentCategoryIcon = () => {
        const subCategories = getCurrentSubCategories();
        const currentSub = subCategories.find((sub) => sub.value === formData.categorySub);
        return (currentSub === null || currentSub === void 0 ? void 0 : currentSub.icon) || "";
    };
    if (isLoadingData) {
        return (0, jsx_runtime_1.jsx)(components_1.View, { className: "loading", children: "\u52A0\u8F7D\u4E2D..." });
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "post-form-container", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "page-title-form", children: "\u53D1\u5E03\u5E16\u5B50" }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "form-label required", children: "\u6240\u5728\u57CE\u5E02" }), (0, jsx_runtime_1.jsx)(components_1.Picker, { mode: "selector", range: cities.map((city) => city.name), value: cities.findIndex((city) => city.code === formData.cityCode), onChange: handleCityChange, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "picker-display", children: ((_b = cities.find((city) => city.code === formData.cityCode)) === null || _b === void 0 ? void 0 : _b.name) ||
                                "请选择城市" }) })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "form-label required", children: "\u5206\u7C7B" }), (0, jsx_runtime_1.jsx)(components_1.Picker, { mode: "selector", range: MAIN_CATEGORIES.map((cat) => cat.label), value: MAIN_CATEGORIES.findIndex((cat) => cat.value === formData.categoryMain), onChange: handleMainCategoryChange, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "picker-display", children: ((_c = MAIN_CATEGORIES.find((cat) => cat.value === formData.categoryMain)) === null || _c === void 0 ? void 0 : _c.label) || "请选择分类" }) })] }), formData.categoryMain && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "form-label required", children: "\u7C7B\u578B" }), (0, jsx_runtime_1.jsx)(components_1.Picker, { mode: "selector", range: getCurrentSubCategories().map((sub) => sub.label), value: getCurrentSubCategories().findIndex((sub) => sub.value === formData.categorySub), onChange: handleSubCategoryChange, children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "picker-display", children: ((_d = getCurrentSubCategories().find((sub) => sub.value === formData.categorySub)) === null || _d === void 0 ? void 0 : _d.label) || "请选择类型" }) })] })), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { className: "form-label required", children: ["\u6807\u9898", " ", getCurrentCategoryIcon() && ((0, jsx_runtime_1.jsxs)(components_1.Text, { className: "category-icon", children: ["[", getCurrentCategoryIcon(), "]"] }))] }), (0, jsx_runtime_1.jsx)(components_1.Input, { className: "form-input", type: "text", placeholder: "\u8BF7\u8F93\u5165\u6807\u9898", value: formData.title, onInput: (e) => handleInputChange("title", e.detail.value), maxlength: 50 })] }), shouldShowPrice() && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "form-label", children: "\u4EF7\u683C (\u53EF\u9009)" }), (0, jsx_runtime_1.jsx)(components_1.Input, { className: "form-input", type: "digit", placeholder: "\u8BF7\u8F93\u5165\u4EF7\u683C", value: formData.price || "", onInput: (e) => handleInputChange("price", e.detail.value) })] })), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "form-label required", children: "\u63CF\u8FF0" }), (0, jsx_runtime_1.jsx)(components_1.Textarea, { className: "form-textarea", placeholder: "\u8BF7\u8BE6\u7EC6\u63CF\u8FF0...", value: formData.description, onInput: (e) => handleInputChange("description", e.detail.value), autoHeight: true, maxlength: 500 })] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "form-item", children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { className: "form-label", children: ["\u4E0A\u4F20\u56FE\u7247 (", imageFiles.length, "/6) (\u53EF\u9009)"] }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "image-uploader", children: [imageFiles.map((file, index) => ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "image-preview-item", children: [(0, jsx_runtime_1.jsx)(components_1.Image, { src: file.path, mode: "aspectFill", className: "preview-image" }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "remove-image-btn", onClick: () => handleRemoveImage(index), children: "\u2715" })] }, file.path))), imageFiles.length < 6 && ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "add-image-btn", onClick: handleChooseImage, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "plus-icon", children: "+" }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6DFB\u52A0\u56FE\u7247" })] }))] }), imageFiles.length === 0 && ((0, jsx_runtime_1.jsx)(components_1.Text, { className: "help-text", children: "\u672A\u9009\u62E9\u56FE\u7247\u65F6\uFF0C\u5C06\u81EA\u52A8\u751F\u6210\u6807\u9898\u56FE\u7247" }))] }), (0, jsx_runtime_1.jsx)(BottomActionBar_1.default, { onSaveDraft: handleSaveDraft, onPublish: handlePublish, isSavingDraft: isSavingDraft, isPublishing: isPublishing, publishText: "\u53D1\u5E03", saveDraftText: "\u4FDD\u5B58\u8349\u7A3F", saveDraftLoadingText: "\u4FDD\u5B58\u4E2D...", publishLoadingText: "\u53D1\u5E03\u4E2D..." }), (0, jsx_runtime_1.jsx)(components_1.Canvas, { canvasId: "title-canvas", style: {
                    position: "absolute",
                    left: -9999,
                    width: "600px",
                    height: "300px",
                } })] }));
};
exports.default = PostForm;
//# sourceMappingURL=index.js.map