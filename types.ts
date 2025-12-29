export type Category = 'إعلانات' | 'أفلام' | 'تأملات' | 'منوعات';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string; // المحتوى الكامل
  category: Category;
  date: string;
  imageUrl: string;
  link: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  favoriteCategory: Category;
}