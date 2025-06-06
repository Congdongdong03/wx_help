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
import { BASE_URL } from "../../../utils/env";

// Define the base API URL (adjust if your server runs elsewhere or in production)
const BASE_API_URL = `${BASE_URL}/api`;

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
  city?: string; // Added for consistency if backend sends city name
  cityCode?: string; // Added for city code
  [key: string]: any; // Allow other fields
}

interface DraftPostData {
  formData: PostFormData & { cityCode?: string }; // Ensure cityCode can be in draft
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
  cityCode?: string; // Add cityCode
  // images are handled by imageFiles state
}

interface UsedGoodFormData {
  title: string;
  itemCategory: string; // e.g., 家具, 电器, 书籍
  price: string;
  condition: string; // e.g., 全新, 九成新, 八成新
  description: string;
  wechatId: string;
  cityCode?: string; // Add cityCode
}

interface JobFormData {
  title: string;
  position: string; // e.g., 服务员, 收银员, 店员
  salaryRange: string; // e.g., 面议, $20-25/hr, $40-50k/年
  timeRequirement: string; // e.g., Full-time, Part-time, Casual
  description: string;
  wechatId: string;
  cityCode?: string; // Add cityCode
}

interface HelpFormData {
  title: string; // 主题 (Required)
  description?: string; // 文字 (Optional, max 100 chars)
  // images are handled by imageFiles state (Optional)
  wechatId: string; // 微信号 (Required, assuming it's needed for contact)
  cityCode?: string; // Add cityCode
}

