import { QueryBuilder, Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import { tpRelinkOrder, tpRelinkOrderData, tpRelinkOrderStatus } from "./tpRelinkOrders";
import doRelinkOrders from "./doRelinkOrders";
import doOrderProducts from "./orderProducts/doOrderProducts";
import { tpFilterQuery } from "../orderMail/tpMailOrders";
import MdRelinkOrders from "./mdRelinkOrders";
import { createSubDomainAndRedirection, getRedirectionByName, removeSubDomainAndRedirection } from "../ovh/srOvhApi";
import { Env } from "../../base/loaders/appLoader";
import { srSendNonItalianEmailToWarehouse, srSendItalianEmailToWarehouse } from "../../utils/relinkEmailSending";
import { stdLog } from "../../utils/logger";
import MdOrderProducts from "./orderProducts/mdOrderProducts";
import { srAutoCreateRandomDomainsForSku, srCreateNewDomain } from "../relinkDomains/srRelinkDomains";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";
import doRelinkDomains from "../relinkDomains/doRelinkDomains";
import doCustomers from "../customers/doCustomers";
import doUser from "../user/doUser";
import { generateRandomPassword } from "../../utils/bcrypt";
import { sendLoginDetToUser } from "../customers/srCustomer";
import MdCustomers from "../customers/mdCustomers";
import { formatSku } from "../../utils/sku";

const CHAR_LIST_TO_GENERATE_IDS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j",
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t",
  "u", "v", "w", "x", "y", "z", "0", "1", "2", "3",
  "4", "5", "6", "7", "8", "9"
];

export const utGetSeqCharIdByIndex = (index: number): string => {
  if (index <= 0) return "";
  const len = CHAR_LIST_TO_GENERATE_IDS.length;
  let num = index - 1;
  let id = "";

  while (num >= 0) {
    id = CHAR_LIST_TO_GENERATE_IDS[num % len] + id;
    num = Math.floor(num / len) - 1;
  }
  return id;
};

export const srAddNewRelinkOrder = async (orderData: tpRelinkOrder, usingSheets: boolean = false) => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const {
        phone, email, shippingAddress, billingAddress, isItalianAddress,
        customerName, orderNum, orderSummary, gmailMsgId, products
      } = orderData;

      const orderExists = await doRelinkOrders.findOneByPredicate(trx, {
        // gmailMsgId,
        orderNum: Number(orderNum.replace(/[^0-9]/g, "")),
      });
      if (orderExists || products.length === 0) {
        return;
      } else {
        const [user] = await doUser.upsertMany(trx, {
          email: email ?? `dummy-${orderNum}`, role: "customer",
          password: generateRandomPassword(), username: customerName ?? "",
          phone
        }, ["email"], { email: email ?? `dummy-${orderNum}` })
        let customer: MdCustomers;
        const findCustomer = await doCustomers.findOneByCol(trx, "userId", user.id)
        if (!findCustomer) {
          const [newCustomer] = await doCustomers.insertOne(trx, {
            email, phone, name: customerName, billingAddress, shippingAddress, userId: user.id,
            addedBy: "parsing"
          })
          customer = newCustomer
        } else customer = findCustomer
        if (customer && customer?.id) {
          const [newOrder] = await doRelinkOrders.upsertOne(trx, {
            gmailMsgId,
            customerId: customer?.id,
            orderNum: Number(orderNum.replace(/[^0-9]/g, "")),
            orderStatus: "new",
            orderTotal: orderSummary.orderTotal,
            isItalian: isItalianAddress ?? false,
            warehouseEmail: orderData.warehouseEmail,
            warehouseId: orderData.warehouseId
          }, ["orderNum"]);
          if (newOrder && newOrder.id) {
            for (let idx = 0; idx < products.length; idx += 1) {
              const product = products[idx]
              if (
                product.businessUrl && product.businessUrl?.url && product.businessUrl.url !== ""
              ) {
                const sku = usingSheets ? product.sku : product.name.match(/\(([^)]+)\)/)[1]?.replace("#", "")?.trim()
                if (isItalianAddress && sku && orderData.warehouseId && sku !== "" && orderData.warehouseId !== "") {
                  await srAutoCreateRandomDomainsForSku(trx, product.sku, orderData.warehouseId)
                }
                const domainId = isItalianAddress ? null : (await srCreateNewDomain(trx, sku, "system"))?.id;
                const quantity = Number(product.quantity) ?? 1
                await Promise.all(Array.from({ length: quantity }, async () => {
                  await doOrderProducts.insertOne(trx, {
                    relinkOrderId: newOrder.id,
                    productName: product.name?.split("(")[0],
                    productSize: product.prodSize,
                    productSku: formatSku(sku),
                    productQuantity: product.quantity,
                    productPrice: product.price,
                    surfaceType: product.surfaceType,
                    businessUrl: product.businessUrl.url,
                    businessUrlType: product.businessUrl.type,
                    thirdLvlDomainId: domainId
                  })
                }));
              }
            }
          }
        }
        console.log("~~ Relink ", orderNum, " added to database");
      }
    });
  } catch (error) {
    console.error("Error adding new order:", error);
  }
};

