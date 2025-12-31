
export type Category = 'إعلانات' | 'أفلام' | 'تأملات' | 'منوعات';

export interface Post {
  id: string;
  slug: string; // الحقل الجديد للروابط النصية
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  date: string;
  imageUrl: string;
  link: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  favoriteCategory: Category;
}
