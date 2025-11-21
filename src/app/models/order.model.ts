export interface Order {
  id: string;
  [key: string]: unknown;
}

export interface OrderResponse {
  orders: Order[];
  total?: number;
}