export const srMarkRelinkOrderStatus = async (id: string, status: tpRelinkOrderStatus, productId?: string) => {
  await knex.transaction(async (trx: Transaction) => {
    await doRelinkOrders.updateOneByPredicate(
      trx,
      {
        orderStatus: status,
      },
      { id: id }
    );
    if (productId) {
      await doOrderProducts.updateOneByColName(trx, { isDomainCreated: true }, "id", productId)
    }
  });
};

export const srGetOrdersToProcessByStatus = async (status: tpRelinkOrderStatus) => {
  return await knex.transaction(async (trx: Transaction) => {
    const newOrders = await doRelinkOrders.getAllOrdersWithProducts(trx, status);
    if (newOrders.length > 0) {
      return newOrders as tpRelinkOrderData[];
    } else {
      return [];
    }
  });
};

export const srProcessOrdersForDomainCreation = async () => {
  try {
    const allNewOrders = await srGetOrdersToProcessByStatus("new");
    const nonItalianOrders = allNewOrders.filter(order => (order.isItalian === false))
    stdLog(`  * Found ${nonItalianOrders.length} new orders for domain creation`, "info")
    for (let idx = 0; idx < nonItalianOrders.length; idx += 1) {
      const order = nonItalianOrders[idx]
      const products = order.products.filter(prod => (prod.thirdLvlDomain && prod.thirdLvlDomain?.length > 0))
      await Promise.all(products.map(async (product) => {
        try {
          const redirection = product.redirectUrl
          const resp = await createSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, product.thirdLvlDomain, redirection)
          if (resp && resp.status === 'success') {
            await srMarkRelinkOrderStatus(order.id, "domain-created", product.productId);
          } else { await srMarkRelinkOrderStatus(order.id, "domain-creation-failed") }
        } catch (err) {
          console.log(`Error in domain creation for ${nonItalianOrders[idx].orderNum} ${product.thirdLvlDomain}:`, err)
        }
      }))
    }
  } catch (e) {
    console.log("Error in srProcessOrdersForDomainCreation", e)
  }
}

export const srGetAllRelinkOrders = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const status = query.q as tpRelinkOrderStatus
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doRelinkOrders.getAllOrdersWithProducts(trx, status);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");

    // added search on customerName or orderId
    if (searchText) {
      qb = qb.where((builder) => {
        builder.whereRaw(`CAST(ro."orderNum" AS TEXT) ilike ?`, [`%${searchText}%`]);
        builder.orWhere("cu.name", "ilike", `%${searchText}%`);
      });
    }
    const list = await qb.limit(pageSize).offset(page * pageSize)
    const total = await trx(MdRelinkOrders.TABLE_NAME)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total }
  } catch (e) {
    console.log("Error getting all orders:", e)
    throw new Error("Error getting orders");
  }
};

