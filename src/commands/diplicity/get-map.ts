import { SlashCommandBuilder } from '@discordjs/builders';

import { createScopedLogger } from '../../util/telemetry';
import { withCommandHandler, withUserAuthentication } from '../../util/discord';

const log = createScopedLogger('commands/game/get-map');

const data = new SlashCommandBuilder()
  .setName('get-map')
  .setDescription('Gets the map');

const execute = withCommandHandler(
  withUserAuthentication(async (interaction) => {
    try {
      //   const game = await getGameForServer(interaction, authentication);

      const url =
        'https://diplomacy-map.vercel.app/maps/ahJzfmRpcGxpY2l0eS1lbmdpbmVyEQsSBEdhbWUYgIDA2qSgsgsM/1.svg';

      // Reply with embed including map URL
      await interaction.reply({
        content: `Here is the map for the game: ${url}`,
        ephemeral: true,
        embeds: [
          {
            title: 'Map',
            url: url,
            image: {
              url: url,
              height: 1000,
              width: 1000,
            },
          },
        ],
      });
    } catch (error) {
      log.error(`An error occurred: ${error.message}`);
      await interaction.reply(`Could not list variants: ${error.message}`);
    }
  }),
);

export { data, execute };
