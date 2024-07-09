import * as readline from "readline";
import moment from "moment";
import * as fs from "fs";
import { gmail_v1, google } from "googleapis";
import { utExtractGmailMessageData } from "./utils/utGmailApi";
import { tpEmailMetaData } from "./types/tpGmailApi";
import credentials from './gmailCred.json';

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

export const getFileContent = (credentialsPath: string) => fs.readFileSync(credentialsPath);

const getNewToken = async (oAuth2Client: any, tokenPath: string) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question("Enter the code from that page here: ", (code: any) => {
      rl.close();
      oAuth2Client.getToken(code, (err: any, token: any) => {
        if (err) return console.error("Error retrieving access token", err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(tokenPath, JSON.stringify(token), (err: any) => {
          if (err) return console.error(err);
          console.log("Token stored to", tokenPath);
        });
        return resolve(oAuth2Client);
      });
    });
  });
}

export const gmailApiClient = () => {
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
    console.error("Error in authorization", e)
    return undefined
  }
}

const fetchMessages = async (messages: any, gmail: gmail_v1.Gmail, auth: any, format: string, token: string) => {
  const messagesData = []
  console.log(`Found ${messages.length} messages, starting fetching each_/`)
  try {
    for (let index = 0; index < messages.length; index += 1) {
      const messageId = messages[index].id;
      const data = await gmail.users.messages.get({
        auth: auth, userId: credentials.web.user_id, 'id': messageId, format: format, metadataHeaders: ["from", "subject", "to"], access_token: token
      });
      const msgContent = utExtractGmailMessageData(data.data as tpEmailMetaData)
      messagesData.push(msgContent);
    };
  } catch (e) {
    console.error("Error in fetching message", e)
  }
  return messagesData
}

const listMessages = async (auth: any, query: string, no_of_emails: number, format: string, access_token: string) => {
  const gmail = google.gmail({ version: 'v1', auth });
  let pageToken = undefined;
  let messages: any = [];
  try {
    do {
      const options: { auth: any, userId: string, q?: string, maxResults: number, pageToken?: string, access_token: string } = {
        auth: auth, userId: credentials.web.user_id, q: query, maxResults: no_of_emails, access_token: access_token
      }
      if (pageToken) { options.pageToken = pageToken; }
      const listOfUserMessages = await gmail.users.messages.list(options) as any;
      messages = [...messages, ...Object.values(listOfUserMessages.data.messages || {})];
      pageToken = listOfUserMessages.data.nextPageToken
    } while (pageToken !== undefined)
  } catch (e) {
    console.error("Error in getting message list", e)
  }
  const messagesData = await fetchMessages(messages, gmail, auth, format, access_token)
  return messagesData;
}

export const gmailApi = async (
  maxNumOfMessages: number,
  label: string,
  { dateAfter, dateBefore }: { dateAfter: string, dateBefore: string },
  { format }: { format?: string }
) => {
  const client = gmailApiClient();
  const { token } = await client.getAccessToken();
  if (client && token) {
    if (!moment(dateAfter, "YYYY/MM/DD", true).isValid() || !moment(dateBefore, "YYYY/MM/DD", true).isValid()) {
      console.log("Invalid Date Format");
      return "Invalid Date Format";
    }
    const FORMAT = format ? format : "metadata";

    const QUERY = `${label !== "all" ? `in: ${label} ` : ""}after:${(dateAfter || '')} before:${(dateBefore || '')}`
    const messagesData = await listMessages(client, QUERY, maxNumOfMessages, FORMAT, token);
    return messagesData;
  } else throw new Error("Error in creating oAUth client")
}
