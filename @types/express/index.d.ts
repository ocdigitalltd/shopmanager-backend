declare namespace Express {
  export interface Response {
    sendList: ListResponseType;
    sendObject: ObjectResponseType;
    sendMsg: MessageResponseType;
    sendString: StringResponseType;
  }
}
