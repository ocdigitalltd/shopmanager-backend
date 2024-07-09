export type tpEmailHeader = {
  name: string,
  value: string,
}

export type tpEmailMetaData = {
  id: string,
  snippet: string,
  payload: {
    body: {
      data: string,
    },
    mimeType: string,
    headers: tpEmailHeader[],
    parts: {
      mimeType: string,
      body: {
        data: string,
      },
    }[],
  },
}

export type tpGmailMsgExtractedData = {
  gmailMsgId: string,
  msgBody: string,
  msgBodyWithSnippet: string,
  msgFullHtml: string,
  msgFullContent: string,
  senderEmail: string,
  receiverEmails: string[],
  ccEmails: string[],
  deliveredToEmail: string,
  mailSubject: string,
  failedRecipients: string[]
}