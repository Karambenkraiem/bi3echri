export type Condition = 'NEUF' | 'OCCASION';
export type ArticleSpecs = Record<string, string | number | undefined>;

export interface CategoryRef {
  id: string;
  name: string;
  parent?: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  children?: Category[];
}

export interface ProductPhoto {
  id: string;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  category: CategoryRef;
  condition: Condition;
  price: string | number | null;
  quantity: number;
  specs?: ArticleSpecs | null;
  photos: ProductPhoto[];
  isNew: boolean;
  createdAt: string;
}

export type OrderType = 'RESERVATION' | 'ACHAT' | 'NEGOCIATION';
export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'VENDU';

export interface MyOrder {
  id: string;
  status: OrderStatus;
  type: OrderType;
  quantity: number;
  notes?: string | null;
  retraitDeadline?: string | null;
  agreedPrice?: string | number | null;
  createdAt: string;
  article: {
    id: string;
    name: string;
    price: string | number | null;
    photos: ProductPhoto[];
  };
}

export interface Client {
  id: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  staffUserId?: string | null;
}

export type MessageSender = 'CLIENT' | 'STAFF';
export type MessageAttachmentType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface Message {
  id: string;
  orderId: string;
  sender: MessageSender;
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: MessageAttachmentType | null;
  attachmentName?: string | null;
  createdById?: string | null;
  createdBy?: { name: string } | null;
  createdAt: string;
}
