import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  Input,
  Button,
  Picker,
  Switch,
  Textarea,
  Image,
} from "@tarojs/components";
import "./index.scss";

// Define types for form data
interface RentFormData {
  title: string;
  roomType: string; //主卧、次卧、整租、床位
  rentAmount: string;
  rentPeriod: string; // $/周, $/月
  address: string;
  includesBills: boolean;
  wechatId: string;
  description: string;
  // images are handled by imageFiles state
}

interface UsedGoodFormData {
  title: string;
  itemCategory: string; // e.g., 家具, 电器, 书籍
  price: string;
  condition: string; // e.g., 全新, 九成新, 八成新
  description: string;
  wechatId: string;
}

interface JobFormData {
  title: string;
  position: string; // e.g., 服务员, 收银员, 店员
  salaryRange: string; // e.g., 面议, $20-25/hr, $40-50k/年
  timeRequirement: string; // e.g., Full-time, Part-time, Casual
  description: string;
  wechatId: string;
}

// Union type for all possible form data structures
type PostFormData = Partial<RentFormData & UsedGoodFormData & JobFormData>;

const ROOM_TYPES = ["主卧", "次卧", "整租", "床位"];
const RENT_PERIODS = ["$/周"];
const ITEM_CATEGORIES = [
  "电子产品",
  "家具家居",
  "服饰箱包",
  "书籍教材",
  "美妆护肤",
  "其他",
];
const ITEM_CONDITIONS = [
  "全新",
  "几乎全新",
  "九成新",
  "八成新",
  "七成新及以下",
];
const JOB_POSITIONS = [
  "服务员",
  "收银员",
  "后厨帮工",
  "清洁工",
  "店员/销售",
  "司机/配送",
  "其他",
];
const SALARY_RANGES = [
  "面议",
  "$20-25/小时",
  "$25-30/小时",
  "$30+/小时",
  "$30-40k/年",
  "$40-50k/年",
  "$50k+/年",
];
const TIME_REQUIREMENTS = [
  "全职 (Full-time)",
  "兼职 (Part-time)",
  "临时/短工 (Casual)",
];

