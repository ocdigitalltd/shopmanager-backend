export type tpRelinkOrderSummary = {
  subtotal?: string;
  shipping?: string;
  paymentMethod?: string;
  orderTotal?: string;
};
export type tpRelinkProductData = {
  name?: string;
  prodSize?: string;
  surfaceType?: string;
  businessUrl?: { type: string, url: string };
  quantity?: string;
  price?: string;
  sku?: string
};

export type tpRelinkOrder = {
  gmailMsgId: string;
  orderUrl?: string;
  phone: string;
  email: string;
  shippingAddress: string;
  shippingCountry?: string;
  isItalianAddress: boolean;
  billingAddress: string;
  customerName: string;
  orderNum: string;
  orderSummary: tpRelinkOrderSummary;
  products: tpRelinkProductData[];
  warehouseEmail?: string;
  warehouseId?: string;
}
export const relinkOrderStatusListOld = [
  "new", "domain-created", "domain-creation-failed", "sent-for-shipping", "email-send-fail", "failed",
  "active"
] as const;
export const relinkOrderStatusList = [
  "new", "domain-created", "domain-creation-failed", "sent-for-shipping", "email-send-fail", "failed",
  "active", "whatsapp-send-fail"
] as const;
export type tpRelinkOrderStatus = typeof relinkOrderStatusList[number];


export interface tpRelinkProduct {
  productId: string;
  sku:string;
  productName: string;
  productSize: string;
  surfaceType: string;
  productQuantity: number;
  productPrice: string;
  redirectUrlType: string;
  redirectUrl: string;
  thirdLvlDomain: string;
  isDomainCreated: boolean
}

export interface tpRelinkOrderData {
  id: string;
  orderNum: number;
  customerName: string;
  orderTotal: number;
  phone: string;
  email: string;
  billingAddress: string;
  shippingAddress: string;
  isItalian: boolean;
  orderStatus: 'new' | 'domain-created' | 'sent-for-shipping';
  products: tpRelinkProduct[];
  created_at: string;
  updated_at: string;
  whEmail: string;
  whPhone: string;
  whId: string
}