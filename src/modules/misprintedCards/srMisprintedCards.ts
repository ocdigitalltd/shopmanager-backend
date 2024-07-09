import { Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import doMisprintedCards from "./doMisprintedCards";
import AppConfigs from "../../base/configs/appConfigs";
import { stdLog, stdLogError } from "../../utils/logger";
import { getRelinkDomain } from "../relinkOrders/srRelinkOrders";
import { createSubDomainAndRedirection, getRedirectionByName, removeSubDomainAndRedirection } from "../ovh/srOvhApi";
import { Env } from "../../base/loaders/appLoader";
import { srCreateCustomerDataByLanding2 } from "../relinkDomains/srRelinkDomains";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";
import doRelinkDomains from "../relinkDomains/doRelinkDomains";

export const getMisPrintedDomainInfo = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { domain } = req.params;
      if (AppConfigs.misprintedDomainsData[domain]) {
        return res.send({ domain: { domain, businessurl: AppConfigs.misprintedDomainsData[domain] } });
      } else {
        const info = domain ? await doMisprintedCards.findOneByPredicate(trx, { domain: domain }) : undefined;
        if (info && info?.status === "active") {
          if (info.businessurl) AppConfigs.misprintedDomainsData[domain] = info.businessurl
          console.log("here---", AppConfigs.misprintedDomainsData)
          return res.send({ domain: info });
        }
      }
      return res.status(404).send({ message: "Domain not found" });
    });
  } catch (e) {
    next(e);
  }
};

export const initializeDomainsInfoInMemory = async ()
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const info = await doMisprintedCards.getAll(trx).whereNotNull("businessurl");
      if (info && info?.length) {
        info.map(domain => AppConfigs.misprintedDomainsData[domain.domain] = domain.businessurl)
      }
      stdLog("Initialized in-memory domains data", "success");
      console.log(AppConfigs.misprintedDomainsData)
    });
  } catch (e) {
    console.log("Error in initializing in-memory data");
  }
};

export const getAllMisprintedDomainsInfo = async (req, res, next)
  : Promise<void> => {
  try {
    if (Object.keys(AppConfigs.misprintedDomainsData)?.length > 0) {
      return res.send({ data: AppConfigs.misprintedDomainsData })
    } else {
      await knex.transaction(async (trx: Transaction) => {
        let cache = {}
        const info = await doMisprintedCards.getAll(trx);
        info.forEach(mapping => {
          cache[mapping.domain] = mapping.businessurl;
        });
        return res.send({ data: cache });
      });
    }
  } catch (e) {
    next(e);
  }
}

const setMisPrintedProductRedirectionByDomain = async (
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
              console.log("domain removed from ovh", relDomain.thirdLvlDomain)
            }
          }
        }
        await knex.transaction(async (trx: Transaction) => {
          await doMisprintedCards.upsertMany(trx, {
            domain: relDomain?.thirdLvlDomain,
            businessurl: businessUrl,
            status: "active"
          }, ["domain"])
          AppConfigs.misprintedDomainsData[domain] = businessUrl
        })
        redirectUrl = businessUrl
        await srCreateCustomerDataByLanding2({ email, name, businessUrl, phone, businessUrlType }, relDomain)
      }
    }
  } catch (e) {
    console.log("Error in setMisPrintedProductRedirectionByDomain ~~~~", e)
  }
  return redirectUrl
}

export const updateMisprintedRedirectionByLanding2 = async (req, res, next)
  : Promise<void> => {
  try {
    const { domain, name, email, businessUrl, phone, businessUrlType } = req.body
    if (domain && email && businessUrl && name) {
      const redirect = await setMisPrintedProductRedirectionByDomain(req.body.domain, { name, email, businessUrl, phone, businessUrlType })
      if (redirect && redirect.startsWith("http")) {
        res.send({ url: redirect })
      } else if (redirect && redirect !== "") {
        res.send({ url: redirect })
      } else res.status(404).send("No record found")
    }
    else throw new Error("Invalid request")
  } catch (e) {
    next(e);
  }
};

const srFetchDomainsToUpdate = async (processLimit: number): Promise<MdRelinkDomains[] | undefined> => {
  let domains: MdRelinkDomains[] | undefined;
  try {
    await knex.transaction(async (trx: Transaction) => {
      domains = await doRelinkDomains
        .getAll(trx).where(MdRelinkDomains.col("isActive", false), false)
        .where(MdRelinkDomains.col("createdBy", false), "user")
        .where(MdRelinkDomains.col("isFixed", false), false)
        .andWhereRaw(`"${MdRelinkDomains.col("redirectUrl", false)}" like '%shop-manager.schedy.app%'`) as MdRelinkDomains[];
      stdLog(`Fetched ${domains.length} domains`, "info");
      await trx.commit();
    });
  } catch (error) {
    stdLogError(error);
  }
  return domains;
};

export const fixExistingDomainsLandingUrls = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 60000));
    const processLimit = 10;
    let processing = true;
    while (processing) {
      const domainsToUpdate = await srFetchDomainsToUpdate(processLimit);
      if (!domainsToUpdate || domainsToUpdate.length === 0) {
        processing = false;
        stdLog("No more domains found. Updated All.", "info");
      } else {
        await Promise.all(domainsToUpdate.map(async (domain, index) => {
          try {
            const newRedirect = domain?.redirectType === "landing1" ? `${Env.landingPage1Url}?d=${domain.thirdLvlDomain}` : `${Env.landingPage2Url}?d=${domain.thirdLvlDomain}`
            const getredirection = await getRedirectionByName(Env.ovh.OVH_DOMAIN, domain.thirdLvlDomain);
            if (getredirection.status === "success") {
              const Id = getredirection.response[0];
              if (Id) {
                const resp = await removeSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, Id)
                if (resp.status === "success") {
                  const finalresp = await createSubDomainAndRedirection(Env.ovh.OVH_DOMAIN, domain.thirdLvlDomain, newRedirect)
                  if (finalresp.status === "success") {
                    await knex.transaction(async (trx: Transaction) => {
                      await doRelinkDomains.updateOneByColName(trx, {
                        redirectUrl: newRedirect,
                        isFixed: true,
                      }, "id", domain.id as string);
                      stdLog(`${index} | ${domain.redirectUrl} | ${newRedirect}`, "success");
                      await trx.commit();
                    });
                  }
                } else stdLog(`${index} | ${domain.thirdLvlDomain} | Error in removing redirection `, "warning");
              }
            } else stdLog(`${index} | ${domain.thirdLvlDomain} | Error in finding redirection `, "warning");
          } catch (e) { stdLogError(e as unknown as string); }
        }));
      };
    }
  } catch (err) {
    stdLogError(err);
  }
}