import { QueryBuilder, Transaction } from "knex";
import { tpFilterQuery } from "../orderMail/tpMailOrders";
import doCustomerProducts from "./doCustomerProducts";
import doRelinkDomains from "../relinkDomains/doRelinkDomains";
import { srDeleteRelinkDomain } from "../relinkDomains/srRelinkDomains";
import MdCustomerProducts from "./mdCustomerProducts";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";
import { tpCustomerData } from "../customers/tpCustomers";
import { Env } from "../../base/loaders/appLoader";
import { createSubDomainAndRedirection } from "../ovh/srOvhApi";
import { formatSku } from "../../utils/sku";
import doOrderProducts from "../relinkOrders/orderProducts/doOrderProducts";
import doMisprintedCards from "../misprintedCards/doMisprintedCards";

export const srGetCustomerProductsById = async (trx: Transaction, id: string, query: tpFilterQuery) => {
  try {
    const { page, pageSize, column, sort } = query
    let qb: QueryBuilder<unknown[], unknown[]>;
    const qb1 = doOrderProducts.getOrderProductsByCustomerId(trx, id)
    const qb2 = doCustomerProducts.getCustomerProductsById(trx, id);
    qb = qb1.union(qb2)

    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");
    const list = await qb.limit(pageSize).offset(page * pageSize)
    const total = list.length
    return { list, total }
  } catch (e) {
    console.log("Error getting srGetCustomerProductsById:", e)
    throw new Error("Error getting customer products");
  }
}

export const srDeleteCustomerProduct = async (trx: Transaction, id: string) => {
  try {
    let isSuccess = false
    const findProduct = await doCustomerProducts.findOneByCol(trx, "id", id)
    if (findProduct && findProduct.thirdLvlDomainId) {
      const domain = await doRelinkDomains.findOneByCol(trx, "id", findProduct.thirdLvlDomainId)
      if (domain && domain.thirdLvlDomain) {
        const isMisprinted = await doMisprintedCards.findOneByCol(trx, "domain", domain.thirdLvlDomain)
        const deleted = isMisprinted && isMisprinted?.id ? true : await srDeleteRelinkDomain(domain.thirdLvlDomain)
        if (deleted) {
          await doCustomerProducts.deleteOneByCol(trx, "id", findProduct.id)
          isSuccess = true
        }
      }
    }
    return isSuccess
  } catch (e) {
    throw new Error("Error deleting customer product");
  }
}

export const srUpdateCustomerProduct = async (
  trx: Transaction, product: MdCustomerProducts, domain: MdRelinkDomains,
  data: tpCustomerData
) => {
  try {
    const {
      redirectUrl, thirdLvlDomain, productName, productSku, surfaceType, businessUrlType
    } = data;
    const isMisprinted = await doMisprintedCards.findOneByCol(trx, "domain", domain.thirdLvlDomain)
    const deleted = isMisprinted && isMisprinted?.id ? true : await srDeleteRelinkDomain(domain.thirdLvlDomain)
    if (deleted && thirdLvlDomain && redirectUrl) {
      const resp = await createSubDomainAndRedirection(
        Env.ovh.OVH_DOMAIN, thirdLvlDomain, redirectUrl
      )
      if (resp && resp.status === 'success') {
        await doRelinkDomains.updateOneByColName(trx, {
          redirectUrl, thirdLvlDomain, sku: formatSku(productSku)
        }, "id", domain.id)
        await doCustomerProducts.updateOneByColName(trx, {
          productName, productSku: formatSku(productSku), surfaceType, businessUrlType
        }, "id", product.id)
      } else {
        await trx.rollback()
        throw new Error("Something went wrong in updating OVH data")
      }
    } else throw new Error("Something went wrong, try later")
  } catch (e) {
    console.log("srUpdateCustomerProduct", e)
    throw new Error("Error updating customer domain data")
  }
}