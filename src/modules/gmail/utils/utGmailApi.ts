import { tpEmailHeader, tpEmailMetaData, tpGmailMsgExtractedData } from "../types/tpGmailApi";
import {
  MAIL_HTML_MIMETYPE, MAIL_MULTIPART_MIMETYPE, MAIL_PLAIN_MIMETYPE,
  FIND_EMAIL_IN_GMAIL_HEADER, STYLE_TAG_REGEX
} from "../data/dtConstants";

const utEmailFormatter = (email: string): string => email?.replace(/\s/g, "").toLowerCase();

const utExtractHtmlBodyFromMailParts = (part: {
  mimeType: string;
  body: {
    data: string;
  };
  parts?: { mimeType: string; body: { data: string; }; }[];
}[], extractDataType: string): string => {
  let mailBody = "";
  part.forEach((partItem) => {
    if (partItem.mimeType === extractDataType) {
      mailBody = mailBody.concat(Buffer.from(partItem.body.data, "base64").toString("utf8"));
    }
    if (partItem.parts) {
      mailBody = mailBody.concat(utExtractHtmlBodyFromMailParts(partItem.parts, extractDataType));
    }
    return mailBody;
  });
  return mailBody;
};

const utGetMessageBodyContent = (mail: tpEmailMetaData)
  : {
    msgBody: string; fullHtml: string
  } => {
  let mailBody = null;
  if (!mail.payload.mimeType.includes(MAIL_MULTIPART_MIMETYPE) && mail?.payload?.body?.data) {
    mailBody = Buffer.from(mail.payload.body.data, "base64").toString("utf8");
  } else if (mail.payload.parts && mail.payload.parts.length > 0) {
    mailBody = utExtractHtmlBodyFromMailParts(mail.payload.parts, MAIL_HTML_MIMETYPE);
  }
  const startIndex = mailBody?.indexOf("<body");
  const msgBody = startIndex !== -1
    ? mailBody?.slice(startIndex, mailBody.lastIndexOf("</body>")).replace(STYLE_TAG_REGEX, "") as string
    : mailBody?.replace(STYLE_TAG_REGEX, "");
  return {
    msgBody: msgBody ?? "",
    fullHtml: mailBody ?? "",
  };
};

const utExtractRecipientsEmailsFromMailHeaders = (
  headerContent: string,
): string[] => {
  let extractedEmails: string[] = [];
  if (headerContent && headerContent.length > 0) {
    const splitted = headerContent.split(",");
    extractedEmails = (splitted && splitted?.length > 0) ? splitted?.map((eml) => {
      if (eml.includes("<")) {
        const [, slicedEmail] = eml.match(FIND_EMAIL_IN_GMAIL_HEADER) as RegExpMatchArray;
        return slicedEmail;
      }
      return eml;
    }) : [];
    return extractedEmails.map((eml) => utEmailFormatter(eml ?? ""));
  }
  return extractedEmails;
};

const utGetCcAndFailedRecipientsHeadersIfExist = (mail: tpEmailMetaData) => {
  const isEmailHavingCC = mail.payload.headers
    .filter((header: tpEmailHeader) => header.name.toLowerCase() === "cc");
  const ccEmails = (isEmailHavingCC && isEmailHavingCC.length > 0)
    ? utExtractRecipientsEmailsFromMailHeaders(isEmailHavingCC[0]?.value) : [];
  const isEmailHavingFailedRecipients = mail.payload.headers
    .filter((header: tpEmailHeader) => header.name === "X-Failed-Recipients");
  const failedRecipients = (isEmailHavingFailedRecipients && isEmailHavingFailedRecipients.length > 0)
    ? utExtractRecipientsEmailsFromMailHeaders(mail.payload.headers
      .filter((header: tpEmailHeader) => header.name === "X-Failed-Recipients")[0]?.value) : [];
  return { ccEmails, failedRecipients };
};


const utGetFullMailContent = (mail: tpEmailMetaData, msgBody: string): string => {
  const fullMailContent = [];
  mail.payload.headers.forEach((header) => {
    if (header && header?.value && header?.value.length > 0) fullMailContent.push(header.value);
  });
  fullMailContent.push(mail.snippet.length > 0 ? mail.snippet : "", msgBody);
  if (mail.payload.parts && mail.payload.parts.length > 0) {
    fullMailContent.push(utExtractHtmlBodyFromMailParts(mail.payload.parts, MAIL_PLAIN_MIMETYPE));
  }
  return fullMailContent.join("\n");
};

export const utExtractGmailMessageData = (mail: tpEmailMetaData): tpGmailMsgExtractedData => {
  const senderEmails = utExtractRecipientsEmailsFromMailHeaders(mail.payload.headers
    .filter((header: tpEmailHeader) => header.name.toLowerCase() === "from")[0]?.value) ?? [];
  const receiverEmails = utExtractRecipientsEmailsFromMailHeaders(mail.payload.headers
    .filter((header: tpEmailHeader) => header.name.toLowerCase() === "to")[0]?.value) ?? [];
  const { ccEmails, failedRecipients } = utGetCcAndFailedRecipientsHeadersIfExist(mail);
  const mailSubject = mail.payload.headers
    .filter((header: tpEmailHeader) => header.name.toLowerCase() === "subject")[0]?.value;
  const deliveredToEmail = mail.payload.headers
    .filter((header: tpEmailHeader) => header.name === "Delivered-To")[0]?.value ?? "";
  const { msgBody, fullHtml } = utGetMessageBodyContent(mail)
  return {
    gmailMsgId: mail.id,
    msgBody: msgBody,
    msgBodyWithSnippet: (msgBody ?? "").concat(mail.snippet.length > 0 ? mail.snippet : ""),
    msgFullHtml: fullHtml,
    msgFullContent: utGetFullMailContent(mail, msgBody),
    mailSubject,
    senderEmail: senderEmails[0],
    receiverEmails,
    ccEmails,
    deliveredToEmail,
    failedRecipients,
  };
};
