export type ProductOptionGroupType = 'REMOVE_INGREDIENTS' | 'COOKING';

export type OptionGroup = {
  id: string;
  name: string;
  type: ProductOptionGroupType;
  rules: {
    options: string[];
    maxSelections?: number;
    required?: boolean;
  };
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  kind: 'STANDARD' | 'MEAT';
  optionGroups: OptionGroup[];
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  products: Product[];
};

export type MenuResponse = {
  establishment: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  table: {
    id: string;
    label: string;
  };
  categories: Category[];
};

export type OrderStatus = 'NOUVELLE' | 'EN_PREPA' | 'PRETE' | 'SERVIE' | 'ANNULEE';

export type OrderItemPayload = {
  productId: string;
  qty: number;
  notes?: string;
  chosenOptions: Record<string, unknown>;
};

export type OrderPayload = {
  tableId: string;
  sig: string;
  exp: string;
  paymentMode: 'SIMULATED' | 'STRIPE';
  items: OrderItemPayload[];
};

export type Order = {
  id: string;
  establishmentId: string;
  establishment?: {
    id: string;
    name: string;
  };
  tableId: string;
  status: OrderStatus;
  total: number;
  seen: boolean;
  createdAt: string;
  table: {
    id: string;
    label: string;
  };
  items: Array<{
    id: string;
    qty: number;
    unitPrice: number;
    notes?: string;
    chosenOptions: Record<string, unknown>;
    product: {
      id: string;
      name: string;
    };
  }>;
};
