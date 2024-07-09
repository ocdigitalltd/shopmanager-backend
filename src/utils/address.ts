import axios from "axios";
import { Env } from "../base/loaders/appLoader";

export const isAddressValid = async (address: string): Promise<boolean> => {
  const API_TOKEN = Env.MAP_API_TOKEN
  const url = `https://geocoding.openapi.it/geocode`;

  const payload = {
    address:  address,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`
      },
    });

    const element = response?.data?.element;
    const success = response?.data?.success;
    
    if (success && element && element.streetName && element.streetNumber) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error validating address:", error.message);
    throw error;
  }
};
