import { parsePhoneNumber } from "libphonenumber-js";

export const formatPhoneNumber = (phoneNumber: string): string | null => {
    try {
      const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
      if (parsedPhoneNumber) {
        const formattedPhoneNumber = `+${parsedPhoneNumber.countryCallingCode}-${parsedPhoneNumber.nationalNumber}`;
        return formattedPhoneNumber;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error parsing phone number: ${error.message}`);
      return null;
    }
  };