export type Role = 'ADMIN' | 'VENDEUR';
export type Condition = 'NEUF' | 'OCCASION';
export type ArticleStatus = 'EN_STOCK' | 'RESERVE' | 'VENDU';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
}

export type CashMovementType =
  | 'RESET'
  | 'PURCHASE'
  | 'SALE'
  | 'EXPENSE'
  | 'MANUAL'
  | 'INVESTMENT'
  | 'RETOUR';
export type PaymentMethod = 'CASH' | 'VIREMENT' | 'CHEQUE';
export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'VIREMENT', 'CHEQUE'];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash Espèce',
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
};

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: string | number;
  paymentMethod: PaymentMethod;
  comment?: string | null;
  articleId?: string | null;
  saleId?: string | null;
  expenseId?: string | null;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: string | number;
  comment: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
}

export type ArticleSpecs = Record<string, string | number | undefined>;

export interface Photo {
  id: string;
  articleId: string;
  url: string;
  order: number;
  createdAt: string;
}

export const MAX_PHOTOS_PER_ARTICLE = 10;

export interface Article {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category: Category;
  condition: Condition;
  purchasePrice: string | number;
  purchaseDate: string;
  purchaseSource?: string | null;
  expectedSalePrice?: string | number | null;
  floorPrice?: string | number | null;
  quantity: number;
  status: ArticleStatus;
  readyForPublication: boolean;
  notReadyReason?: string | null;
  specs?: ArticleSpecs | null;
  photos?: Photo[];
  createdAt: string;
  updatedAt: string;
  sale?: Sale | null;
}

export interface Sale {
  id: string;
  articleId: string;
  article?: Article;
  salePrice: string | number;
  saleDate: string;
  buyerName?: string | null;
  buyerContact?: string | null;
  adChannel: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  soldBy?: { id: string; name: string };
  createdAt: string;
}

export interface AnalyticsSummary {
  stockCount: number;
  stockValue: number;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface MarginByCategory {
  categoryId: string;
  categoryName: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface RevenueOverTime {
  month: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface StockRotation {
  categoryId: string;
  categoryName: string;
  avgDaysToSell: number | null;
  salesCount: number;
}

export interface ChannelPerformance {
  channel: string;
  salesCount: number;
  totalRevenue: number;
  totalMargin: number;
}

export interface VisitsPoint {
  period: string;
  visits: number;
}

export const AD_CHANNELS = [
  'Leboncoin',
  'Vinted',
  'Facebook Marketplace',
  'eBay',
  'Site web',
  'Autre',
];

export const PC_CONCEPTS = ['Gaming', 'Normal'];
export const PC_TYPES = ['Desktop', 'Laptop'];

export type SupplierType = 'SOUK' | 'PARTICULIER';

export interface Supplier {
  id: string;
  type: SupplierType;
  name: string;
  phone?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = 'RESERVATION' | 'ACHAT' | 'NEGOCIATION';
export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'ANNULEE' | 'VENDU';

export interface Order {
  id: string;
  articleId: string;
  article: Article;
  quantity: number;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  notes?: string | null;
  clientId?: string | null;
  client?: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  retraitDeadline?: string | null;
  agreedPrice?: string | number | null;
  createdAt: string;
  updatedAt: string;
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

export interface Client {
  id: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  _count?: { orders: number };
}

export type NotificationType =
  | 'ACHAT_ARTICLE'
  | 'VENTE_ARTICLE'
  | 'CANAOUITE'
  | 'MASSROUF'
  | 'RENDEZ_VOUS';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  createdAt: string;
}

export type AppointmentType = 'ACHAT' | 'VENTE';

export interface Appointment {
  id: string;
  articleName: string;
  specs?: string | null;
  type: AppointmentType;
  reminderAt?: string | null;
  notified: boolean;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}
