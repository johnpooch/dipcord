import { Collection, Events, Interaction } from 'discord.js';
import * as handlers from '../handlers';
import { createScopedLogger } from '../../util';

const log = createScopedLogger('event/utils/interaction-create');

const handlersCollection = new Collection<string, { name: string; execute: (interaction: Interaction) => Promise<void> }>();
handlersCollection.set(handlers.addPlayer.name, handlers.addPlayer);

export const name = Events.InteractionCreate;
export const execute = async (interaction: Interaction) => {
    if (interaction.isMessageComponent()) {
        log.info(`Received interaction: ${interaction.customId}`);
        log.info(`Checking for global handler for interaction: ${interaction.customId}`)
        const handler = handlersCollection.find(async (handler) => handler.name === interaction.customId)
        if (!handler) {
            log.info(`No global handler found for interaction: ${interaction.customId}`)
        } else {
            log.info(`Executing global handler for interaction: ${interaction.customId}`)
            await handler.execute(interaction);
        }

    }
}
