import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import { BASE_URL } from "../../utils/env";
import "./index.scss";

interface CatalogueImage {
  id: string;
  url: string;
  filename: string;
  store: string;
  title: string;
}

const CatalogueImagePage = () => {
  const router = useRouter();
  const { id } = router.params;
  const [images, setImages] = useState<CatalogueImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCatalogueImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadCatalogueImages = async () => {
    try {
      setLoading(true);
      // 解析 catalogue ID，例如 catalogue_coles_0
      const match = id.match(/catalogue_(\w+)_(\d+)/);
      if (!match) {
        Taro.showToast({
          title: "无效的图片ID",
          icon: "none",
        });
        return;
      }
      const [, store, index] = match;

      // 获取该商店的所有图片
      const response = await Taro.request({
        url: `${BASE_URL}/api/catalogue/${store}`,
        method: "GET",
      });

      if (response.statusCode === 200 && response.data.code === 0) {
        const catalogueImages = response.data.data.map(
          (file: string, idx: number) => ({
            id: `catalogue_${store}_${idx}`,
            url: `/catalogue_images/${store}/${file}`,
            filename: file,
            store,
            title: `${store.toUpperCase()} 打折信息 ${idx + 1}`,
          })
        );
        setImages(catalogueImages);
        setCurrentIndex(parseInt(index) || 0);
      } else {
        // 如果API不存在，使用模拟数据
        const mockImages = generateMockImages(store);
        setImages(mockImages);
        setCurrentIndex(parseInt(index) || 0);
      }
    } catch (error) {
      console.error("加载图片失败:", error);
      // 使用模拟数据作为后备
      const store = id.match(/catalogue_(\w+)_\d+/)?.[1] || "coles";
      const mockImages = generateMockImages(store);
      setImages(mockImages);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const generateMockImages = (store: string): CatalogueImage[] => {
    // 生成模拟的图片数据 - 减少到10张
    const imageCount = 10;
    return Array.from({ length: imageCount }, (_, index) => ({
      id: `catalogue_${store}_${index}`,
      url: `/catalogue_images/${store}/20250704_page${index + 1}.jpg`,
      filename: `20250704_page${index + 1}.jpg`,
      store,
      title: `${store.toUpperCase()} 打折信息 ${index + 1}`,
    }));
  };

  const handleSwiperChange = (e: any) => {
    const { current } = e.detail;
    setCurrentIndex(current);
  };

  const handleImageClick = (imageUrl: string) => {
    // 图片预览
    Taro.previewImage({
      current: imageUrl,
      urls: images.map((img) => img.url),
    });
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  if (loading) {
    return (
      <View className="catalogue-page loading">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View className="catalogue-page empty">
        <Text>暂无图片</Text>
        <Text className="back-btn" onClick={handleBack}>
          返回
        </Text>
      </View>
    );
  }

  return (
    <View className="catalogue-page">
      {/* 顶部导航栏 */}
      <View className="header">
        <View className="back-button" onClick={handleBack}>
          <Text className="back-icon">←</Text>
        </View>
        <Text className="title">
          {images[currentIndex]?.title || "宣传图片"}
        </Text>
        <Text className="counter">
          {currentIndex + 1} / {images.length}
        </Text>
      </View>

      {/* 轮播图 */}
      <View className="swiper-container">
        <Swiper
          className="swiper"
          current={currentIndex}
          onChange={handleSwiperChange}
          circular={true}
          indicatorDots={true}
          indicatorColor="rgba(255, 255, 255, 0.3)"
          indicatorActiveColor="#fff"
          autoplay={false}
        >
          {images.map((image, index) => (
            <SwiperItem key={image.id} className="swiper-item">
              <View
                className="image-container"
                onClick={() => handleImageClick(image.url)}
              >
                <Image
                  className="catalogue-image"
                  src={image.url}
                  mode="aspectFit"
                  lazyLoad={true}
                />
              </View>
            </SwiperItem>
          ))}
        </Swiper>
      </View>

      {/* 底部信息 */}
      <View className="footer">
        <Text className="store-name">
          {images[currentIndex]?.store?.toUpperCase()}
        </Text>
        <Text className="image-info">{images[currentIndex]?.filename}</Text>
      </View>
    </View>
  );
};

export default CatalogueImagePage;
