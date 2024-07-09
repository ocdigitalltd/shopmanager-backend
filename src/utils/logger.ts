import { format } from "sql-formatter";
type tpLogMessageType = "info" | "error" | "success" | "warning"

const mapColor = (color: tpLogMessageType) => {
  if (color === "warning") return '\x1b[33m%s\x1b[0m'
  if (color === "error") return '\x1b[31m%s\x1b[0m'
  if (color === "success") return '\x1b[32m%s\x1b[0m'
  else return '\x1b[36m%s\x1b[0m'
}

export const stdLog = (logText: string, fgColor?: tpLogMessageType): void => {
  if (fgColor) {
    console.log(mapColor(fgColor), `${logText}`);
  } else {
    console.log(logText);
  }
};

export const stdLogError = (...params: any): void => {
  console.log(...params);
};

export const stdLogQuery = (query: string): void => {
  const formattedQuery = format(query, {
    language: "postgresql",
  });
  stdLog(formattedQuery);
};