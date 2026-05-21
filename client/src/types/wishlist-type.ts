export interface WishlistType {
  id: number;
  name: string;
  icon: string;
  created_at: string;
  user_id: number;
}

export interface CreateWishlistTypeDto {
  name: string;
  icon?: string;
}

export interface UpdateWishlistTypeDto {
  name?: string;
  icon?: string;
}
