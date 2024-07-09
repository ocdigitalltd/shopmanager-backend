interface tpOrderInfo {
  title: string;
  value: string;
}

interface tpOrderDetails {
  name: string;
  price: string;
  sku: string;
  orderInfo: tpOrderInfo[];
}

export interface tpOrder {
  gmailMsgId: string;
  mailSubject: string;
  name: string;
  orderNumber: string;
  phone: string;
  address: string;
  isValidAddress: boolean;
  orderDetails: tpOrderDetails;
  shopId?: string
}

export type tpFilterQuery = {
  q: string;
  page: number;
  pageSize: number;
  sort: "asc" | "desc";
  column: string;
  searchText?: string;
};

export const enumOrderStatusListDep = ["new", "pending", "sent", "failed"] as const;
export const enumOrderStatusList = ["new", "pending", "sent", "whatsapp-check-fail", "sms-check-fail","failed"] as const;
export type enumOrderStatus = typeof enumOrderStatusList[number];