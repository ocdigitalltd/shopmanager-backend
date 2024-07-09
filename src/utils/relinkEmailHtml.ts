import puppeteer, { ElementHandle, Page } from "puppeteer";
import { tpRelinkProductData, tpRelinkOrderSummary, tpRelinkOrder } from "../modules/relinkOrders/tpRelinkOrders";
import { WarehouseSetting } from "../modules/warehouseSetup/srWarehouseSetup";

const getOrderDetails = async (bodyElem: ElementHandle<Element>) => {
  let customerName = "";
  let orderNum = ""
  let products: tpRelinkProductData[] = [];
  let orderSummary: tpRelinkOrderSummary = {};
  // title / name info
  const nameInfo = await bodyElem.$('p')
  const nameText = await nameInfo?.evaluate((node) => node.innerText);
  if (nameText && nameText.includes('order from')) {
    customerName = nameText.split('order from')[1]?.replace(":", "")?.trim();
  }
  const orderInfo = await bodyElem.$('h2 a')
  const orderText = await orderInfo?.evaluate((node) => node.innerText)
  if (orderText) {
    orderNum = orderText.replace('[', "").replace("]", "").trim()
  }

  // order items data
  const orderItems = await bodyElem.$$('table .order_item')
  products = await Promise.all(orderItems.map(async (productInfo) => {
    let productData: tpRelinkProductData = {}
    const orderItem = await productInfo.$$('td')
    if (orderItem && orderItem.length > 0) {
      const product = await orderItem[0].$('div')
      if (product) {
        productData['name'] = await product.evaluate((node) => node.innerText)
      }
      const itemMeta = await orderItem[0].$('ul.wc-item-meta')
      const listItems = await itemMeta.$$('li')
      await Promise.all(listItems?.map(async (li) => {
        const strong = await li.$("strong");
        const strongText = await strong?.evaluate((node) => node.innerText);

        const p = await li.$("p");
        const pText = await p?.evaluate((node) => node.innerText);

        if (strongText === "Size:") {
          productData['prodSize'] = pText
        }
        else if (strongText === "Type of Surface:") {
          productData['surfaceType'] = pText
        }
        else if (pText.startsWith('https://') || pText.startsWith('http://')) {
          productData['businessUrl'] = { type: strongText, url: pText }
        }
        else if (strongText.toLowerCase().endsWith('url:')) {
          productData['businessUrl'] = { type: strongText, url: pText }
        }
        return pText;
      }));

      productData['quantity'] = await orderItem[1]?.evaluate((node) => node.innerText)
      productData['price'] = await orderItem[2]?.evaluate((node) => node.innerText)
    }
    return productData
  }))

  // payment / pricing info
  const productSummary = await bodyElem.$('table tfoot')
  const summaryItems = await productSummary?.$$('tr')
  await Promise.all(summaryItems.map(async (item) => {
    const heading = await item.$("th");
    const headingText = await heading?.evaluate((node) => node.innerText);
    const value = await item.$("td");
    const valText = await value?.evaluate((node) => node.innerText);

    if (headingText === "Subtotal:") {
      orderSummary['subtotal'] = valText
    }
    if (headingText === "Shipping:") {
      orderSummary['shipping'] = valText
    }
    if (headingText === "Payment method:") {
      orderSummary['paymentMethod'] = valText
    }
    if (headingText === "Total:") {
      orderSummary['orderTotal'] = valText
    }
    return valText;
  }))

  return { customerName, orderNum, orderSummary, products };
};

export const identifyWarehouseAndFlowByAddress = (address: string, settings: WarehouseSetting[]) => {
  // console.log(JSON.stringify(settings, null, 2))
  const identified = settings.filter(
    wh => (wh.conditions["address"] && wh.conditions["address"].some((sub) => address.toLowerCase().includes(sub.toLowerCase())))
  );
  const defaultWh = settings.filter((wh) => wh.isDefault === true);
  const warehouse = identified?.length > 0 ? identified : defaultWh
  return {
    isItalian: warehouse?.length > 0 ? warehouse[0]?.useLandingFlow : true,
    whEmail: warehouse?.length > 0 ? warehouse[0]?.email : "",
    whId: warehouse?.length > 0 ? warehouse[0]?.id : "",
  }
}

const getAddressesInfo = async (bodyElem: ElementHandle<Element>, page: Page, settings: WarehouseSetting[]) => {
  let billingAddress = ""; let phone = ""; let email = "";
  let shippingAddress = ""; let isItalianAddress = false;
  let warehouseEmail = "";
  let warehouseId = "";
  await page.exposeFunction("identifyWarehouseAndFlowByAddress", identifyWarehouseAndFlowByAddress);
  const addressTable = await bodyElem.$('table#addresses')
  if (addressTable) {
    const billingAddSel = await addressTable.$('address')
    const addressLines = await billingAddSel?.evaluate((node) => node.innerText);
    const filteredAddressLines = addressLines?.split('\n').slice(0, -2);
    billingAddress = filteredAddressLines?.join('\n').trim();
    // Use page.evaluate to extract phone and email separately
    const contactInfo = await page.evaluate(() => {
      const addressElement = document.querySelector('table#addresses .address');
      const phoneLink: HTMLElement = addressElement.querySelector('a[href^="tel:"]');
      const emailLink: HTMLElement = addressElement.querySelector('a[href^="mailto:"]');

      const phone = phoneLink ? phoneLink.innerText.trim() : null;
      const email = emailLink ? emailLink.innerText.trim() : null;

      return { phone, email };
    });
    phone = contactInfo.phone; email = contactInfo.email;
    const shippingAddr = await page.evaluate(() => {
      const addressElement: Element = document.querySelectorAll('table#addresses .address')[1];
      const addressLines = (addressElement as HTMLElement)?.innerText.split('\n') ?? [];
      const filteredAddressLines = addressLines.filter(line => line.trim() !== '');
      const shippingAddress = filteredAddressLines?.join('\n').trim();
      // const isItalianAddress = filteredAddressLines[filteredAddressLines.length - 1].includes('Italy') ||
      // filteredAddressLines[filteredAddressLines.length - 1].includes('Italia');


      return shippingAddress;
    });
    const { isItalian, whEmail, whId } = identifyWarehouseAndFlowByAddress(shippingAddr, settings)
    isItalianAddress = isItalian;
    shippingAddress = shippingAddr
    warehouseEmail = whEmail;
    warehouseId = whId
  }
  // console.log({ phone, email, shippingAddress, isItalianAddress, billingAddress, warehouseEmail })
  return { phone, email, shippingAddress, isItalianAddress, billingAddress, warehouseEmail, warehouseId }
}

export const scrapeRelinkEmailHtml = async (
  emailBody: string, gmailMsgId: string, settings: WarehouseSetting[]
): Promise<tpRelinkOrder | undefined> => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.setContent(emailBody);
  const bodyElem = await page.$('table #body_content_inner')
  if (bodyElem) {
    const orderDetails = await getOrderDetails(bodyElem);
    const addressInfo = await getAddressesInfo(bodyElem, page, settings);
    await browser.close();
    return { ...orderDetails, gmailMsgId, ...addressInfo }
  } else {
    await browser.close();
    return undefined
  }
};
