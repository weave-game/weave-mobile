export enum MessageType {
    StartGame,
    EndGame,
    Error,
    Success
}

export interface IMessage {
    MessageType : MessageType,
    Data: string
}