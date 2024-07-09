import puppeteer from "puppeteer";
import { isAddressValid } from "./address";

export const srGetOrderPersonName = async (page) => {
  let name = "";

  const gmailAttrElement = await page.$(".gmail_attr"); // Replace with the actual selector
  if (gmailAttrElement) {
    // Extract the text content of the div element
    const orderInfo = await gmailAttrElement.evaluate(
      (node) => node.textContent
    );

    // Use a regular expression to extract the order number
    const nameRegex = /effettuato da\s*([a-zA-Z\s]+)/i;
    const match = orderInfo.match(nameRegex);
    name = match ? match[1] : null;
    return name;
  }
};

const extractOrderNumber = (emailHtml: string) => {
  const regex = /Ordine\s*#(\d+)/i; // Regex pattern to capture the order number
  const match = emailHtml.match(regex);
  return match ? match[1] : null;
};

export const stGetUserDetails = async (page) => {
  let address = "";
  let phone = "";
  let name = "";
  const tbodyChildren = await page?.$$("td");
  const tbodyChildrenData = await Promise.all(
    tbodyChildren?.map(async (td) => {
      const strong = await td.$("strong");
      const strongText = await strong?.evaluate((node) => node.innerText);
      if (strongText === "Indirizzo di spedizione") {
        const p = await td.$("p");
        const pText = await p?.evaluate((node) => node.innerText);
        return pText;
      }
    })
  );

  const arrayName = tbodyChildrenData?.filter((data) => data !== undefined);
  const phoneAndAddress = arrayName[0]?.replace(/\n/g, " ");
  const phoneNumber = arrayName?.[0]?.split("\n").slice(-2, -1);
  name = arrayName?.[0]?.split("\n")[0];

  if (phoneNumber) {
    phone = phoneNumber[0]?.trim()?.replace(/\s+/g, " ").replace(/\s/g, "");
    address = phoneAndAddress?.replace(phone, "");
    address = address?.replace(phoneNumber[0], "");
    address = address?.replace(name, "");
  }

  address = address?.trim() as string;
  const isValidAddress = await isAddressValid(address);

  return { isValidAddress, address, phone, name };
};

const getOrderDetails = async (page) => {
  // get all span in td class "order-list__product-description-cell"
  let name = "";
  let price = "";
  let sku = "";
  const td = await page.$x(
    "//td[@class='order-list__product-description-cell']"
  );
  if (td.length > 0) {
    const spans = await td[0].$$("span");
    if (spans[0]) {
      name = await spans[0].evaluate((el) => el?.textContent);
    }
    if (spans[1]) {
      price = await spans[1].evaluate((el) => el?.textContent);
    }
    if (spans[2]) {
      sku = await spans[2].evaluate((el) => el?.textContent);
    }
    if (name) {
      name = name?.trim().replace(/\s+/g, " ");
    }
    if (price) {
      price = price?.trim().replace(/\s+/g, " ");
    }
  }

  // get all all tr class "subtotal-line" and get subtotal-line__title and subtotal-line__value of them
  const orderInfo = await page.$$eval("tr.subtotal-line", (trs) =>
    trs.map((tr) => {
      const title = tr.querySelector("td.subtotal-line__title")?.textContent;
      const value = tr.querySelector("td.subtotal-line__value")?.textContent;
      return {
        title: title?.trim().replace(/\s+/g, " "),
        value: value?.trim().replace(/\s+/g, " "),
      };
    })
  );

  return { name, price, sku, orderInfo };
};

export const scrapeShopifyEmailHtml = async (emailBody: string) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(emailBody);
  let { isValidAddress, address, phone, name } = await stGetUserDetails(page);
  let ordineNumber = await extractOrderNumber(emailBody);
  const orderNumber = `Ordine #${ordineNumber}`;
  const orderDetails = await getOrderDetails(page);

  await browser.close();
  return { name, orderNumber, phone, isValidAddress, address, orderDetails };
};
