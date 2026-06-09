export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  checked: boolean;
  priority: string;
  quarter: string;
  wishlist_type_id?: number;
  saga_id?: number;
  created_at: string;
  user_id: number;
}

export interface CreateWishlistDto {
  name: string;
  price: number;
  checked?: boolean;
  priority?: string;
  quarter?: string;
  wishlist_type_id?: number;
  saga_id?: number;
}

export interface UpdateWishlistDto {
  name?: string;
  price?: number;
  checked?: boolean;
  priority?: string;
  quarter?: string;
  wishlist_type_id?: number;
  saga_id?: number;
}
