import { QueryBuilder, Transaction } from "knex";
import { tpFilterQuery } from "../orderMail/tpMailOrders";
import doRelinkDomains from "./doRelinkDomains";
import knex from "../../base/database/cfgKnex";
import { getRelinkDomain, utGetSeqCharIdByIndex } from "../relinkOrders/srRelinkOrders";
import { Env } from "../../base/loaders/appLoader";
import { createSubDomainAndRedirection, getRedirectionByName, removeSubDomainAndRedirection } from "../ovh/srOvhApi";
import { stdLog, stdLogError } from "../../utils/logger";
import { DOMAIN_CREATE_ID_OFFSET } from "../gmail/data/dtConstants";
import MdRelinkDomains from "./mdRelinkDomains";
import { generateRandomPassword } from "../../utils/bcrypt";
import doCustomerProducts from "../customerProducts/doCustomerProducts";
import doCustomers from "../customers/doCustomers";
import doUser from "../user/doUser";
import doSku from "../sku/doSku";
import doParsingConditions from "../parsingConditions/doParsingConditions";
import MdParsingConditions from "../parsingConditions/mdParsingConditions";
import { formatSku } from "../../utils/sku";
import MdCustomers from "../customers/mdCustomers";
import { sendLoginDetToUser } from "../customers/srCustomer";
import { writeToGoogleSheets } from "../gmail/sheetsApi";

export const srGetUserCreatedBulkDomains = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const status = query.q as string
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doRelinkDomains.getAllUserCreatedDomains(trx, status);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");

    // added search on sku or thirdLvlDomain
    if (searchText) {
      qb = qb.where((builder) => {
        builder.where("sku", "ilike", `%${searchText}%`);
        builder.orWhere("thirdLvlDomain", "ilike", `%${searchText}%`);
      });
    }

    const list = await qb.limit(pageSize).offset(page * pageSize)
    const total = await qb.clearSelect()
      .clearOrder()
      .clearGroup()
      .offset(0)
      .limit(10)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total }
  } catch (e) {
    console.log("Error getting all domains:", e)
    throw new Error("Error getting domains");
  }
};

export const srCreateNewDomain = async (
  trx: Transaction, sku: string, createdBy: "system" | "user", landingType?: string
) => {
  let relDomain: MdRelinkDomains;
  const [skuMd] = await doSku.upsertMany(trx, { sku: formatSku(sku) }, ["sku"])
  const [domain] = await doRelinkDomains.insertOne(trx, {
    createdBy: createdBy,
    sku: skuMd.sku,
    redirectType: landingType,
    skuId: skuMd.id
  })
  if (domain && domain?.incrementalId) {
    const domainName = `ocddomain${utGetSeqCharIdByIndex(Number(domain?.incrementalId as number) + DOMAIN_CREATE_ID_OFFSET)}`;
    const redirect = landingType && landingType === "landing2" ?
      `${Env.landingPage2Url}?d=${domainName}` :
      `${Env.landingPage1Url}?d=${domainName}`
    const [updated] = await doRelinkDomains.updateOneByColName(trx, {
      thirdLvlDomain: domainName,
      redirectUrl: redirect,
      isActive: false
    }, "id", domain.id)
    relDomain = updated
  }
  return relDomain
}

export const srCreateBulkDomains = async (sku: string, num: number, landingType: string) => {
  try {
    let isSuccess = true;
    let domainsToWrite = []
    await Promise.all(Array.from({ length: num }, async () => {
      try {
        await knex.transaction(async (trx: Transaction) => {
          try {
            const relDomainMd = await srCreateNewDomain(trx, sku, "user", landingType);
            if (relDomainMd && relDomainMd?.thirdLvlDomain && relDomainMd?.redirectUrl) {
              const resp = await createSubDomainAndRedirection(
                Env.ovh.OVH_DOMAIN, relDomainMd.thirdLvlDomain, relDomainMd.redirectUrl
              )
              if (!resp || resp.status !== 'success') {
                isSuccess = false
                await trx.rollback();
              }
              domainsToWrite.push(relDomainMd)
            } else throw new Error("Something went wrong, try later")
          } catch (err) {
            stdLogError("Error in domain creation inner", err)
          }
        });
      } catch (e) {
        isSuccess = false
        stdLogError("Error in domain creation outer", e)
      }
    }))
    if (isSuccess) await writeToGoogleSheets(domainsToWrite)
    return isSuccess
  } catch (e) {
    console.log("Error creating domains:", e)
    throw new Error("Error in srCreateBulkDomains");
  }
};

export const srAutoCreateRandomDomainsForSku = async (
  trx: Transaction,
  sku: string,
  warehouseId: string
) => {
  try {
    const thresholdCond: MdParsingConditions = await doParsingConditions.findOneByPredicate(trx, {
      condType: "domainsAutoCreationThreshold",
      warehouseId: warehouseId
    })
    if (thresholdCond && thresholdCond?.condValue && Number(thresholdCond?.condValue)) {
      const thresholdVal = Number(thresholdCond?.condValue)
      const existingDomains = await doRelinkDomains.findAllByPredicate(trx, {
        isActive: false,
        sku: formatSku(sku),
        createdBy: "user",
        redirectType: "landing1"
      })
      if (existingDomains && existingDomains.length < thresholdVal) {
        const domainsToCreate: MdParsingConditions = await doParsingConditions.findOneByPredicate(trx, {
          condType: "numOfDomainsToAutoCreate",
          warehouseId: warehouseId
        })
        const numDomains = domainsToCreate ? Number(domainsToCreate?.condValue) : undefined
        if (numDomains && numDomains > 0) {
          stdLog(`Creating ${numDomains} auto random domains for sku: ${sku}`, "info")
          await srCreateBulkDomains(sku, numDomains, "landing1")
        }
      }
    }
  } catch (err) {
    stdLog("Error in creating auto random domains", "error")
    stdLogError(err)
  }
}

