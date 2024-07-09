import axios from "axios";
import { Env } from "../base/loaders/appLoader";
import { srMarkOrderStatus } from "../modules/orderMail/srMailOrders";

interface SendMessageResponse {
  status: string;
  message: string;
}

export async function sendWhatsappMessage(
  phone: string,
  message: string
): Promise<SendMessageResponse> {
  const API_KEY = Env.WHATSAPP_SENDING_API_KEY;
  const SENDER_NUMBER = Env.WHATSAPP_SENDING_NUMBER
  const url = `https://api.mail2wa.it/?action=send&apiKey=${API_KEY}`;

  try {
    const response = await axios.post(url, {
      sender: SENDER_NUMBER,
      to: phone,
      message: message,
    });

    if (
      response.data &&
      (!response.data.success ||
        response.data.message === "Whatsapp not connect")
    ) {
      throw new Error("Whatsapp not connect");
    }
    if (response.data && response.data.success) {
      return {
        status: "success",
        message: response.data,
      };
    }
  } catch (error) {
    throw error;
  }
}

export const isPhoneNumberOnWhatsApp = async (
  phoneNumber: string,
  msgId?: string
): Promise<boolean> => {
  let apiKey = Env.WHATSAPP_CHECKING_API_KEY;
  try {
    const apiUrl = `https://phone.watverifyapi.live/is-whatsapp-no/get?api_key=${apiKey}&phone=${phoneNumber.replace("+", "")}`;
    const response = await axios.get(apiUrl);

    if (response && response?.data && response?.data?.result) {
      return true;
    } else {
      if (response && response?.data && typeof (response?.data) === 'string' && response?.data?.includes("Try to connect again")) {
        throw new Error("Try to connect again");
      }
      return false;
    }
  } catch (error) {
    console.error("Error checking WhatsApp status:", error);
    if (msgId) await srMarkOrderStatus(msgId, "whatsapp-check-fail")
    throw error;
  }
};

export async function sendWhatsappMessageViaWatVerifyApi(
  phone: string,
  message: string,
  msgId?: string
): Promise<SendMessageResponse> {
  const API_KEY = Env.WHATSAPP_CHECKING_API_KEY;
  const url = `https://phone.watverifyapi.live/send-wa-message/post`;

  try {
    const response = await axios.post(url, {
      api_key: API_KEY,
      phone: phone.replace("+", ""),
      message: message,
    });

    if (
      response.data &&
      (response.data.status !== "success" ||
        response.data.message === "Whatsapp not connect")
    ) {
      if (msgId) await srMarkOrderStatus(msgId, "whatsapp-check-fail")
      throw new Error("Whatsapp not connect");
    }
    if (response.data && response.data.status === "success") {
      return {
        status: "success",
        message: response.data,
      };
    } else {
      if (msgId) await srMarkOrderStatus(msgId, "whatsapp-check-fail")
      throw new Error("Whatsapp not connect");
    }
  } catch (error) {
    if (msgId) await srMarkOrderStatus(msgId, "whatsapp-check-fail")
    throw error;
  }
}

export const isWhatsAppServiceActive = async (
): Promise<boolean> => {
  let apiKey = Env.WHATSAPP_CHECKING_API_KEY;
  try {
    const apiUrl = `https://phone.watverifyapi.live/connected-phone/scan?api_key=${apiKey}`;
    const response = await axios.get(apiUrl);
    if (response && response?.data && typeof (response?.data) === 'string' && response?.data === 'Connected! Your API Service is online') {
      return true;
    } else {
      if (response && response?.data && typeof (response?.data) === 'string' && response?.data?.includes("Try to connect again")) {
        throw new Error("Try to connect again");
      }
      return false;
    }
  } catch (error) {
    console.error("Error checking WhatsApp service:", error);
    // throw error;
  }
};