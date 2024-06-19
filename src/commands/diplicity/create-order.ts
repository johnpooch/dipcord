import { SlashCommandBuilder } from '@discordjs/builders';

import { createScopedLogger } from '../../util/telemetry';
import { withCommandHandler, withUserAuthentication } from '../../util/discord';

const log = createScopedLogger('commands/game/create-order');

// type FormData = {
//   variant: string;
//   phaseLength: string;
// };

const data = new SlashCommandBuilder()
  .setName('create-order')
  .setDescription('Creates a new order for the current phase.');

const execute = withCommandHandler(
  withUserAuthentication(async (interaction, authentication) => {
    log.info(authentication.userToken);
    interaction.reply('Order created');
  }),
);

export { data, execute };
