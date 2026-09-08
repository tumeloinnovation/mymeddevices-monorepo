export interface Category {
  id: string | number;
  name: string;
  slug: string;
  parent: string | number;
  parent_id?: string | number | null;
  image: CategoryImage | null;
  icon_url?: string | null;
  menu_order: number;
  count: number;
  description: string;
  display: string;
  children?: Category[];
}

export interface CategoryImage {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  src: string;
  name: string;
  alt: string;
}