// Union type for all possible form data structures
type PostFormData = Partial<
  RentFormData &
    UsedGoodFormData &
    JobFormData &
    HelpFormData & { cityCode?: string }
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

  // New states for city picker
  const [citiesApiList, setCitiesApiList] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedCityCode, setSelectedCityCode] = useState<string | null>(null);

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
      existingData?: PostFormData, // existingData will now potentially include cityCode
      existingImages?: Taro.chooseImage.ImageFile[]
    ) => {
      if (!cat) return;
      setCategory(cat);
      let baseData: PostFormData = {
        cityCode: selectedCityCode || citiesApiList[0]?.value,
      }; // Default cityCode
      if (cat === "rent") {
        baseData = {
          ...baseData,
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
          ...baseData,
          itemCategory: ITEM_CATEGORIES[0],
          condition: ITEM_CONDITIONS[0],
          title: "",
          price: "",
          wechatId: "",
          description: "",
        };
      } else if (cat === "jobs") {
        baseData = {
          ...baseData,
          position: JOB_POSITIONS[0],
          salaryRange: SALARY_RANGES[0],
          timeRequirement: TIME_REQUIREMENTS[0],
          title: "",
          wechatId: "",
          description: "",
        };
      } else if (cat === "help") {
        baseData = { ...baseData, title: "", description: "", wechatId: "" };
      }

      const finalData = { ...baseData, ...(existingData || {}) };
      console.log(
        "PostFormPage: initializeFormForCategory - Setting formData:",
        JSON.stringify(finalData)
      );
      setFormData(finalData);
      setInitialFormData(finalData);
      if (finalData.cityCode) {
        // If cityCode is in finalData (from existing or base)
        setSelectedCityCode(finalData.cityCode);
      }
      const finalImages = existingImages || [];
      setImageFiles(finalImages);
      setInitialImageFiles(finalImages);
      setPageTitle(getPageTitle(cat, !!existingData));
    },
    [selectedCityCode, citiesApiList] // Add dependencies
  );

  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        console.log("PostFormPage: Fetching cities list...");
        const res = await Taro.request<{
          code: number;
          data: Array<{ name: string; code: string }>;
        }>({
          url: `${BASE_API_URL}/home/cities`,
          method: "GET",
          timeout: 10000,
        });
        if (res.data && res.data.code === 0 && Array.isArray(res.data.data)) {
          const cityOptions = res.data.data.map((city) => ({
            label: city.name,
            value: city.code,
          }));
          setCitiesApiList(cityOptions);
          console.log("PostFormPage: Cities loaded:", cityOptions);
          // Set default city for NEW posts if not already set and cities are available
          // For existing drafts/edits, city will be handled by the main useEffect below
          if (
            cityOptions.length > 0 &&
            !formData.cityCode &&
            !editingPostOriginalId &&
            !router.params.draftId
          ) {
            const defaultCityValue = cityOptions[0].value;
            setSelectedCityCode(defaultCityValue);
            // Directly update formData here ONLY IF it's a truly new form.
            // Otherwise, let the main useEffect handle initialization from draft/edit data.
            if (!category) {
              // Check if category has been set yet; if not, it's likely a very early stage
              setFormData((prev) => ({ ...prev, cityCode: defaultCityValue }));
              setInitialFormData((prev) => ({
                ...prev,
                cityCode: defaultCityValue,
              }));
            }
            console.log(
              "PostFormPage: Default city for new post tentatively set to:",
              defaultCityValue
            );
          }
        } else {
          console.warn(
            "PostFormPage: Cities API response format incorrect or error",
            res.data
          );
        }
      } catch (error) {
        console.error("PostFormPage: Failed to load cities:", error);
      }
    };
    fetchCities();
  }, []); // Fetch cities once on mount

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
            // cityCode should be part of draft.formData
            draft.category,
            draft.formData,
            draft.imageFiles
          );
          if (draft.formData.cityCode)
            setSelectedCityCode(draft.formData.cityCode);
        } else {
          initializeFormForCategory(catFromParam); // Will use default city from initializeFormForCategory
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
            // No need for & { cityCode?: string } here, PostFormData includes it
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
            cityCode: postDataToEdit.cityCode || postDataToEdit.city, // Prioritize cityCode
          };
          const images: Taro.chooseImage.ImageFile[] = postDataToEdit.image
            ? [{ path: postDataToEdit.image, size: 0 }]
            : [];
          initializeFormForCategory(catFromParam, formDataSource, images);
          if (formDataSource.cityCode)
            setSelectedCityCode(formDataSource.cityCode);
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
      // For a brand new form, initializeFormForCategory will use the selectedCityCode (which might be the default from citiesApiList)
      initializeFormForCategory(catFromParam);
      setIsLoadingData(false);
    } else {
      Taro.showToast({ title: "页面参数错误", icon: "error" });
      Taro.navigateBack();
      setIsLoadingData(false);
    }
    // Add citiesApiList to dependency array if initializeFormForCategory depends on it for default city
  }, [router.params, initializeFormForCategory, citiesApiList]);

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

  useEffect(() => {
    let isValid = false;
    const { title, wechatId, description, cityCode } = formData;

    if (
      !category ||
      !title ||
      title.trim() === "" ||
      !cityCode ||
      cityCode.trim() === ""
    ) {
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

  const handleSaveDraft = async () => {
    if (!category) {
      Taro.showToast({ title: "无法保存草稿", icon: "none" });
      return;
    }
    // For drafts, title or description or image is enough. City might not be mandatory for a draft.
    if (!formData.title && !formData.description && imageFiles.length === 0) {
      Taro.showToast({ title: "内容为空", icon: "none" });
      return;
    }

    setIsSavingDraft(true);

    const payload = {
      ...formData, // formData now contains cityCode if selected
      category,
      status: "draft",
      images: imageFiles.map((file) => file.path),
    };

    try {
      const res = await Taro.request({
        url: `${BASE_API_URL}/posts`, // Assuming this endpoint handles drafts too
        method: "POST",
        data: payload,
        header: {
          "Content-Type": "application/json",
          // TODO: Add Authorization header if needed
        },
      });

      if (res.statusCode === 201 && res.data && res.data.post) {
        Taro.showToast({
          title: res.data.message || "草稿已保存", // Use API message or default
          icon: "success",
        });
        // Update initial state to prevent "dirty" check from prompting again immediately
        setInitialFormData(formData);
        setInitialImageFiles(imageFiles);
        // Potentially navigate back or update editingPostOriginalId if draft has an ID from backend
        // For now, just show success and allow user to continue editing or leave
      } else {
        console.error("Save draft API error:", res);
        Taro.showToast({
          title: res.data?.error || "草稿保存至服务器失败",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Save draft network error:", error);
      Taro.showToast({ title: "草稿保存失败，请检查网络", icon: "error" });
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

  const handleSubmit = async () => {
    if (!isFormValid) {
      Taro.showToast({ title: "请完善必填信息后再发布", icon: "none" });
      return;
    }

    setIsPublishing(true);
    Taro.showLoading({
      title: editingPostOriginalId ? "更新中..." : "发布中...",
      mask: true,
    });

    try {
      let processedImagePaths = imageFiles.map((file) => file.path);

      if (
        category === "help" &&
        (!formData.description || formData.description.trim() === "") &&
        processedImagePaths.length === 0 &&
        formData.title
      ) {
        const generatedImageFile = await generateImageFromText(formData.title);
        processedImagePaths = [generatedImageFile.path];
      }

      if (
        (category === "rent" || category === "used" || category === "jobs") &&
        processedImagePaths.length === 0
      ) {
        Taro.showToast({ title: "至少上传一张图片", icon: "none" });
        setIsPublishing(false);
        Taro.hideLoading();
        return;
      }
      if (processedImagePaths.length > 6) {
        Taro.showToast({ title: "最多只能上传6张图", icon: "none" });
        setIsPublishing(false);
        Taro.hideLoading();
        return;
      }

      const payload = {
        ...formData, // formData now includes cityCode
        category: category,
        status: "publish", // Or dynamic if also handling updates for non-published posts
        images: processedImagePaths,
        // If your backend expects 'city' (name) instead of 'cityCode', map it here:
        // cityName: citiesApiList.find(c => c.value === formData.cityCode)?.label,
      };
      // Remove cityCode if backend expects cityName, or send both if backend handles it
      // if (payload.cityCode && payload.cityName) delete payload.cityCode;

      console.log("Submitting to API:", payload);

      // Determine API endpoint and method based on whether it's an edit or new post
      let apiUrl = `${BASE_API_URL}/posts`;
      let apiMethod: "POST" | "PUT" = "POST";

      if (editingPostOriginalId) {
        apiUrl = `${BASE_API_URL}/posts/${editingPostOriginalId}`;
        apiMethod = "PUT";
      }

      const res = await Taro.request({
        url: apiUrl,
        method: apiMethod,
        data: payload,
        header: {
          "Content-Type": "application/json",
          // TODO: Add Authorization header if needed
        },
      });

      Taro.hideLoading();

      const successMessage = editingPostOriginalId ? "更新成功" : "发布成功";
      const failureMessageBase = editingPostOriginalId
        ? "更新失败"
        : "发布失败";

      if (
        (apiMethod === "POST" && res.statusCode === 201) ||
        (apiMethod === "PUT" && res.statusCode === 200)
      ) {
        Taro.showToast({
          title: res.data?.message || successMessage,
          icon: "success",
          duration: 1500,
        });

        if (router.params.draftId && apiMethod === "POST") {
          // Only remove local draft if it was published
          Taro.removeStorageSync(router.params.draftId);
        }
        setInitialFormData({}); // Reset dirty check
        setInitialImageFiles([]);

        // Tell MyPosts page to refresh
        Taro.setStorageSync("refreshMyPosts", "true");

        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        console.error("Submit API error:", res);
        Taro.showToast({
          title: res.data?.error || failureMessageBase,
          icon: "error",
        });
      }
    } catch (error) {
      Taro.hideLoading();
      console.error("handleSubmit network/unknown error:", error);
      const failureMessageBase = editingPostOriginalId
        ? "更新失败"
        : "发布失败";
      Taro.showToast({
        title: `${failureMessageBase}，请稍后重试`,
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

      {/* City Picker - Common for all forms */}
      {citiesApiList.length > 0 && (
        <View className="form-item">
          <Text className="form-label required">所在城市</Text>
          <Picker
            mode="selector"
            range={citiesApiList.map((city) => city.label)} // Display city names
            value={citiesApiList.findIndex(
              (city) => city.value === selectedCityCode
            )}
            onChange={(e) => {
              const selectedIndex = Number(e.detail.value);
              const cityValue = citiesApiList[selectedIndex]?.value;
              if (cityValue) {
                setSelectedCityCode(cityValue);
                handleInputChange("cityCode", cityValue); // Store city CODE in formData
              }
            }}
          >
            <View className="picker-display">
              {selectedCityCode
                ? citiesApiList.find((city) => city.value === selectedCityCode)
                    ?.label
                : "请选择城市"}
            </View>
          </Picker>
        </View>
      )}

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
