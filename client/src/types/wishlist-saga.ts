export interface WishlistSaga {
  id: number;
  name: string;
  icon: string;
  created_at: string;
  user_id: number;
}

export interface CreateWishlistSagaDto {
  name: string;
  icon?: string;
}

export interface UpdateWishlistSagaDto {
  name?: string;
  icon?: string;
}
