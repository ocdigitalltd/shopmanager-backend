import axios from 'axios';
import OVH from 'ovh';
import { Env } from '../../base/loaders/appLoader';
import { stdLog } from '../../utils/logger';

const client = new OVH({
  endpoint: Env.ovh.OVH_API_ENDPOINT,
  appKey: Env.ovh.OVH_APP_KEY,
  appSecret: Env.ovh.OVH_APP_SECRET,
  consumerKey: Env.ovh.OVH_CONSUMER_KEY,
});

export const refreshZone = async (domain: string): Promise<{ status: string, response: string }> => {
  try {
    await client.requestPromised('POST', `/domain/zone/${domain}/refresh`);
    console.log('DNS zone refreshed successfully.')
    return {
      status: 'success',
      response: 'DNS zone refreshed successfully.',
    };
  } catch (error) {
    console.log("Domain refresh zone failed", error)
  }
}

export const createSubDomainAndRedirection = async (
  domain: string,
  thirdLevelDomain: string,
  domainRedirect: string
): Promise<{ status: string, response: string }> => {
  const dnsRecord = {
    type: "visiblePermanent",
    target: domainRedirect.trim(),
    subDomain: thirdLevelDomain.trim(),
  };
  try {
    stdLog(`    Creating domain ${thirdLevelDomain}.ocdbiz.cloud`, "warning")
    await client.requestPromised('POST', `/domain/zone/${domain}/redirection`, dnsRecord);
    await refreshZone(domain);
    return {
      status: 'success',
      response: 'DNS Record with redirection created successfully.',
    };
  } catch (error) {
    console.error('DNS Record creation error:', error);
    return {
      status: 'fail',
      response: JSON.stringify(error),
    };
  }
}

export const getRedirectionByName = async (
  domain: string,
  subDomain: string | null
): Promise<{ status: string, response: any }> => {
  try {
    const result = await client.requestPromised('GET', `/domain/zone/${domain}/redirection`, {
      subDomain: subDomain ?? null,
    });
    console.log('DNS Record redirection retrieval result:', result);

    return {
      status: 'success',
      response: result,
    };
  } catch (error) {
    console.error('DNS Record redirection retrieval error:', error);

    return {
      status: 'fail',
      response: JSON.stringify(error),
    };
  }
};

export const removeSubDomainAndRedirection = async (
  domain: string,
  Id: string
): Promise<{ status: string, response: string }> => {
  try {
    await client.requestPromised('DELETE', `/domain/zone/${domain}/redirection/${Id}`);
    await refreshZone(domain);
    return {
      status: 'success',
      response: 'Redirection removed and zone refreshed successfully.',
    };
  } catch (error) {
    console.error('Redirection removal resp:', error);
    if (error.error === 204 && error.message === null) {
      return {
        status: 'success',
        response: 'Redirection removed and zone refreshed successfully.',
      };
    } else {
      return {
        status: 'fail',
        response: 'Failed to remove subdomain and redirection',
      };
    }
  }
};

