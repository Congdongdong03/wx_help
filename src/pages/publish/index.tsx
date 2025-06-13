import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react";
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
import WechatIdInput from "@/components/WechatIdInput";
import { BASE_URL } from "@/utils/env";
import "./index.scss";
const BASE_API_URL = `${BASE_URL}/api`;

// 分类配置
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
  contactInfo: string;
  categoryMain: string;
  categorySub: string;
  cityCode: string;
  price?: string; // 可选价格字段
  [key: string]: any;
}

interface City {
  name: string;
  code: string;
}

export default function NewPostForm() {
  const router = useRouter();

  // 基础状态
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    description: "",
    contactInfo: "",
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

  // 获取城市列表
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await Taro.request<{
          code: number;
          data: City[];
        }>({
          url: `${BASE_API_URL}/home/cities`,
          method: "GET",
        });

        if (res.data && res.data.code === 0 && Array.isArray(res.data.data)) {
          setCities(res.data.data);
          // 设置默认城市
          if (res.data.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              cityCode: res.data.data[0].code,
            }));
          }
        }
      } catch (error) {
        console.error("获取城市列表失败:", error);
        Taro.showToast({ title: "获取城市列表失败", icon: "error" });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchCities();
  }, []);

  // 表单验证
  useEffect(() => {
    const {
      title,
      description,
      contactInfo,
      categoryMain,
      categorySub,
      cityCode,
    } = formData;

    const validation = {
      title: title.trim() !== "",
      description: description.trim() !== "",
      contactInfo: contactInfo.trim() !== "",
      categoryMain: categoryMain !== "",
      categorySub: categorySub !== "",
      cityCode: cityCode !== "",
    };

    console.log("表单验证:", validation);

    const isValid = Object.values(validation).every(Boolean);
    setIsFormValid(isValid);
  }, [formData]);

  // 获取缺失的字段
  const getMissingFields = () => {
    const missingFields = [];
    if (!formData.title.trim()) missingFields.push("标题");
    if (!formData.description.trim()) missingFields.push("描述");
    if (!formData.contactInfo.trim()) missingFields.push("联系方式");
    if (!formData.categoryMain) missingFields.push("分类");
    if (!formData.categorySub) missingFields.push("类型");
    if (!formData.cityCode) missingFields.push("城市");
    return missingFields;
  };

  // 处理表单字段变化
  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 处理主分类变化
  const handleMainCategoryChange = (e: any) => {
    const selectedMainCategory = MAIN_CATEGORIES[e.detail.value];
    const subCategories = SUB_CATEGORIES[selectedMainCategory.value];

    setFormData((prev) => ({
      ...prev,
      categoryMain: selectedMainCategory.value,
      categorySub: subCategories[0]?.value || "", // 自动选择第一个子分类
    }));
  };

  // 处理子分类变化
  const handleSubCategoryChange = (e: any) => {
    const subCategories = SUB_CATEGORIES[formData.categoryMain];
    const selectedSubCategory = subCategories[e.detail.value];

    setFormData((prev) => ({
      ...prev,
      categorySub: selectedSubCategory.value,
    }));
  };

  // 处理城市变化
  const handleCityChange = (e: any) => {
    const selectedCity = cities[e.detail.value];
    setFormData((prev) => ({
      ...prev,
      cityCode: selectedCity.code,
    }));
  };

  // 图片相关处理
  const handleChooseImage = () => {
    const count = 6 - imageFiles.length;
    if (count <= 0) {
      Taro.showToast({ title: "最多只能上传6张图", icon: "none" });
      return;
    }

    Taro.chooseImage({
      count: count,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        setImageFiles((prev) => [...prev, ...res.tempFiles]);
      },
    });
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 生成带标题的图片并上传到后端，返回图片URL
  const generateImageFromText = async (
    text: string
  ): Promise<{ path: string }> => {
    const canvasId = "title-canvas";
    const width = 600;
    const height = 300;

    // 1. 绘制文字到 Canvas
    const ctx = Taro.createCanvasContext(canvasId);
    ctx.setFillStyle("#fff");
    ctx.fillRect(0, 0, width, height);
    ctx.setFillStyle("#222");
    ctx.setFontSize(40);
    ctx.setTextAlign && ctx.setTextAlign("center");
    ctx.setTextBaseline && ctx.setTextBaseline("middle");
    ctx.fillText(text, width / 2, height / 2);
    ctx.draw();

    // 2. 导出图片
    const tempFilePath: string = await new Promise((resolve, reject) => {
      setTimeout(() => {
        Taro.canvasToTempFilePath({
          canvasId,
          width,
          height,
          success: (res) => resolve(res.tempFilePath),
          fail: (err) => reject(err),
        });
      }, 300);
    });

    // 3. 上传图片到后端
    try {
      const uploadRes = await Taro.uploadFile({
        url: `${BASE_API_URL}/posts/upload`,
        filePath: tempFilePath,
        name: "file",
        header: {
          "x-openid":
            process.env.NODE_ENV === "development"
              ? "dev_openid_123"
              : Taro.getStorageSync("openid") || "",
        },
      });

      let url = "";
      try {
        const data = JSON.parse(uploadRes.data);
        url = data.data.url;
        // 确保URL是完整的
        if (url.startsWith("/uploads/")) {
          url = `${BASE_URL}${url}`;
        }
      } catch (e) {
        console.error("图片上传返回内容不是JSON：", uploadRes.data);
        Taro.showToast({ title: "图片上传失败", icon: "none" });
        throw new Error("图片上传失败，服务器未返回图片地址");
      }

      if (!url) {
        Taro.showToast({ title: "图片上传失败", icon: "none" });
        throw new Error("图片上传失败，未获取到图片URL");
      }

      return { path: url };
    } catch (error) {
      console.error("上传图片失败:", error);
      throw error;
    }
  };

  // 保存草稿
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
      const res = await Taro.request({
        url: `${BASE_API_URL}/posts`,
        method: "POST",
        data: payload,
        header: {
          "Content-Type": "application/json",
        },
      });

      if (res.statusCode === 201) {
        Taro.showToast({
          title: "草稿已保存",
          icon: "success",
        });
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      console.error("保存草稿失败:", error);
      Taro.showToast({ title: "草稿保存失败", icon: "error" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // 发布帖子
  const handlePublish = async () => {
    console.log("开始发布，表单数据:", formData);
    console.log("表单验证状态:", isFormValid);

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
      // 验证必填字段
      if (
        !formData.title ||
        !formData.description ||
        !formData.contactInfo ||
        !formData.categoryMain ||
        !formData.cityCode
      ) {
        throw new Error("请填写所有必填字段");
      }

      // 处理图片URL
      const processedImages = imageFiles.map((file) => {
        // 如果是本地临时文件，直接使用
        if (
          file.path.startsWith("wxfile://") ||
          file.path.startsWith("http://tmp/")
        ) {
          return file.path;
        }
        // 如果是服务器返回的URL，确保使用完整的URL
        if (file.path.startsWith("/uploads/")) {
          return `${BASE_URL}${file.path}`;
        }
        return file.path;
      });

      console.log("处理图片:", processedImages);

      // 如果没有上传图片，生成标题图片
      if (processedImages.length === 0 && formData.title) {
        console.log("生成标题图片");
        const generatedImage = await generateImageFromText(formData.title);
        // 确保生成的图片URL也是完整的
        const imageUrl = generatedImage.path.startsWith("/uploads/")
          ? `${BASE_URL}${generatedImage.path}`
          : generatedImage.path;
        processedImages.push(imageUrl);
      }

      // 获取分类信息
      const selectedCategory = MAIN_CATEGORIES.find(
        (cat) => cat.value === formData.categoryMain
      );
      const selectedCity = cities.find(
        (city) => city.code === formData.cityCode
      );

      if (!selectedCategory || !selectedCity) {
        throw new Error("分类或城市信息无效");
      }

      // 确保所有图片URL都是完整的
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
        wechatId: formData.contactInfo,
        category: formData.categoryMain,
        city: formData.cityCode,
        price: formData.price || undefined,
        boostTime: undefined,
        image_url: finalImages[0] || undefined,
        description: formData.description || "暂无描述",
      };

      console.log("发送请求数据:", payload);
      console.log("请求URL:", `${BASE_API_URL}/posts`);

      const res = await Taro.request({
        url: `${BASE_API_URL}/posts`,
        method: "POST",
        data: payload,
        header: {
          "Content-Type": "application/json",
        },
      });

      console.log("请求响应:", res);

      Taro.hideLoading();

      if (res.statusCode === 201) {
        Taro.showToast({
          title: "发布成功，等待审核",
          icon: "success",
          duration: 1500,
        });

        // 清空表单
        setFormData({
          title: "",
          description: "",
          contactInfo: "",
          categoryMain: "",
          categorySub: "",
          cityCode: "",
          price: "",
        });
        setImageFiles([]);

        // 跳转到"我的发布"页面
        setTimeout(() => {
          Taro.redirectTo({ url: "/pages/my/my-posts/my-posts" });
        }, 1500);
      } else {
        console.error("发布失败，状态码:", res.statusCode);
        console.error("错误信息:", res.data);
        throw new Error(res.data?.message || "发布失败");
      }
    } catch (error) {
      Taro.hideLoading();
      console.error("发布失败:", error);

      // 显示更详细的错误信息
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

  // 获取当前选中的子分类选项
  const getCurrentSubCategories = () => {
    return formData.categoryMain
      ? SUB_CATEGORIES[formData.categoryMain] || []
      : [];
  };

  // 是否显示价格字段
  const shouldShowPrice = () => {
    return formData.categoryMain === "rent" || formData.categoryMain === "used";
  };

  // 获取当前选中分类的图标
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
    <View className="post-form-page">
      <Text className="page-title">发布信息</Text>

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

      {/* 联系方式 */}
      <View className="form-item">
        <Text className="form-label required">联系方式</Text>
        <WechatIdInput
          value={formData.contactInfo}
          onInput={(value) => handleInputChange("contactInfo", value)}
          placeholder="填写微信号或其他联系方式"
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
}
