interface Category {
  id: string;
  name: string;
  color: string;
}

interface FeedPost {
  id: string | number;
  title: string;
  content: string;
  category: Category;
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
  };
}
