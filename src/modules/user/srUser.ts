import { Transaction } from "knex";
import MdUser from "./mdUser";
import doMessage from "../message/doMessage";
import MdMessage from "../message/mdMessage";
import { sendMessageToNumber } from "../../utils/messaging";
import { stdLog, stdLogError } from "../../utils/logger";

export const srSendUserLoginInfoViaWhatsapp = async (
  trx: Transaction,
  user: MdUser,
  action: "create" | "update"
) => {
  try {
    let message = ""
    const template: MdMessage = await doMessage.findOneByCol(
      trx, "key", action === "update" ? 'MESSAGE_USER_CREDENTIALS_UPDATED' : 'MESSAGE_USER_CREDENTIALS_CREATED'
    )
    if (template && template?.value) {
      message = template.value
        .replace(/\$USEREMAIL\$/g, user.email)
        .replace(/\$USERPASSWORD\$/g, user.password)
        .replace(/\$USERNAME\$/g, user.username)
    }
    if (message && message !== "" && user?.phone && user?.phone !== '') {
      await sendMessageToNumber(user.phone, [message])
    }
  } catch (e) {
    stdLog(`Error in sending message to ${user.username} at ${user.phone}`, "error")
    stdLogError(e)
  }
}