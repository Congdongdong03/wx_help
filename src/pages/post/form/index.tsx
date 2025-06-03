import Taro, { useRouter } from "@tarojs/taro";
import { useState, useEffect, useCallback } from "react";
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
import BottomActionBar from "../../../components/BottomActionBar/index";
import WechatIdInput from "../../../components/WechatIdInput/index";
import "./index.scss";

// Interfaces (ensure Post is defined if passed directly, or map from it)
interface OriginalPostData {
  // Structure from my-posts.tsx
  id: number | string;
  image: string;
  description: string;
  createTime: string;
  auditStatus: string; // AuditStatus type
  category: string;
  title?: string;
  wechatId?: string;
  roomType?: string;
  rentAmount?: string;
  address?: string;
  includesBills?: boolean;
  itemCategory?: string;
  price?: string;
  condition?: string;
  position?: string;
  salaryRange?: string;
  timeRequirement?: string;
  [key: string]: any; // Allow other fields
}

interface DraftPostData {
  formData: PostFormData;
  imageFiles: Taro.chooseImage.ImageFile[];
  category: string | null;
  timestamp: number;
}

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

interface HelpFormData {
  title: string; // 主题 (Required)
  description?: string; // 文字 (Optional, max 100 chars)
  // images are handled by imageFiles state (Optional)
  wechatId: string; // 微信号 (Required, assuming it's needed for contact)
}

// Union type for all possible form data structures
type PostFormData = Partial<
  RentFormData & UsedGoodFormData & JobFormData & HelpFormData
