import { IChatJobData, IMessageData } from '@chat/interfaces/chat.interface';
import { chatWorker } from '@worker/chat.worker';
import { BaseQueue } from './base.queue';

class ChatQueue extends BaseQueue {
  constructor() {
    super('auth');
    this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB);
    this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeleted);
    this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB);
    this.processJob('updateMessageReaction', 5, chatWorker.updateMessageReaction);
  }

  public addChatJob(name: string, data: IChatJobData | IMessageData): void {
    this.addJob(name, data);
  }
}

export const chatQueue: ChatQueue = new ChatQueue();
