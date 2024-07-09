import { QueryBuilder, Transaction } from "knex";
import { Env } from "../../base/loaders/appLoader";
import knex from "../../base/database/cfgKnex";
import { tpCustomerData } from "./tpCustomers";
import { generateRandomPassword } from "../../utils/bcrypt";
import doUser from "../user/doUser";
import doCustomers from "./doCustomers";
import { createSubDomainAndRedirection } from "../ovh/srOvhApi";
import doRelinkDomains from "../relinkDomains/doRelinkDomains";
import doCustomerProducts from "../customerProducts/doCustomerProducts";
import { getTransport, sendEmail } from "../shared/srEmailSender";
import { stdLog, stdLogError } from "../../utils/logger";
import { tpFilterQuery } from "../orderMail/tpMailOrders";
import MdCustomers from "./mdCustomers";
import { srDeleteCustomerProduct, srUpdateCustomerProduct } from "../customerProducts/srCustomerProducts";
import MdUser from "../user/mdUser";
import doSku from "../sku/doSku";
import { formatSku } from "../../utils/sku";
import { srSendUserLoginInfoViaWhatsapp } from "../user/srUser";

export const createDomainForCustomer = async (
  trx: Transaction, customerId: string, data: tpCustomerData, isPrimary: boolean = false
) => {
  const { redirectUrl, thirdLvlDomain, productSku, productName, businessUrlType, surfaceType } = data
  try {
    const [skuMd] = await doSku.upsertMany(trx, { sku: formatSku(productSku) ?? "NA" }, ["sku"])
    const [relDomainMd] = await doRelinkDomains.insertOne(trx, {
      createdBy: "system",
      sku: skuMd.sku,
      skuId: skuMd.id,
      thirdLvlDomain,
      redirectUrl,
      isActive: true
    })
    if (relDomainMd && relDomainMd?.thirdLvlDomain && relDomainMd?.redirectUrl) {
      const resp = await createSubDomainAndRedirection(
        Env.ovh.OVH_DOMAIN, relDomainMd.thirdLvlDomain, relDomainMd.redirectUrl
      )
      if (!resp || resp.status !== 'success') {
        await trx.rollback();
        return;
      }
      await doCustomerProducts.insertOne(trx, {
        productName, productSku, surfaceType, businessUrlType, thirdLvlDomainId: relDomainMd?.id,
        customerId, isPrimary
      })
    } else throw new Error("Something went wrong, try later")
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in adding customer data ~~ createDomainForCustomer")
  }
}

export const sendLoginDetToUser = async (trx: Transaction, user: MdUser) => {
  if (!user?.loginSent) {
    await srSendUserLoginInfoViaWhatsapp(trx, user, "create")
    if (user && user?.email && !user?.email.includes("dummy")) {
      const nodeMailTransport = getTransport()
      const emailResp = await sendEmail(
        nodeMailTransport,
        user.email,
        "Your credentials have been created successfully for .....",
        `here are your credentials, email: ${user.email}, password: ${user.password}`
      )
      if (emailResp) {
        stdLog(`Email sent to ${user.email}`, "info");
        await doUser.updateOneByColName(trx, { loginSent: true }, "id", user.id)
      }
    }
  }
}

export const createNewCustomer = async (data: tpCustomerData) => {
  try {
    const { email, name, shippingAddress, billingAddress, phone, aemail } = data
    await knex.transaction(async (trx: Transaction) => {
      const [user] = await doUser.upsertMany(trx, {
        email, role: "customer", password: generateRandomPassword(), username: name, phone
      }, ["email"], { email: email })
      if (user && user?.id) {
        let customer: MdCustomers;
        const findCustomer = await doCustomers.findOneByCol(trx, "userId", user.id)
        if (!findCustomer) {
          const [newCustomer] = await doCustomers.insertOne(trx, {
            email, phone, name, billingAddress, shippingAddress, userId: user.id, alternateEmail: aemail,
            addedBy: "user"
          })
          customer = newCustomer
        } else customer = findCustomer
        if (customer && customer?.id) {
          await createDomainForCustomer(trx, customer.id, data, findCustomer ? false : true)
        }
      }
      await sendLoginDetToUser(trx, user)
    })
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in adding customer ~~ createNewCustomer")
  }
}