>;

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
  console.log(
    "PostFormPage: Component body rendering/re-rendering. Router params:",
    useRouter().params
  );
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("填写发布内容");
  const [initialFormData, setInitialFormData] = useState<PostFormData>({});
  const [initialImageFiles, setInitialImageFiles] = useState<
    Taro.chooseImage.ImageFile[]
  >([]);
  const [formData, setFormData] = useState<PostFormData>({});
  const [imageFiles, setImageFiles] = useState<Taro.chooseImage.ImageFile[]>(
    []
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [attemptingBack, setAttemptingBack] = useState(false);
  const [editingPostOriginalId, setEditingPostOriginalId] = useState<
    string | number | null
  >(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const getPageTitle = (catName: string | null, isEditing = false) => {
    const prefix = isEditing ? "编辑" : "发布";
    if (catName === "rent") return `${prefix}租房信息`;
    if (catName === "used") return `${prefix}二手信息`;
    if (catName === "jobs") return `${prefix}招聘信息`;
    if (catName === "help") return `${prefix}帮帮信息`;
    return isEditing ? "编辑内容" : "填写发布内容";
  };

  const initializeFormForCategory = useCallback(
    (
      cat: string | null | undefined,
      existingData?: PostFormData,
      existingImages?: Taro.chooseImage.ImageFile[]
    ) => {
      if (!cat) return;
      setCategory(cat);
      let baseData: PostFormData = {};
      if (cat === "rent") {
        baseData = {
          roomType: ROOM_TYPES[0],
          rentPeriod: RENT_PERIODS[0],
          includesBills: true,
          title: "",
          rentAmount: "",
          address: "",
          wechatId: "",
          description: "",
        };
      } else if (cat === "used") {
        baseData = {
          itemCategory: ITEM_CATEGORIES[0],
          condition: ITEM_CONDITIONS[0],
          title: "",
          price: "",
          wechatId: "",
          description: "",
        };
      } else if (cat === "jobs") {
        baseData = {
          position: JOB_POSITIONS[0],
          salaryRange: SALARY_RANGES[0],
          timeRequirement: TIME_REQUIREMENTS[0],
          title: "",
          wechatId: "",
          description: "",
        };
      } else if (cat === "help") {
        baseData = { title: "", description: "", wechatId: "" };
      }

      const finalData = { ...baseData, ...(existingData || {}) };
      console.log(
        "PostFormPage: initializeFormForCategory - Setting formData:",
        JSON.stringify(finalData)
      );
      setFormData(finalData);
      setInitialFormData(finalData);
      const finalImages = existingImages || [];
      setImageFiles(finalImages);
      setInitialImageFiles(finalImages);
      setPageTitle(getPageTitle(cat, !!existingData));
    },
    []
  );

  useEffect(() => {
    const params = router.params;
    const catFromParam = params.category;
    const draftId = params.draftId;
    const editingId = params.editingPostId;
    console.log(
      `PostFormPage: Main useEffect - Params: category=${catFromParam}, draftId=${draftId}, editingPostId=${editingId}`
    );
    setIsLoadingData(true);
    if (draftId && catFromParam) {
      console.log("PostFormPage: Loading from DRAFT_ID", draftId);
      try {
        const draft = Taro.getStorageSync(draftId) as DraftPostData | "";
        if (
          draft &&
          typeof draft === "object" &&
          draft.category === catFromParam
        ) {
          initializeFormForCategory(
            draft.category,
            draft.formData,
            draft.imageFiles
          );
        } else {
          initializeFormForCategory(catFromParam);
        }
      } catch (e) {
        console.error("Error loading draft:", e);
        initializeFormForCategory(catFromParam);
      } finally {
        setIsLoadingData(false);
      }
    } else if (editingId && catFromParam) {
      console.log("PostFormPage: Loading from EDITING_POST_ID", editingId);
      setEditingPostOriginalId(editingId);
      try {
        const postDataToEdit = Taro.getStorageSync("editingPostData") as
          | OriginalPostData
          | "";
        Taro.removeStorageSync("editingPostData");
        if (
          postDataToEdit &&
          typeof postDataToEdit === "object" &&
          postDataToEdit.category === catFromParam
        ) {
          console.log("PostFormPage: Found editingPostData:", postDataToEdit);
          const formDataSource: PostFormData = {
            title: postDataToEdit.title || postDataToEdit.description,
            description: postDataToEdit.description,
            wechatId: postDataToEdit.wechatId,
            roomType: postDataToEdit.roomType,
            rentAmount: postDataToEdit.rentAmount,
            address: postDataToEdit.address,
            includesBills: postDataToEdit.includesBills,
            itemCategory: postDataToEdit.itemCategory,
            price: postDataToEdit.price,
            condition: postDataToEdit.condition,
            position: postDataToEdit.position,
            salaryRange: postDataToEdit.salaryRange,
            timeRequirement: postDataToEdit.timeRequirement,
          };
          const images: Taro.chooseImage.ImageFile[] = postDataToEdit.image
            ? [{ path: postDataToEdit.image, size: 0 }]
            : [];
          initializeFormForCategory(catFromParam, formDataSource, images);
        } else {
          console.warn("editingPostData not found or invalid.");
          initializeFormForCategory(catFromParam);
        }
      } catch (e) {
        console.error("Error loading editingPostData:", e);
        initializeFormForCategory(catFromParam);
      } finally {
        setIsLoadingData(false);
      }
    } else if (catFromParam) {
      console.log(
        "PostFormPage: Initializing NEW form for category",
        catFromParam
      );
      initializeFormForCategory(catFromParam);
      setIsLoadingData(false);
    } else {
      Taro.showToast({ title: "页面参数错误", icon: "error" });
      Taro.navigateBack();
      setIsLoadingData(false);
    }
  }, [router.params, initializeFormForCategory]);

  const isDirty = useCallback(() => {
    if (isLoadingData) return false;
    const formDataChanged =
      JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const imageFilesChanged =
      imageFiles.length !== initialImageFiles.length ||
      imageFiles.some(
        (file, index) =>
          file.path !==
          (initialImageFiles[index] && initialImageFiles[index].path)
      );
    return formDataChanged || imageFilesChanged;
  }, [formData, imageFiles, initialFormData, initialImageFiles, isLoadingData]);

  const handleSaveDraft = () => {
    if (!category) {
      Taro.showToast({ title: "无法保存草稿", icon: "none" });
      return;
    }
    if (!isDirty()) {
      Taro.showToast({ title: "内容无修改", icon: "none" });
      return;
    }
    if (!formData.title && !formData.description && imageFiles.length === 0) {
      Taro.showToast({ title: "内容为空", icon: "none" });
      return;
    }

    setIsSavingDraft(true);
    const draftId = `draft_${category}_${Date.now()}`;
    const draftData: DraftPostData = {
      formData,
      imageFiles,
      category,
      timestamp: Date.now(),
    };
    try {
      Taro.setStorageSync(draftId, draftData);
      Taro.showToast({ title: "已存为草稿", icon: "success" });
      setInitialFormData(formData);
      setInitialImageFiles(imageFiles);
    } catch (e) {
      Taro.showToast({ title: "草稿保存失败", icon: "error" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // User's handleBack, which seems to be an attempt to fix useDidHide
  const handleBack = () => {
    console.log("PostFormPage: Custom handleBack triggered");
    if (attemptingBack) return;
    if (category === "help" && isDirty()) {
      // This is still specific to "help"
      setAttemptingBack(true);
      Taro.showModal({
        title: "保存草稿",
        content: "检测到未保存的内容，是否保存为草稿？",
        showCancel: true,
        cancelText: "直接离开",
        confirmText: "保存草稿",
        success: (res) => {
          if (res.confirm) {
            handleSaveDraft();
            setTimeout(() => {
              Taro.navigateBack();
            }, 500);
          } else {
            Taro.navigateBack();
          }
          setAttemptingBack(false);
        },
        fail: () => {
          Taro.navigateBack();
          setAttemptingBack(false);
        },
      });
    } else {
      Taro.navigateBack();
    }
  };

  Taro.useDidHide(() => {
    console.log(
      "PostFormPage: useDidHide triggered. Attempting custom back logic."
    );
    // Instead of complex logic here, we consider if handleBack should be called if this is the only exit path now.
    // However, useDidHide might be too late to *prevent* navigation for a modal.
    // For now, this remains a log point as per user's version, since custom handleBack exists.
  });
  const resetPageState = useCallback(() => {
    setAttemptingBack(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(resetPageState, 100);
    return () => clearTimeout(timer);
  }, [resetPageState]);

  useEffect(() => {
    let isValid = false;
    const { title, wechatId, description } = formData;
    if (!category || !title || title.trim() === "") {
      setIsFormValid(false);
      return;
    }
    switch (category) {
      case "help":
        if (wechatId && wechatId.trim() !== "") isValid = true;
        break;
      case "rent":
        const rf = formData as RentFormData;
        if (
          rf.roomType &&
          rf.rentAmount &&
          rf.address &&
          rf.wechatId &&
          imageFiles.length > 0
        )
          isValid = true;
        break;
      case "used":
        const uf = formData as UsedGoodFormData;
        if (uf.itemCategory && uf.price && uf.wechatId && imageFiles.length > 0)
          isValid = true;
        break;
      case "jobs":
        const jf = formData as JobFormData;
        if (
          jf.position &&
          jf.salaryRange &&
          jf.timeRequirement &&
          jf.wechatId &&
          imageFiles.length > 0
        )
          isValid = true;
        break;
      default:
        isValid = false;
    }
    setIsFormValid(isValid);
  }, [formData, imageFiles, category]);

  const handleSubmit = async () => {
    if (!isFormValid) {
      Taro.showToast({ title: "请完善必填信息后再发布", icon: "none" });
      return;
    }

    setIsPublishing(true);

    try {
      let currentImageFiles = [...imageFiles];
      const { title, description } = formData;

      if (
        category === "help" &&
        (!description || description.trim() === "") &&
        currentImageFiles.length === 0 &&
        title
      ) {
        Taro.showLoading({ title: "生成图片中..." });
        try {
          const generatedImage = await generateImageFromText(title);
          currentImageFiles = [generatedImage];
        } catch (error) {
          console.error("Image generation failed:", error);
          Taro.showToast({ title: "图片生成失败", icon: "error" });
          setIsPublishing(false);
          Taro.hideLoading();
          return;
        } finally {
          Taro.hideLoading();
        }
      }

      if (
        (category === "rent" || category === "used" || category === "jobs") &&
        currentImageFiles.length === 0
      ) {
        Taro.showToast({ title: "至少上传一张图片", icon: "none" });
        setIsPublishing(false);
        return;
      }
      if (
        category === "help" &&
        (!description || description.trim() === "") &&
        currentImageFiles.length === 0
      ) {
        Taro.showToast({ title: "请填写文字描述或上传图片", icon: "none" });
        setIsPublishing(false);
        return;
      }
      if (currentImageFiles.length > 6) {
        Taro.showToast({ title: "最多只能上传6张图", icon: "none" });
        setIsPublishing(false);
        return;
      }

      console.log("PostFormPage: Form Data to submit:", formData);
      console.log(
        "PostFormPage: Image files to submit:",
        currentImageFiles.map((f) => f.path)
      );

      const draftId = router.params.draftId;
      if (draftId) {
        Taro.removeStorageSync(draftId);
        console.log(`PostFormPage: Draft ${draftId} removed after submission.`);
      }

      const submissionMode = editingPostOriginalId
        ? "Edit"
        : draftId
        ? "Draft-to-Post"
        : "New Post";
      console.log("Submitting data for mode:", submissionMode);

      Taro.showLoading({
        title: editingPostOriginalId ? "更新中..." : "发布中...",
        mask: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      Taro.hideLoading();
      Taro.showToast({
        title: editingPostOriginalId ? "更新成功" : "发布成功",
        icon: "success",
        duration: 1500,
      });

      setInitialFormData({});
      setInitialImageFiles([]);

      setTimeout(() => {
        Taro.navigateBack();
      }, 1500);
    } catch (error) {
      console.error("handleSubmit error:", error);
      Taro.hideLoading();
      Taro.showToast({
        title: editingPostOriginalId ? "更新失败" : "发布失败",
        icon: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Input handlers and render functions (ensure formData fields are accessed with || '' for safety in value prop)
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
  const generateImageFromText = async (
    text: string
  ): Promise<Taro.chooseImage.ImageFile> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      path: `path/to/generated/${text.replace(/\s+/g, "_")}.png`,
      size: 102400,
    } as Taro.chooseImage.ImageFile;
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
          value={formData.title || ""}
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
          value={formData.rentAmount || ""}
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
          value={formData.address || ""}
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
      <WechatIdInput
        value={formData.wechatId}
        onInput={(value) => handleInputChange("wechatId", value)}
        placeholder="填写你的微信号"
      />
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="请填写房况、室友要求、入住时间等"
          value={formData.description || ""}
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
          value={formData.title || ""}
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
          value={formData.price || ""}
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
      <WechatIdInput
        value={formData.wechatId}
        onInput={(value) => handleInputChange("wechatId", value)}
        placeholder="填写你的微信号"
      />
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="描述一下你的宝贝，例如品牌、购买渠道、使用情况等"
          value={formData.description || ""}
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
          value={formData.title || ""}
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
      <WechatIdInput
        value={formData.wechatId}
        onInput={(value) => handleInputChange("wechatId", value)}
        placeholder="填写招聘联系微信号"
      />
      <View className="form-item">
        <Text className="form-label required">描述</Text>
        <Textarea
          className="form-textarea"
          placeholder="详细描述岗位职责、要求、福利待遇、工作地点等"
          value={formData.description || ""}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          autoHeight
        />
      </View>
    </View>
  );

  const renderHelpForm = () => (
    <View>
      <View className="form-item">
        <Text className="form-label required">主题</Text>
        <Input
          className="form-input"
          type="text"
          placeholder="请输入主题"
          value={formData.title || ""}
          onInput={(e) => handleInputChange("title", e.detail.value)}
          maxlength={50}
        />
      </View>
      <View className="form-item">
        <Text className="form-label">文字 (可选)</Text>
        <Textarea
          className="form-textarea"
          placeholder="请输入文字内容 (100字以内)"
          value={formData.description || ""}
          onInput={(e) => handleInputChange("description", e.detail.value)}
          maxlength={100}
          autoHeight
        />
      </View>
      <WechatIdInput
        value={formData.wechatId}
        onInput={(value) => handleInputChange("wechatId", value)}
        placeholder="填写你的微信号"
      />
    </View>
  );

  return (
    <View className="post-form-page">
      <Text className="page-title-form">{pageTitle}</Text>

      {category === "rent" && renderRentForm()}
      {category === "used" && renderUsedGoodForm()}
      {category === "jobs" && renderJobForm()}
      {category === "help" && renderHelpForm()}

      <View className="form-item">
        <Text className="form-label">
          上传图片 ({imageFiles.length}/6)
          {(category === "rent" ||
            category === "used" ||
            category === "jobs") && (
            <Text className="required-indicator">*</Text>
          )}
          {category === "help" && <Text> (可选)</Text>}
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

      <BottomActionBar
        onSaveDraft={handleSaveDraft}
        onPublish={handleSubmit}
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        publishText={editingPostOriginalId ? "更新" : "发布"}
      />
    </View>
  );
}
