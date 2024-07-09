import { Transaction } from "knex";
import knex from "../../base/database/cfgKnex";
import { srGetAllRelinkOrders, updateProductRedirectionByDomain } from "./srRelinkOrders";
import { setProductRedirectionByDomain, srChangeDomainsLandingType, srCreateBulkDomains, srDeleteRelinkDomain, srGetAllSku, srGetUserCreatedBulkDomains } from "../relinkDomains/srRelinkDomains";
import doSku from "../sku/doSku";
import doRelinkDomains from "../relinkDomains/doRelinkDomains";
import { removeSubDomainAndRedirection } from "../ovh/srOvhApi";
import doMisprintedCards from "../misprintedCards/doMisprintedCards";

export const getAllRelinkOrders = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetAllRelinkOrders(trx, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};


export const updateRelinkCardRedirection = async (req, res, next)
  : Promise<void> => {
  try {
    const { orderNum, domain } = req.body
    if (orderNum && domain) {
      const redirect = await updateProductRedirectionByDomain(req.body.domain, orderNum)
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

export const getAllBulkDomains = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetUserCreatedBulkDomains(trx, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};

export const createBulkDomains = async (req, res, next)
  : Promise<void> => {
  try {
    const { numOfDomains, sku, redirectType } = req.body;
    if (numOfDomains && Number(numOfDomains) > 0 && sku && sku?.length > 0) {
      const isSuccess = await srCreateBulkDomains(sku, numOfDomains, redirectType);
      if (isSuccess) return res.send({ message: "Domains created successfully" });
      else return res.status(404).send({ message: "Could not create bulk domains" });
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (e) {
    next(e);
  }
};

export const updateRelinkRedirectionByLanding2 = async (req, res, next)
  : Promise<void> => {
  try {
    const { domain, name, email, businessUrl, phone, businessUrlType } = req.body
    if (domain && email && businessUrl && name) {
      const redirect = await setProductRedirectionByDomain(req.body.domain, { name, email, businessUrl, phone, businessUrlType })
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

export const addNewSku = async (req, res, next)
  : Promise<void> => {
  try {
    const { sku } = req.body;
    if (sku && sku?.length > 0) {
      await knex.transaction(async (trx: Transaction) => {
        const [isSuccess] = await doSku.upsertOne(trx, { sku }, ["sku"])
        if (isSuccess) return res.send({ message: "SKU added successfully" });
        else return res.status(404).send({ message: "Could not add sku" });
      })
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (e) {
    next(e);
  }
};

export const deleteSku = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params;
    if (id) {
      await knex.transaction(async (trx: Transaction) => {
        const records = await doRelinkDomains.findOneByCol(trx, "skuId", id)
        if (records && records?.id) return res.status(404).send({ message: "Cannot delete. Sku has related records." });
        await doSku.deleteOneByCol(trx, "id", id)
        res.send({ message: "SKU removed successfully" });
      })
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (e) {
    next(e);
  }
};

export const getAllSkus = async (req, res, next)
  : Promise<void> => {
  try {
    await knex.transaction(async (trx: Transaction) => {
      const { list, total } = await srGetAllSku(trx, req.query);
      if (list) {
        return res.send({ list, total });
      }
      return res.send({ list: [], total: 0 });
    });
  } catch (e) {
    next(e);
  }
};

export const deleteRelinkDomainById = async (req, res, next)
  : Promise<void> => {
  try {
    const { id } = req.params;
    if (id) {
      await knex.transaction(async (trx: Transaction) => {
        const findDomain = await doRelinkDomains.findOneByCol(trx, "id", id)
        if (findDomain && !findDomain?.isActive) {
          await doRelinkDomains.deleteOneByCol(trx, "id", id)
          const isMisprinted = await doMisprintedCards.findOneByCol(trx, "domain", findDomain.thirdLvlDomain)
          const removeRedirection = isMisprinted && isMisprinted?.id ? true : await srDeleteRelinkDomain(findDomain.thirdLvlDomain)
          if (!removeRedirection) {
            await trx.rollback();
            res.status(500).send({ message: "Something went wrong." });
          } else res.send({ message: "Domain removed successfully" });
        }
        else return res.status(404).send({ message: "Domain is used, cannot delete." });
      })
    } else res.status(404).send({ message: "Invalid data provided" });
  } catch (e) {
    next(e);
  }
};

export const updateDomainsLandingType = async (req, res, next): Promise<void> => {
  try {
    const { landingType, domainIds } = req.body
    if (landingType && ["landing1", "landing2"].includes(landingType) && domainIds && domainIds.length > 0) {
      await knex.transaction(async (trx: Transaction) => {
        await srChangeDomainsLandingType(trx, domainIds, landingType)
        res.send({ message: "Data updated successfully" });
      })
    }
    else throw new Error("Invalid request")
  } catch (e) {
    next(e);
  }
}