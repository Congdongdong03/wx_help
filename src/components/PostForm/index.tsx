import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Input,
  Button,
  Picker,
  Textarea,
  Image,
  Canvas,
} from "@tarojs/components";
import BottomActionBar from "@/components/BottomActionBar";
import { BASE_URL } from "@/utils/env";
import { request } from "@/utils/request";
import "./index.scss";

const BASE_API_URL = `${BASE_URL}/api`;

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

interface PostFormData {
  title: string;
  description: string;
  categoryMain: string;
  categorySub: string;
  cityCode: string;
  price?: string;
  [key: string]: any;
}

interface City {
  name: string;
  code: string;
}

interface PostFormProps {
  postId?: string;
}

const PostForm = ({ postId }: PostFormProps) => {
  const router = useRouter();
  const id = postId || router.params?.id;

  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    description: "",
    categoryMain: "",
    categorySub: "",
    cityCode: "",
    price: "",
  });
  const [imageFiles, setImageFiles] = useState<Taro.chooseImage.ImageFile[]>(
    []
  );
  const [cities, setCities] = useState<City[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await request<{
          code: number;
          data: City[];
        }>(`${BASE_API_URL}/home/cities`, {
          method: "GET",
        });
        if (res && res.code === 0 && Array.isArray(res.data)) {
          setCities(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              cityCode: res.data[0].code,
            }));
          }
        }
      } catch (error) {
        Taro.showToast({ title: "获取城市列表失败", icon: "error" });
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (id) {
      request(`${BASE_API_URL}/posts/${id}`, {
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
              const imagesArray =
                typeof post.images === "string"
                  ? JSON.parse(post.images)
                  : post.images;
              setImageFiles(
                Array.isArray(imagesArray)
                  ? imagesArray.map((url: string) => ({ path: url }))
                  : []
              );
            } catch {
              setImageFiles([]);
            }
          } else {
            setImageFiles([]);
          }
        }
      });
    }
  }, [id]);

  useEffect(() => {
    const { title, description, categoryMain, categorySub, cityCode } =
      formData;
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
    if (!formData.title.trim()) missingFields.push("标题");
    if (!formData.description.trim()) missingFields.push("描述");
    if (!formData.categoryMain) missingFields.push("分类");
    if (!formData.categorySub) missingFields.push("类型");
    if (!formData.cityCode) missingFields.push("城市");
    return missingFields;
  };

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMainCategoryChange = (e: any) => {
    const selectedMainCategory = MAIN_CATEGORIES[e.detail.value];
    const subCategories = SUB_CATEGORIES[selectedMainCategory.value];
    setFormData((prev) => ({
      ...prev,
      categoryMain: selectedMainCategory.value,
      categorySub: subCategories[0]?.value || "",
    }));
  };

  const handleSubCategoryChange = (e: any) => {
    const subCategories = SUB_CATEGORIES[formData.categoryMain];
    const selectedSubCategory = subCategories[e.detail.value];
    setFormData((prev) => ({
      ...prev,
      categorySub: selectedSubCategory.value,
    }));
  };

  const handleCityChange = (e: any) => {
    const selectedCity = cities[e.detail.value];
    setFormData((prev) => ({
      ...prev,
      cityCode: selectedCity.code,
    }));
  };

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 6 - imageFiles.length,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        setImageFiles((prev) => [...prev, ...res.tempFiles]);
      },
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const generateImageFromText = async (
    text: string
  ): Promise<{ path: string }> => {
    return new Promise((resolve) => {
      const ctx = Taro.createCanvasContext("title-canvas");
      const canvasWidth = 600;
      const canvasHeight = 300;

      // 设置背景
      ctx.setFillStyle("#ffffff");
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 设置文字样式
      ctx.setFillStyle("#333333");
      ctx.setFontSize(32);
      ctx.setTextBaseline("middle");
      ctx.setTextAlign("center"); // 设置文字水平居中对齐

      // 计算文字位置 - 每8个字符换行
      const maxCharsPerLine = 8; // 每行最多8个字符
      const lines = [];

      // 按8个字符分割文字
      for (let i = 0; i < text.length; i += maxCharsPerLine) {
        const line = text.slice(i, i + maxCharsPerLine);
        lines.push(line);
      }

      // 绘制文字 - 完全居中
      const lineHeight = 40;
      const totalHeight = lines.length * lineHeight;
      const startY = (canvasHeight - totalHeight) / 2;
      const centerX = canvasWidth / 2; // 画布中心X坐标

      lines.forEach((line, index) => {
        const y = startY + index * lineHeight + lineHeight / 2;
        ctx.fillText(line, centerX, y); // 使用centerX实现水平居中
      });

      ctx.draw(false, () => {
        Taro.canvasToTempFilePath({
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
      Taro.showToast({ title: "内容为空", icon: "none" });
      return;
    }
    setIsSavingDraft(true);
    const payload = {
      ...formData,
      status: "draft",
      images: imageFiles.map((file) => file.path),
    };
    try {
      const res = await request(`${BASE_API_URL}/posts`, {
        method: "POST",
        data: payload,
        header: {
          "Content-Type": "application/json",
        },
      });
      if (res && res.code === 0) {
        Taro.showToast({
          title: "草稿已保存",
          icon: "success",
        });
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      Taro.showToast({ title: "草稿保存失败", icon: "error" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!isFormValid) {
      const missingFields = getMissingFields();
      Taro.showToast({
        title: `请填写${missingFields.join("、")}`,
        icon: "none",
        duration: 2000,
      });
      return;
    }
    setIsPublishing(true);
    Taro.showLoading({ title: "发布中...", mask: true });
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.categoryMain ||
        !formData.cityCode
      ) {
        throw new Error("请填写所有必填字段");
      }
      const processedImages = imageFiles.map((file) => {
        if (
          file.path.startsWith("wxfile://") ||
          file.path.startsWith("http://tmp/")
        ) {
          return file.path;
        }
        if (file.path.startsWith("/uploads/")) {
          return `${BASE_URL}${file.path}`;
        }
        return file.path;
      });
      if (processedImages.length === 0 && formData.title) {
        const generatedImage = await generateImageFromText(formData.title);
        const imageUrl = generatedImage.path.startsWith("/uploads/")
          ? `${BASE_URL}${generatedImage.path}`
          : generatedImage.path;
        processedImages.push(imageUrl);
      }
      const selectedCategory = MAIN_CATEGORIES.find(
        (cat) => cat.value === formData.categoryMain
      );
      const selectedCity = cities.find(
        (city) => city.code === formData.cityCode
      );
      if (!selectedCategory || !selectedCity) {
        throw new Error("分类或城市信息无效");
      }
      const finalImages = processedImages.map((img) => {
        if (img.startsWith("/uploads/")) {
          return `${BASE_URL}${img}`;
        }
        return img;
      });
      const payload = {
        ...formData,
        status: "publish",
        images: finalImages,
        createTime: new Date().toISOString(),
        category: formData.categoryMain,
        city: formData.cityCode,
        price: formData.price || undefined,
        boostTime: undefined,
        image_url: finalImages[0] || undefined,
        description: formData.description || "暂无描述",
      };
      const res = await request(`${BASE_API_URL}/posts`, {
        method: "POST",
        data: payload,
        header: {
          "Content-Type": "application/json",
        },
      });
      Taro.hideLoading();
      if (res && res.code === 0) {
        Taro.showToast({
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
          Taro.redirectTo({ url: "/pages/my/my-posts/my-posts" });
        }, 1500);
      } else {
        throw new Error(res?.message || "发布失败");
      }
    } catch (error) {
      Taro.hideLoading();
      let errorMessage = "发布失败，请重试";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "网络超时，请检查网络连接";
        } else if (error.message.includes("network")) {
          errorMessage = "网络错误，请检查网络连接";
        } else {
          errorMessage = error.message;
        }
      }
      Taro.showToast({
        title: errorMessage,
        icon: "error",
        duration: 2000,
      });
    } finally {
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
    const currentSub = subCategories.find(
      (sub) => sub.value === formData.categorySub
    );
    return currentSub?.icon || "";
  };

  if (isLoadingData) {
    return <View className="loading">加载中...</View>;
  }

  return (
    <View className="post-form-container">
      <View className="page-title-form">发布帖子</View>

      {/* 城市选择 */}
      <View className="form-item">
        <Text className="form-label required">所在城市</Text>
        <Picker
          mode="selector"
          range={cities.map((city) => city.name)}
          value={cities.findIndex((city) => city.code === formData.cityCode)}
          onChange={handleCityChange}
        >
          <View className="picker-display">
            {cities.find((city) => city.code === formData.cityCode)?.name ||
              "请选择城市"}
          </View>
        </Picker>
      </View>

      {/* 主分类选择 */}
      <View className="form-item">
        <Text className="form-label required">分类</Text>
        <Picker
          mode="selector"
          range={MAIN_CATEGORIES.map((cat) => cat.label)}
          value={MAIN_CATEGORIES.findIndex(
            (cat) => cat.value === formData.categoryMain
          )}
          onChange={handleMainCategoryChange}
        >
          <View className="picker-display">
            {MAIN_CATEGORIES.find((cat) => cat.value === formData.categoryMain)
              ?.label || "请选择分类"}
          </View>
        </Picker>
      </View>

      {/* 子分类选择 */}
      {formData.categoryMain && (
        <View className="form-item">
          <Text className="form-label required">类型</Text>
          <Picker
            mode="selector"
            range={getCurrentSubCategories().map((sub) => sub.label)}
            value={getCurrentSubCategories().findIndex(
              (sub) => sub.value === formData.categorySub
            )}
            onChange={handleSubCategoryChange}
          >
            <View className="picker-display">
              {getCurrentSubCategories().find(
                (sub) => sub.value === formData.categorySub
              )?.label || "请选择类型"}
            </View>
          </Picker>
        </View>
      )}

      {/* 标题 */}
      <View className="form-item">
        <Text className="form-label required">
          标题{" "}
          {getCurrentCategoryIcon() && (
            <Text className="category-icon">[{getCurrentCategoryIcon()}]</Text>
          )}
        </Text>
        <Input
          className="form-input"
          type="text"
          placeholder="请输入标题"
          value={formData.title}
          onInput={(e) => handleInputChange("title", e.detail.value)}
          maxlength={50}
        />
      </View>

      {/* 价格 (条件显示) */}
      {shouldShowPrice() && (
        <View className="form-item">
          <Text className="form-label">价格 (可选)</Text>
          <Input
            className="form-input"
            type="digit"
            placeholder="请输入价格"
            value={formData.price || ""}
            onInput={(e) => handleInputChange("price", e.detail.value)}
          />
        </View>
      )}

      {/* 描述 */}
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="请详细描述..."
          value={formData.description}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          autoHeight
          maxlength={500}
        />
      </View>

      {/* 图片上传 */}
      <View className="form-item">
        <Text className="form-label">
          上传图片 ({imageFiles.length}/6) (可选)
        </Text>
        <View className="image-uploader">
          {imageFiles.map((file, index) => (
            <View key={file.path} className="image-preview-item">
              <Image
                src={file.path}
                mode="aspectFill"
                className="preview-image"
              />
              <View
                className="remove-image-btn"
                onClick={() => handleRemoveImage(index)}
              >
                ✕
              </View>
            </View>
          ))}
          {imageFiles.length < 6 && (
            <View className="add-image-btn" onClick={handleChooseImage}>
              <Text className="plus-icon">+</Text>
              <Text>添加图片</Text>
            </View>
          )}
        </View>
        {imageFiles.length === 0 && (
          <Text className="help-text">未选择图片时，将自动生成标题图片</Text>
        )}
      </View>

      {/* 底部操作栏 */}
      <BottomActionBar
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        publishText="发布"
        saveDraftText="保存草稿"
        saveDraftLoadingText="保存中..."
        publishLoadingText="发布中..."
      />

      <Canvas
        canvasId="title-canvas"
        style={{
          position: "absolute",
          left: -9999,
          width: "600px",
          height: "300px",
        }}
      />
    </View>
  );
};

export default PostForm;
