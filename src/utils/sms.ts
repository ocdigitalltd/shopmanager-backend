import axios, { AxiosResponse, AxiosError } from "axios";
import { formatPhoneNumber } from "./phone";
import { Env } from "../base/loaders/appLoader";
import { srMarkOrderStatus } from "../modules/orderMail/srMailOrders";
const API_URL = "https://ws.messaggisms.com/messages/";

interface SendMessageResponse {
  status: string;
  message: string;
}

interface SmsOptions {
  test?: boolean;
  sender: string;
  body: string;
  recipients: string;
}

export async function sendSmsMessage(
  recipients: string,
  message: string,
  msgId?: string
): Promise<SendMessageResponse> {
  const formattedNumber = formatPhoneNumber(recipients);

  if (formattedNumber == null) {
    if(msgId) await srMarkOrderStatus(msgId, "sms-check-fail")
    throw new Error(`Invalid phone number: ${recipients}`);
  }

  const requestBody = {
    test: true, // to be removed in production
    sender: Env.SMS_SENDER_NUMBER,
    body: message,
    recipients: formattedNumber,
  };

  try {
    const response: AxiosResponse<SendMessageResponse> = await axios.post(
      API_URL,
      requestBody,
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${Env.SMS_BEARER_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if(msgId) await srMarkOrderStatus(msgId, "sms-check-fail")
    throw (
      axiosError.response?.data || axiosError.message || "An error occurred"
    );
  }
}
