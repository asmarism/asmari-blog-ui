
import { Post, Category } from './types';

// الرابط الأساسي لـ API ووردبريس في موقعك
const BASE_URL = 'https://blog.asmari.me/wp-json/wp/v2';

export async function fetchWordPressPosts(): Promise<Post[]> {
  try {
    // نطلب المقالات مع دمج البيانات (embedded) لجلب الصور وأسماء الأقسام
    const response = await fetch(`${BASE_URL}/posts?_embed&per_page=12`);
    
    if (!response.ok) {
      throw new Error(`فشل الاتصال بـ API الموقع: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.map((post: any) => {
      // استخراج أسماء الأقسام من البيانات المدمجة (embedded wp:term)
      const wpTerms = post._embedded?.['wp:term']?.[0] || [];
      const categoryNames = wpTerms.map((term: any) => term.name);

      return {
        id: post.id.toString(),
        title: post.title.rendered,
        // تنظيف المحتوى من وسوم HTML
        excerpt: post.excerpt.rendered.replace(/<[^>]*>?/gm, '').substring(0, 110) + '...',
        category: mapToMyCategories(categoryNames),
        date: formatArabicDate(post.date),
        imageUrl: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 
                  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
        readTime: calculateReadTime(post.content.rendered)
      };
    });
  } catch (error) {
    console.error("خطأ في الربط مع blog.asmari.me:", error);
    return [];
  }
}

function formatArabicDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      day: 'numeric',
      month: 'long'
    });
  } catch {
    return "قريباً";
  }
}

function calculateReadTime(content: string): string {
  const words = content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
  const minutes = Math.ceil(words / 180); 
  return `${minutes} دقائق قراءة`;
}

function mapToMyCategories(wpCategoryNames: string[]): Category {
  const myCategories: Category[] = ['إعلانات', 'أفلام', 'تأملات', 'منوعات'];
  
  // إذا وجدنا اسماً مطابقاً لأقسامنا الأربعة في ووردبريس نختاره فوراً
  const matched = myCategories.find(myCat => 
    wpCategoryNames.some(wpCat => wpCat.trim() === myCat)
  );
  
  if (matched) return matched;

  // إذا لم نجد تطابقاً دقيقاً، نحاول البحث عن كلمات مفتاحية أو نضعها في "منوعات"
  return 'منوعات';
}
