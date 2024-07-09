import { Env } from "../base/loaders/appLoader";
import { generateItalianWarehouseMsgTemplate, generateNonItalianWarehouseMsgTemplate } from "../modules/message/srMessage";
import { srGetOrdersToProcessByStatus, srMarkRelinkOrderStatus } from "../modules/relinkOrders/srRelinkOrders";
import { tpRelinkOrderData } from "../modules/relinkOrders/tpRelinkOrders"
import { getTransport, sendEmail } from "../modules/shared/srEmailSender";
import { stdLog } from "./logger";
import { sendMessageToNumber } from "./messaging";

export const generateNonItalianWarehouseEmailTemplate = (data: tpRelinkOrderData) => {
  return (
    {
      subject: `New order from Relink Website Order no.${data.orderNum}`,
      body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    table, th, td {
      border: 1px solid #ddd;
    }

    th, td {
      padding: 10px;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
    }

    h3 {
      color: #333;
    }

    p {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <p>Dear Faktory, please fulfill and complete the following order:</p>
  <ul>
    <li><strong>Customer Full Name:</strong> ${data.customerName}</li>
    <li><strong>Full Address:</strong> ${data.shippingAddress}</li>
    <li><strong>Order Number:</strong> ${data.orderNum}</li>
  </ul>
  <table>
    <thead>
      <tr>
        <th>Product Name</th>
        <th>SKU</th>
        <th>Surface</th>
        <th>NFC TAG</th>
        <th>QR Code Link</th>
      </tr>
    </thead>
    <tbody>
      ${data.products.map(product => (
        `<tr id=${product.productId}>
          <td>${product.productName}</td>
          <td>${product.sku}</td>
          <td>${product.surfaceType}</td>
          <td>${product.thirdLvlDomain}.${Env.ovh.OVH_DOMAIN}</td>
          <td>${product.thirdLvlDomain}.${Env.ovh.OVH_DOMAIN}</td>
        </tr>`
      )).join("")}
    </tbody>
  </table>
  <br />
  <p>Waiting for your proof at sp@schedy.app</p>
</body>
</html>
`})
}

export const generateItalianWarehouseEmailTemplate = (data: tpRelinkOrderData) => {
  return (
    {
      subject: `New order from Relink Website Order no.${data.orderNum}`,
      body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    table, th, td {
      border: 1px solid #ddd;
    }

    th, td {
      padding: 10px;
      text-align: left;
    }

    th {
      background-color: #f2f2f2;
    }

    h3 {
      color: #333;
    }

    p {
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <p>Dear Faktory, please fulfill and complete the following order:</p>
  <ul>
    <li><strong>Customer Full Name:</strong> ${data.customerName}</li>
    <li><strong>Full Address:</strong> ${data.shippingAddress}</li>
    <li><strong>Order Number:</strong> ${data.orderNum}</li>
  </ul>
  <p>Products to be sent:</p>
  <table>
    <thead>
      <tr>
        <th>Product Name</th>
        <th>SKU</th>
        <th>Surface</th>
      </tr>
    </thead>
    <tbody>
      ${data.products.map(product => (
        `<tr id=${product.productId}>
          <td>${product.productName}</td>
          <td>${product.sku}</td>
          <td>${product.surfaceType}</td>
        </tr>`
      )).join("")}
    </tbody>
  </table>
  <br />
</body>
</html>
`})
}

const srProcessForEmails = async (orders: tpRelinkOrderData[], isItalian: boolean) => {
  const nodeMailTransport = await getTransport()
  for (let idx = 0; idx < orders.length; idx += 1) {
    const order = orders[idx]
    const isInvalidOrder = order.products.filter(prod => prod?.productName && prod?.redirectUrl)?.length === 0 || !order.whEmail || order.whEmail === ""
    try {
      if (!isInvalidOrder) {
        const { subject, body } = isItalian ?
          generateItalianWarehouseEmailTemplate(order) : generateNonItalianWarehouseEmailTemplate(order);
        stdLog(`    * Sending email to warehouse ${order.whEmail} for ${order.orderNum}`, "warning")
        // const toEmail = isItalian ? Env.ITALIAN_WAREHOUSE_EMAIL_ADDRESS : Env.NON_ITALIAN_WAREHOUSE_EMAIL_ADDRESS;
        // done: order.whEmail is nothing --> fix orders table to include warehouse column and then update the query
        const resp = await sendEmail(nodeMailTransport, order.whEmail, subject, body)
        if (resp && resp.status === 200) {
          await srMarkRelinkOrderStatus(order.id, "sent-for-shipping")
        } else {
          await srMarkRelinkOrderStatus(order.id, "email-send-fail")
        }
      } else await srMarkRelinkOrderStatus(order.id, "email-send-fail")
    } catch (err) {
      console.log("Error in srProcessForEmails ~~ ", err)
      await srMarkRelinkOrderStatus(order.id, "email-send-fail")
    }
  }
}

const srProcessForWhatsapp = async (orders: tpRelinkOrderData[], isItalian: boolean) => {
  for (let idx = 0; idx < orders.length; idx += 1) {
    const order = orders[idx]
    const isInvalidOrder = order.products.filter(prod => prod?.productName && prod?.redirectUrl)?.length === 0 || !order.whPhone || order.whPhone === ""
    try {
      if (!isInvalidOrder) {
        const message = isItalian ?
          await generateItalianWarehouseMsgTemplate(order) :
          await generateNonItalianWarehouseMsgTemplate(order);
        console.log('message to send ------', message)
        if (message !== "") {
          stdLog(`    * Sending msg to warehouse ${order.whPhone} for ${order.orderNum}`, "warning")
          const resp = await sendMessageToNumber(order.whPhone, [message])
          if (resp) {
            await srMarkRelinkOrderStatus(order.id, "sent-for-shipping")
          } else {
            await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 20000));
      } else await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
    } catch (err) {
      console.log("Error in srProcessForWhatsapp ~~ ", err)
      await srMarkRelinkOrderStatus(order.id, "whatsapp-send-fail")
    }
  }
}

export const srSendItalianEmailToWarehouse = async () => {
  try {
    const allOrders = await srGetOrdersToProcessByStatus("new");
    stdLog(`  * Found ${allOrders.length} orders for email sending -landing flow`, "info")
    if (allOrders && allOrders.length > 0) {
      await srProcessForWhatsapp(allOrders, true)
      await srProcessForEmails(allOrders, true)
    }

  } catch (e) {
    console.log("Error in srSendItalianEmailToWarehouse", e)
  }
}

export const srSendNonItalianEmailToWarehouse = async () => {
  try {
    const allOrders = await srGetOrdersToProcessByStatus("domain-created");
    stdLog(`  * Found ${allOrders.length} orders for email sending`, "info")
    if (allOrders && allOrders.length > 0) {
      await srProcessForWhatsapp(allOrders, false)
      await srProcessForEmails(allOrders, false)
    }
  } catch (e) {
    console.log("Error in srSendNonItalianEmailToWarehouse", e)
  }
}