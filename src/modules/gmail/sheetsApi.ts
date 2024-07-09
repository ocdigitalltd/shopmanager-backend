import * as fs from "fs";
import { google } from "googleapis";
import credentials from "./sheetsCred.json";
import { tpRelinkOrder, tpRelinkProductData } from "../relinkOrders/tpRelinkOrders";
import { WarehouseSetting } from "../warehouseSetup/srWarehouseSetup";
import { identifyWarehouseAndFlowByAddress } from "../../utils/relinkEmailHtml";
import MdRelinkDomains from "../relinkDomains/mdRelinkDomains";
import { srGetCronSettingsByName } from "../cronSettings/ctCronSettings";

// Scope for accessing Google Sheets and Gmail
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

export const getFileContent = (credentialsPath: string) =>
  fs.readFileSync(credentialsPath);

export const sheetsApiClient = () => {
  try {
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );
    oAuth2Client.setCredentials({
      refresh_token: credentials.web.refresh_token,
    });

    return oAuth2Client;
  } catch (e) {
    console.error("Error in authorization", e);
    return undefined;
  }
};

// Private link of the Google Sheet
const sheetLinkForParsing =
  "https://docs.google.com/spreadsheets/d/1c0LS-VXAuzh2jCD3-mOzM9aZnIZhUpIqIWFLgx2OT1U";


const createMultipleInstancesOfProduct = (product: tpRelinkProductData, orderData: any) => {
  let allProducts: tpRelinkProductData[] = []
  const sku: string = orderData.SKU.trim();
  if (sku.endsWith("P1") || sku.endsWith("P5") || sku.endsWith("P3")) {
    const pieces = Number(sku.slice(-1));
    for (let i = 0; i < pieces; i++) {
      if (sku.startsWith("GGL")) {
        const url = orderData[`ReviewLink0${i + 1}`];
        if (url && url !== "") allProducts.push({ ...product, businessUrl: { type: product.businessUrl.type, url } })
        else allProducts.push(product)
      } else allProducts.push(product)
    }
  } else allProducts.push(product)
  return allProducts
}

const getProductsBySKU = (orderData: any) => {
  let products: tpRelinkProductData[] = []
  const sku: string = orderData.SKU?.trim();
  let relinkUrl = ""

  if (sku.startsWith("GGL")) {
    relinkUrl = orderData.ReviewLink01
  } else if (sku.startsWith("FBB")) {
    relinkUrl = orderData.FacebookAccountURL
  } else if (sku.startsWith("TRP")) {
    relinkUrl = orderData.TripadvisorAccountURL
  } else if (sku.startsWith("GRA")) {
    relinkUrl = orderData.InstagramAccountURL
  } else if (sku.startsWith("WAP")) {
    relinkUrl = orderData.WhatsAppBusinessPhoneNumber
  }
  // console.log({sku, relinkUrl })
  if (relinkUrl !== "") {
    const productData: tpRelinkProductData = {
      sku: sku,
      quantity: orderData.ProductQuantity,
      name: orderData.ProductName,
      surfaceType: orderData.ProductVariation.split(",")?.length > 0 ? orderData.ProductVariation.split(",")[1]?.trim() : "",
      businessUrl: {
        type: orderData.ProductVariation,
        url: relinkUrl
      },
      price: orderData.ProductBasePrice,
    }
    products = createMultipleInstancesOfProduct(productData, orderData)
  }
  return products
}

// Function to fetch data from the Google Sheet
export const fetchRelinkOrdersDataFromSheets = async (sheetLink: string, settings: WarehouseSetting[], sheetName: string = "All Orders") => {
  try {
    // console.log(JSON.stringify(settings, null, 2))
    const client = sheetsApiClient();
    const { token } = await client.getAccessToken();
    if (!client || !token) throw new Error("Error in obtaining access token");
    const sheets = google.sheets({ version: "v4", auth: client });
    const sheetId = sheetLink.split("/")[5];
    const range = `${sheetName}!A1:AU`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
      auth: client,
      access_token: token,
    });
    const data = response.data.values;

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error("No data found in the sheet");
    }

    const headers = data[0];
    let finalOrders: tpRelinkOrder[] = [];
    for (let i = 1; i < data.length; i++) {
      const order = data[i];
      const orderWithCamelCase: any = {};
      for (let j = 0; j < headers.length; j++) {
        // console.log(headers[j].replace(/ /g, ""))
        orderWithCamelCase[headers[j].replace(/ /g, "")] = order[j] || "";
      }

      const orderIndex = finalOrders.findIndex(
        (o) => o.orderNum === orderWithCamelCase.OrderId
      );
      if (orderIndex !== -1) {
        getProductsBySKU(orderWithCamelCase).forEach((prod) => finalOrders[orderIndex].products.push(prod))

      } else {
        const shippingAddress = orderWithCamelCase.ShippingAdd1?.concat(orderWithCamelCase.ShippingCountry)
        const { isItalian, whEmail, whId } = identifyWarehouseAndFlowByAddress(shippingAddress, settings)
        finalOrders.push({
          gmailMsgId: orderWithCamelCase.OrderId,
          orderNum: orderWithCamelCase.OrderId,
          orderUrl: orderWithCamelCase.OrderURL,
          // orderStatus: orderWithCamelCase.OrderStatus,
          shippingAddress: shippingAddress,
          billingAddress: orderWithCamelCase.BillingAddress1,
          shippingCountry: orderWithCamelCase.ShippingCountry,
          isItalianAddress: isItalian,
          phone: orderWithCamelCase.Phone,
          email: orderWithCamelCase.Email,
          customerName: `${orderWithCamelCase.BillingFirstname} ${orderWithCamelCase.BillingLastName}`,
          products: getProductsBySKU(orderWithCamelCase),
          orderSummary: {
            orderTotal: orderWithCamelCase.OrderTotal,
            paymentMethod: orderWithCamelCase.PaymentMethod,
            shipping: orderWithCamelCase.ShippingTotal,
            subtotal: orderWithCamelCase['OrderTotal(Excl.Shipp.ChargesandOtherFees)']
          },
          warehouseEmail: whEmail,
          warehouseId: whId
        });
      }
    }

    return finalOrders;
  } catch (error) {
    throw new Error(`Error in fetching data from sheet: ${error.message}`);
  }
};


export const writeToGoogleSheets = async (
  data: MdRelinkDomains[],
) => {
  try {
    const settings = await srGetCronSettingsByName("domain-creation")
    const { startCron, sheetsUrl, sheetName } = settings
    if (startCron && sheetName && sheetsUrl) {
      const client = sheetsApiClient();
      const { token } = await client.getAccessToken();
      if (!client || !token) throw new Error("Error in obtaining access token");
      const sheets = google.sheets({ version: "v4", auth: client });
      const spreadsheetId = sheetsUrl.split("/")[5];
      const range = `${sheetName}!A1:C`;

      // Prepare the data for writing
      const values = data.map(({ incrementalId, thirdLvlDomain, sku }) => [sku, incrementalId, `http://${thirdLvlDomain}.ocdbiz.cloud`]);

      // Write the data to the spreadsheet 
      if (values.length > 0) {
        const request = {
          spreadsheetId,
          range,
          valueInputOption: 'RAW',
          resource: {
            values,
          },
        };
        const updateResponse = await sheets.spreadsheets.values.append(request);

        console.log('Data written successfully:', updateResponse.data);
      } else {
        console.log('No new data to write.');
      }
    } else console.log("could not write to sheets, settings data missing")

  } catch (error) {
    console.error('Error writing data:', error);
  }
}