export const srProcessRelinkOrders = async (): Promise<void> => {
  try {
    stdLog("2. Relink emails ~~ domain creation process completed", "success")
    await srSendItalianEmailToWarehouse();
    await srSendNonItalianEmailToWarehouse();
    stdLog("3. Relink emails ~~ warehouse sending process completed", "success")
  } catch (e) {
    stdLog("~~ Error in srProcessRelinkOrders", "error")
    console.error("Error processing order:", e);
  }
};

// // Define a cron job to run the triggerMessageSendingProcessing function every 7 hours
// cron.schedule(`*/${Env.CRON_RELINK_SHOP_ORDER_PROCESSING} * * * *`, () => {
//   if (Env.START_RELINK_SHOP_ORDER_PROCESSING) {
//     console.log("Starting Relink shop orders cron job")
//     srProcessRelinkOrders();
//   }
// });

export const getRelinkDomain = async (domain: string) => {
  let relDomain: MdRelinkDomains;
  await knex.transaction(async (trx: Transaction) => {
    relDomain = await doRelinkDomains.findOneByCol(trx, "thirdLvlDomain", domain?.trim())
  });
  return relDomain
}

const getProductDataByOrderNum = async (orderNum: string, sku: string) => {
  let relProd: MdOrderProducts;
  await knex.transaction(async (trx: Transaction) => {
    const order: MdRelinkOrders = await doRelinkOrders.findOneByCol(trx, "orderNum", Number(orderNum))
    if (order && order?.id) {
      const product: MdOrderProducts = await doOrderProducts.findOneByPredicate(trx, {
        relinkOrderId: order.id,
        productSku: formatSku(sku),
        thirdLvlDomainId: null,
        isDomainCreated: false
      })
      relProd = product
      await trx.commit()
    }
  });
  return relProd
}

const srUpdateThirdLvlDomainAndCreatedStatus = async (relProduct: MdOrderProducts, domain: MdRelinkDomains) => {
  await knex.transaction(async (trx: Transaction) => {
    const [updated] = await doRelinkOrders.updateOneByColName(trx, {
      orderStatus: "active"
    }, "id", relProduct.relinkOrderId)
    await doOrderProducts.updateOneByColName(trx, {
      isDomainCreated: true,
      thirdLvlDomainId: domain.id,
    }, "id", relProduct.id)
    await doRelinkDomains.updateOneByColName(trx, {
      redirectUrl: relProduct.businessUrl, isActive: true
    }, "id", domain.id)
    const customer: MdCustomers = await doCustomers.findOneByCol(trx, "id", updated?.customerId)
    if (customer && customer?.userId) {
      const user = await doUser.findOneByCol(trx, "id", customer?.userId)
      await sendLoginDetToUser(trx, user)
    }
    await trx.commit()
  });
};

export const updateProductRedirectionByDomain = async (domain: string, orderNum: string) => {
  let redirectUrl = ""
  try {
    const relDomain = await getRelinkDomain(domain)
    if (relDomain && relDomain?.isActive) {
      redirectUrl = "Product is already activated"
    }
    else {
      if (relDomain && relDomain?.sku) {
        const relProduct = await getProductDataByOrderNum(orderNum, relDomain?.sku)
        if (!relProduct) {
          redirectUrl = "Product is already activated"
          return redirectUrl
        }
        const getredirection = await getRedirectionByName(Env.ovh.OVH_DOMAIN, domain);
        const businessUrl = relProduct ? relProduct?.businessUrl : undefined
        if (getredirection.status === "success" && businessUrl && businessUrl !== "") {
          const Id = getredirection.response[0];
          if (Id) {
            const resp = await removeSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, Id)
            if (resp.status === "success") {
              const finalresp = await createSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, domain, businessUrl)
              if (finalresp.status === "success") {
                redirectUrl = businessUrl
                await srUpdateThirdLvlDomainAndCreatedStatus(relProduct, relDomain)
              }
            }
          }
        } else return "Invalid Request"
      }
    }
  } catch (e) {
    console.log("Error in updateRedirectionByDomain ~~~~", e)
  }
  return redirectUrl
}