export const srDeleteRelinkDomain = async (domain: string) => {
  try {
    let isDltd = false;
    const getredirection = await getRedirectionByName(Env.ovh.OVH_DOMAIN, domain);
    if (getredirection.status === "success") {
      const Id = getredirection.response[0];
      if (Id) {
        const resp = await removeSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, Id)
        if (resp.status === "success") {
          isDltd = true
        }
      } else console.log("Domain redirection not found by ovh");
    }
    return isDltd
  } catch (e) {
    console.log("Error deleting domain ~ srDeleteRelinkDomain:", e)
  }
}

export const srCreateCustomerDataByLanding2 = async (
  { email, businessUrl, name, phone, businessUrlType }: { email: string, businessUrl: string, name: string, phone: string, businessUrlType: string },
  relDomainMd: MdRelinkDomains
) => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const [user] = await doUser.upsertMany(trx, {
        email, role: "customer", password: generateRandomPassword(), username: name, phone
      }, ["email"], { email: email })
      if (user && user?.id) {
        let customer: MdCustomers;
        const findCustomer = await doCustomers.findOneByCol(trx, "userId", user.id)
        if (!findCustomer) {
          const [newCustomer] = await doCustomers.insertOne(trx, {
            email, phone: phone ?? "", name, billingAddress: "", shippingAddress: "",
            userId: user.id, addedBy: "landing"
          })
          customer = newCustomer
        } else customer = findCustomer
        if (customer && customer?.id) {
          await doCustomerProducts.insertOne(trx, {
            productSku: relDomainMd?.sku, thirdLvlDomainId: relDomainMd?.id,
            customerId: customer.id, isPrimary: findCustomer && findCustomer?.id ? false : true,
            businessUrlType
          })
        }
      }
      await doRelinkDomains.updateOneByColName(trx, {
        redirectUrl: businessUrl, isActive: true,
      }, "id", relDomainMd.id);
      await sendLoginDetToUser(trx, user)
    })
  } catch (e) {
    stdLogError(e)
    throw new Error("Error in adding customer ~~ srCreateCustomerDataByLanding2")
  }
}

export const setProductRedirectionByDomain = async (
  domain: string,
  { email, businessUrl, name, phone, businessUrlType }: { email: string, businessUrl: string, name: string, phone: string, businessUrlType: string }
) => {
  let redirectUrl = ""
  try {
    const relDomain = await getRelinkDomain(domain)
    if (relDomain && relDomain?.isActive) {
      redirectUrl = "Product is already activated"
    }
    else {
      if (relDomain && relDomain?.sku) {
        const getredirection = await getRedirectionByName(Env.ovh.OVH_DOMAIN, domain);
        if (getredirection.status === "success" && businessUrl && businessUrl !== "") {
          const Id = getredirection.response[0];
          if (Id) {
            const resp = await removeSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, Id)
            if (resp.status === "success") {
              const finalresp = await createSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, domain, businessUrl)
              if (finalresp.status === "success") {
                redirectUrl = businessUrl
                await srCreateCustomerDataByLanding2({ email, name, businessUrl, phone, businessUrlType }, relDomain)
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

export const srGetAllSku = async (trx: Transaction, query: tpFilterQuery) => {
  try {
    const { page, pageSize, column, sort, searchText } = query;
    let qb: QueryBuilder<unknown[], unknown[]>;
    qb = doSku.getAll(trx);
    if (column && column !== "") {
      qb.orderBy(column, sort ?? "desc");
    } else qb.orderBy("created_at", "desc");

    // added search on sku 
    if (searchText) {
      qb = qb.where((builder) => {
        builder.where("sku", "ilike", `%${searchText}%`);
      });
    }

    const list = await qb.limit(pageSize).offset(page * pageSize)
    const total = await qb.clearSelect()
      .clearOrder()
      .clearGroup()
      .offset(0)
      .limit(10)
      .count()
      .first()
      .then((c: { count?: number }) => +(c?.count || 0));
    return { list, total }
  } catch (e) {
    console.log("Error getting all skus:", e)
    throw new Error("Error getting skus");
  }
};

export const srChangeDomainsLandingType = async (
  trx: Transaction,
  domainIds: string[],
  landingType: string
) => {
  try {
    await Promise.all(domainIds.map(async (domain) => {
      const findDomain = await doRelinkDomains.findOneByCol(trx, "id", domain)
      if (findDomain && !findDomain.isActive && findDomain.redirectType !== landingType) {
        stdLog(`Updating ${findDomain.thirdLvlDomain} to ${landingType}`, "info")
        const getredirection = await getRedirectionByName(Env.ovh.OVH_DOMAIN, findDomain.thirdLvlDomain);
        const businessUrl = landingType === "landing2" ?
          `${Env.landingPage2Url}?d=${findDomain.thirdLvlDomain}` :
          `${Env.landingPage1Url}?d=${findDomain.thirdLvlDomain}`
        if (getredirection.status === "success" && businessUrl && businessUrl !== "") {
          const Id = getredirection.response[0];
          if (Id) {
            const resp = await removeSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, Id)
            if (resp.status === "success") {
              const finalresp = await createSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, findDomain.thirdLvlDomain, businessUrl)
              if (finalresp.status === "success") {
                await doRelinkDomains.updateOneByColName(trx, {
                  redirectType: landingType,
                  redirectUrl: businessUrl,
                }, "id", findDomain.id)
              }
            }
          }
        }
      }
    }))
  } catch (err) {
    stdLogError("Error in srChangeDomainsLandingType", err)
    throw new Error("Error in updating landing type")
  }
}