export const srGetAllCustomers = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doCustomers.getAllCustomers(trx);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");

    // added search on name
    if (searchText) {
      qb = qb.where((builder) => {
        builder.where("name", "ilike", `%${searchText}%`);
      });
    }

    const list = await qb.limit(pageSize).offset(page * pageSize);
    const total = await qb
      .clearSelect()
      .clearOrder()
      .clearGroup()
      .offset(0)
      .limit(10)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total };
  } catch (e) {
    console.log("Error getting all customers:", e)
    throw new Error("Error getting customers");
  }
};

export const srDeleteCustomer = async (trx: Transaction, findCustomer: MdCustomers) => {
  try {
    const products = await doCustomerProducts.findAllByCol(trx, "customerId", findCustomer.id)
    await Promise.all(products.map(async (prod) => {
      await srDeleteCustomerProduct(trx, prod.id)
    }))
    const userId = findCustomer.userId
    await doCustomers.deleteOneByCol(trx, "id", findCustomer.id)
    await doUser.deleteOneByCol(trx, "id", userId)
  } catch (e) {
    console.log("~srDeleteCustomer:", e)
    throw new Error("Error deleting customer")
  }
}

const srUpdateUserData = async (
  trx: Transaction,
  existingCustomer: MdCustomers,
  data: tpCustomerData
) => {
  try {
    const { email, name, password, phone } = data
    const userData = password ? {
      email, username: name, password, phone
    } : { email, username: name, phone }
    const existingUser = await doUser.findOneByCol(trx, "id", existingCustomer.userId)
    if (existingUser) {
      const [updated] = await doUser.updateOneByColName(trx, userData, "id", existingCustomer.userId)
      if (existingUser.email !== email || existingUser.password !== password) {
        await srSendUserLoginInfoViaWhatsapp(trx, updated, "update")
        const nodeMailTransport = getTransport()
        const emailResp = await sendEmail(
          nodeMailTransport,
          email,
          "Your credentials have been updated successfully for .....",
          `here are your new credentials, email: ${email}, password: ${password}`
        )
        if (emailResp) stdLog(`Email sent to ${email}`, "info")
      }
    }
  } catch (e) {
    console.log("~srUpdateUserData:", e)
    throw new Error("Error updating user data")
  }
}

export const srUpdateCustomerData = async (
  trx: Transaction,
  existingCustomer: MdCustomers,
  data: tpCustomerData
) => {
  try {
    const { email, name, shippingAddress, billingAddress, productSku,
      phone, aemail, redirectUrl, thirdLvlDomain, productName,
      surfaceType, businessUrlType
    } = data
    await doCustomers.updateOneByColName(trx, {
      name, shippingAddress, billingAddress, phone, email, alternateEmail: aemail
    }, "id", existingCustomer.id)
    const findProduct = await doCustomerProducts.findOneByPredicate(trx, {
      customerId: existingCustomer.id,
      isPrimary: true
    })
    if (findProduct && findProduct?.thirdLvlDomainId) {
      const domainData = await doRelinkDomains.findOneByCol(trx, "id", findProduct.thirdLvlDomainId)
      if (domainData &&
        (domainData?.redirectUrl !== redirectUrl || domainData?.thirdLvlDomain !== thirdLvlDomain)
      ) {
        await srUpdateCustomerProduct(trx, findProduct, domainData, data)
      } else {
        await doRelinkDomains.updateOneByColName(trx, { sku: formatSku(productSku) }, "id", domainData.id)
        await doCustomerProducts.updateOneByColName(trx, {
          productName, productSku: formatSku(productSku), surfaceType, businessUrlType
        }, "id", findProduct.id)
      }
    }
    await srUpdateUserData(trx, existingCustomer, data)
  } catch (e) {
    console.log("~srUpdateCustomerData:", e)
    throw new Error("Error updating customer data")
  }
}