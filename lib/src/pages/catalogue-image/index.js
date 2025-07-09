"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const taro_1 = require("@tarojs/taro");
const components_1 = require("@tarojs/components");
const env_1 = require("../../utils/env");
require("./index.scss");
const CatalogueImagePage = () => {
    var _a, _b, _c, _d;
    const router = (0, taro_1.useRouter)();
    const { id } = router.params;
    const [images, setImages] = (0, react_1.useState)([]);
    const [currentIndex, setCurrentIndex] = (0, react_1.useState)(0);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        if (id) {
            loadCatalogueImages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    const loadCatalogueImages = async () => {
        var _a;
        try {
            setLoading(true);
            // 解析 catalogue ID，例如 catalogue_coles_0
            const match = id.match(/catalogue_(\w+)_(\d+)/);
            if (!match) {
                taro_1.default.showToast({
                    title: "无效的图片ID",
                    icon: "none",
                });
                return;
            }
            const [, store, index] = match;
            // 获取该商店的所有图片
            const response = await taro_1.default.request({
                url: `${env_1.BASE_URL}/api/catalogue/${store}`,
                method: "GET",
            });
            if (response.statusCode === 200 && response.data.code === 0) {
                const catalogueImages = response.data.data.map((file, idx) => ({
                    id: `catalogue_${store}_${idx}`,
                    url: `/catalogue_images/${store}/${file}`,
                    filename: file,
                    store,
                    title: `${store.toUpperCase()} 打折信息 ${idx + 1}`,
                }));
                setImages(catalogueImages);
                setCurrentIndex(parseInt(index) || 0);
            }
            else {
                // 如果API不存在，使用模拟数据
                const mockImages = generateMockImages(store);
                setImages(mockImages);
                setCurrentIndex(parseInt(index) || 0);
            }
        }
        catch (error) {
            console.error("加载图片失败:", error);
            // 使用模拟数据作为后备
            const store = ((_a = id.match(/catalogue_(\w+)_\d+/)) === null || _a === void 0 ? void 0 : _a[1]) || "coles";
            const mockImages = generateMockImages(store);
            setImages(mockImages);
            setCurrentIndex(0);
        }
        finally {
            setLoading(false);
        }
    };
    const generateMockImages = (store) => {
        // 生成模拟的图片数据
        const imageCount = 20; // 假设每个商店有20张图片
        return Array.from({ length: imageCount }, (_, index) => ({
            id: `catalogue_${store}_${index}`,
            url: `/catalogue_images/${store}/20250704_page${index + 1}.jpg`,
            filename: `20250704_page${index + 1}.jpg`,
            store,
            title: `${store.toUpperCase()} 打折信息 ${index + 1}`,
        }));
    };
    const handleSwiperChange = (e) => {
        const { current } = e.detail;
        setCurrentIndex(current);
    };
    const handleImageClick = (imageUrl) => {
        // 图片预览
        taro_1.default.previewImage({
            current: imageUrl,
            urls: images.map((img) => img.url),
        });
    };
    const handleBack = () => {
        taro_1.default.navigateBack();
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(components_1.View, { className: "catalogue-page loading", children: (0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u52A0\u8F7D\u4E2D..." }) }));
    }
    if (images.length === 0) {
        return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "catalogue-page empty", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { children: "\u6682\u65E0\u56FE\u7247" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "back-btn", onClick: handleBack, children: "\u8FD4\u56DE" })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(components_1.View, { className: "catalogue-page", children: [(0, jsx_runtime_1.jsxs)(components_1.View, { className: "header", children: [(0, jsx_runtime_1.jsx)(components_1.View, { className: "back-button", onClick: handleBack, children: (0, jsx_runtime_1.jsx)(components_1.Text, { className: "back-icon", children: "\u2190" }) }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "title", children: ((_a = images[currentIndex]) === null || _a === void 0 ? void 0 : _a.title) || "宣传图片" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { className: "counter", children: [currentIndex + 1, " / ", images.length] })] }), (0, jsx_runtime_1.jsx)(components_1.View, { className: "swiper-container", children: (0, jsx_runtime_1.jsx)(components_1.Swiper, { className: "swiper", current: currentIndex, onChange: handleSwiperChange, circular: true, indicatorDots: true, indicatorColor: "rgba(255, 255, 255, 0.3)", indicatorActiveColor: "#fff", autoplay: false, children: images.map((image, index) => ((0, jsx_runtime_1.jsx)(components_1.SwiperItem, { className: "swiper-item", children: (0, jsx_runtime_1.jsx)(components_1.View, { className: "image-container", onClick: () => handleImageClick(image.url), children: (0, jsx_runtime_1.jsx)(components_1.Image, { className: "catalogue-image", src: image.url, mode: "aspectFit", lazyLoad: true }) }) }, image.id))) }) }), (0, jsx_runtime_1.jsxs)(components_1.View, { className: "footer", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { className: "store-name", children: (_c = (_b = images[currentIndex]) === null || _b === void 0 ? void 0 : _b.store) === null || _c === void 0 ? void 0 : _c.toUpperCase() }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "image-info", children: (_d = images[currentIndex]) === null || _d === void 0 ? void 0 : _d.filename })] })] }));
};
exports.default = CatalogueImagePage;
//# sourceMappingURL=index.js.map