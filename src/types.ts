export type Business = 'nails' | 'cookies';

export type Service = {
  id: string;
  business: Business;
  name: string;
  price: number;
  duration_minutes: number | null;
};

export type CookieOrderRequest = {
  full_name?: string;
  email?: string;
  phone?: string;
  fulfillment_method?: 'pickup' | 'delivery';
  order_date?: string;
  order_time?: string;
  delivery_address?: string | null;
  allergies?: string | null;
  notes?: string | null;
  order_items?: { service_id: string; qty: number }[];
};

export type NailDesignCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type NailDesign = {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  starting_price: number | null;
  image_url: string;
  category: Pick<NailDesignCategory, 'id' | 'name' | 'slug'> | null;
};