export default function PostFormPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("填写发布内容");

  const [formData, setFormData] = useState<PostFormData>({}); // Initial empty or with common defaults

  const [imageFiles, setImageFiles] = useState<Taro.chooseImage.ImageFile[]>(
    []
  );
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const cat = router.params.category;
    if (cat) {
      setCategory(cat);
      if (cat === "rent") {
        setPageTitle("发布租房信息");
        // Set initial form data for rent, including includesBills: true
        setFormData({
          roomType: ROOM_TYPES[0],
          rentPeriod: RENT_PERIODS[0],
          includesBills: true, // Default to true for rent
          title: "",
          rentAmount: "",
          address: "",
          wechatId: "",
          description: "",
        });
      } else if (cat === "used") {
        setPageTitle("发布二手信息");
        // Initialize formData for used goods (ensure common fields or specific defaults are set)
        setFormData({
          itemCategory: ITEM_CATEGORIES[0],
          condition: ITEM_CONDITIONS[0],
          title: "",
          price: "",
          wechatId: "",
          description: "",
        });
      } else if (cat === "jobs") {
        setPageTitle("发布招聘信息");
        // Initialize formData for jobs
        setFormData({
          position: JOB_POSITIONS[0],
          salaryRange: SALARY_RANGES[0],
          timeRequirement: TIME_REQUIREMENTS[0],
          title: "",
          wechatId: "",
          description: "",
        });
      }
    } else {
      // Handle case where category is not passed - maybe redirect or show error
      Taro.showToast({ title: "未指定分类", icon: "error" });
      Taro.navigateBack();
    }
  }, [router.params.category]);

  // Form validation effect
  useEffect(() => {
    let isValid = false;
    const imagesUploaded = imageFiles.length > 0;

    if (category === "rent") {
      const {
        title,
        roomType,
        rentAmount,
        rentPeriod,
        address,
        description,
        wechatId,
        includesBills,
      } = formData as RentFormData;
      if (
        title &&
        roomType &&
        rentAmount &&
        rentPeriod &&
        address &&
        description &&
        wechatId &&
        imagesUploaded
      ) {
        isValid = true;
      }
    } else if (category === "used") {
      const { title, itemCategory, price, condition, description, wechatId } =
        formData as UsedGoodFormData;
      if (
        title &&
        itemCategory &&
        price &&
        condition &&
        description &&
        wechatId &&
        imagesUploaded
      ) {
        isValid = true;
      }
    } else if (category === "jobs") {
      const {
        title,
        position,
        salaryRange,
        timeRequirement,
        description,
        wechatId,
      } = formData as JobFormData;
      if (
        title &&
        position &&
        salaryRange &&
        timeRequirement &&
        description &&
        wechatId &&
        imagesUploaded
      ) {
        isValid = true;
      }
    }
    setIsFormValid(isValid);
  }, [formData, imageFiles, category]);

  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeChange = (e) => {
    handleInputChange(
      "roomType" as keyof RentFormData,
      ROOM_TYPES[e.detail.value]
    );
  };

  const handleRentPeriodChange = (e) => {
    handleInputChange(
      "rentPeriod" as keyof RentFormData,
      RENT_PERIODS[e.detail.value]
    );
  };

  // Add new picker handlers for used goods and jobs
  const handleItemCategoryChange = (e) => {
    handleInputChange(
      "itemCategory" as keyof UsedGoodFormData,
      ITEM_CATEGORIES[e.detail.value]
    );
  };

  const handleItemConditionChange = (e) => {
    handleInputChange(
      "condition" as keyof UsedGoodFormData,
      ITEM_CONDITIONS[e.detail.value]
    );
  };

  const handleJobPositionChange = (e) => {
    handleInputChange(
      "position" as keyof JobFormData,
      JOB_POSITIONS[e.detail.value]
    );
  };

  const handleSalaryRangeChange = (e) => {
    handleInputChange(
      "salaryRange" as keyof JobFormData,
      SALARY_RANGES[e.detail.value]
    );
  };

  const handleTimeRequirementChange = (e) => {
    handleInputChange(
      "timeRequirement" as keyof JobFormData,
      TIME_REQUIREMENTS[e.detail.value]
    );
  };

  const handleChooseImage = () => {
    const count = 6 - imageFiles.length; // Max 6 images
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

  const handleSubmit = () => {
    if (!isFormValid) {
      Taro.showToast({ title: "请完善信息后再发布", icon: "none" });
      return;
    }
    if (imageFiles.length === 0) {
      Taro.showToast({ title: "至少上传一张图片", icon: "none" });
      return;
    }
    if (imageFiles.length > 6) {
      Taro.showToast({ title: "最多只能上传6张图", icon: "none" });
      return;
    }

    console.log("Form Data to submit:", formData);
    console.log(
      "Image files to submit:",
      imageFiles.map((f) => f.path)
    );
    // TODO: Actual API submission
    // 1. Upload images to your server, get URLs
    // 2. Submit formData along with image URLs to POST /api/posts/create

    Taro.showLoading({ title: "发布中..." });
    setTimeout(() => {
      // Simulate API call
      Taro.hideLoading();
      Taro.showModal({
        title: "发布成功",
        content: "发布成功，等待后台审核～",
        showCancel: false,
        success: () => {
          // TODO: Navigate to "我的发布" page. Need to know its path.
          // Assuming /pages/my/my-posts/my-posts
          Taro.redirectTo({ url: "/pages/my/my-posts/my-posts" });
        },
      });
    }, 1500);
  };

  // Render form based on category
  const renderRentForm = () => (
    <View>
      <View className="form-item">
        <Text className="form-label required">标题</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="示例：墨尔本近CBD温馨主卧出租"
          value={formData.title}
          onInput={(e) => handleInputChange("title", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">房型</Text>
        <Picker
          mode="selector"
          range={ROOM_TYPES}
          value={ROOM_TYPES.indexOf(formData.roomType || ROOM_TYPES[0])}
          onChange={handleRoomTypeChange}
        >
          <View className="picker-display">
            {formData.roomType || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item form-item-inline">
        <Text className="form-label required">租金</Text>
        <Input
          className="form-input rent-amount"
          type="digit"
          placeholder="金额"
          value={formData.rentAmount}
          onInput={(e) => handleInputChange("rentAmount", e.detail.value)}
        />
        <Picker
          mode="selector"
          range={RENT_PERIODS}
          value={RENT_PERIODS.indexOf(formData.rentPeriod || RENT_PERIODS[0])}
          onChange={handleRentPeriodChange}
        >
          <View className="picker-display rent-period">
            {formData.rentPeriod || "周期"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">地址</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="输入详细地址"
          value={formData.address}
          onInput={(e) => handleInputChange("address", e.detail.value)}
        />
        {/* TODO: Add map location button/feature */}
      </View>
      <View className="form-item form-item-segmented-control">
        <Text className="form-label required">是否包Bill</Text>
        <View className="segmented-control">
          <Button
            className={`segment-button ${
              formData.includesBills === true ? "active" : ""
            }`}
            onClick={() => handleInputChange("includesBills", true)}
          >
            是
          </Button>
          <Button
            className={`segment-button ${
              formData.includesBills === false ? "active" : ""
            }`}
            onClick={() => handleInputChange("includesBills", false)}
          >
            否
          </Button>
        </View>
      </View>
      <View className="form-item">
        <Text className="form-label required">微信号</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="填写你的微信号"
          value={formData.wechatId}
          onInput={(e) => handleInputChange("wechatId", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="请填写房况、室友要求、入住时间等"
          value={formData.description}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          autoHeight
        />
      </View>
    </View>
  );

  const renderUsedGoodForm = () => (
    <View>
      <View className="form-item">
        <Text className="form-label required">标题</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="例如：九成新沙发低价转让"
          value={formData.title}
          onInput={(e) => handleInputChange("title", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">商品种类</Text>
        <Picker
          mode="selector"
          range={ITEM_CATEGORIES}
          value={ITEM_CATEGORIES.indexOf(
            formData.itemCategory || ITEM_CATEGORIES[0]
          )}
          onChange={handleItemCategoryChange}
        >
          <View className="picker-display">
            {formData.itemCategory || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">价格</Text>
        <Input
          className="form-input"
          type="digit"
          placeholder="转让价格，如: 150"
          value={formData.price}
          onInput={(e) => handleInputChange("price", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">成色</Text>
        <Picker
          mode="selector"
          range={ITEM_CONDITIONS}
          value={ITEM_CONDITIONS.indexOf(
            formData.condition || ITEM_CONDITIONS[0]
          )}
          onChange={handleItemConditionChange}
        >
          <View className="picker-display">
            {formData.condition || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">微信号</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="填写你的微信号"
          value={formData.wechatId}
          onInput={(e) => handleInputChange("wechatId", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="描述一下你的宝贝，例如品牌、购买渠道、使用情况等"
          value={formData.description}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          autoHeight
        />
      </View>
    </View>
  );

  const renderJobForm = () => (
    <View>
      <View className="form-item">
        <Text className="form-label required">标题</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="例如：市中心咖啡店诚聘全职员工"
          value={formData.title}
          onInput={(e) => handleInputChange("title", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">岗位</Text>
        <Picker
          mode="selector"
          range={JOB_POSITIONS}
          value={JOB_POSITIONS.indexOf(formData.position || JOB_POSITIONS[0])}
          onChange={handleJobPositionChange}
        >
          <View className="picker-display">
            {formData.position || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">薪资范围</Text>
        <Picker
          mode="selector"
          range={SALARY_RANGES}
          value={SALARY_RANGES.indexOf(
            formData.salaryRange || SALARY_RANGES[0]
          )}
          onChange={handleSalaryRangeChange}
        >
          <View className="picker-display">
            {formData.salaryRange || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">时间要求</Text>
        <Picker
          mode="selector"
          range={TIME_REQUIREMENTS}
          value={TIME_REQUIREMENTS.indexOf(
            formData.timeRequirement || TIME_REQUIREMENTS[0]
          )}
          onChange={handleTimeRequirementChange}
        >
          <View className="picker-display">
            {formData.timeRequirement || "请选择"}
          </View>
        </Picker>
      </View>
      <View className="form-item">
        <Text className="form-label required">微信号</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="填写招聘联系微信号"
          value={formData.wechatId}
          onInput={(e) => handleInputChange("wechatId", e.detail.value)}
        />
      </View>
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="详细描述岗位职责、要求、福利待遇、工作地点等"
          value={formData.description}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          autoHeight
        />
      </View>
    </View>
  );

  return (
    <View className="post-form-page">
      <Text className="page-title-form">{pageTitle}</Text>

      {category === "rent" && renderRentForm()}
      {category === "used" && renderUsedGoodForm()}
      {category === "jobs" && renderJobForm()}

      <View className="form-item">
        <Text className="form-label required">
          上传图片 ({imageFiles.length}/6)
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
      </View>

      <Button
        className="submit-button"
        disabled={!isFormValid}
        onClick={handleSubmit}
      >
        发布
      </Button>
    </View>
  );
}
