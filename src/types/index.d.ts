interface Category {
  id: string;
  name: string;
  color: string;
}

interface FeedPost {
  id: string | number;
  mockImagePlaceholderHeight?: number;
  mockImagePlaceholderColor?: string;
  title: string;
  content: string;
  content_preview?: string;
  category: Category;
  sub_category?: string;
  price?: string | number;
  updated_at: string;
  created_at: string;
  city_code: string;
  status: "published" | "pending" | "rejected" | "draft";
  images: string[];
  cover_image?: string;
  is_pinned?: boolean;
  is_weekly_deal?: boolean;
  users?: {
    id: number;
    nickname: string;
    avatar_url: string;
    gender?: string;
    city?: string;
  };
}

interface RecommendMeta {
  weekly_deals_count: number;
  pinned_posts_count: number;
  total_pinned: number;
}
