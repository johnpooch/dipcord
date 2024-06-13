import { Webhook, WebhookType } from 'discord.js';
import { createScopedLogger } from '../../util';

const log = createScopedLogger('webhooks/diplicity/game-started');

export const name = 'game-started';
export const execute = async (webhook: Webhook<WebhookType>) => {
  log.info(`Game started webhook received: ${webhook.id}`);
};
