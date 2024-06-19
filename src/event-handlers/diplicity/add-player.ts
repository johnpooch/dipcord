import {
  AnySelectMenuInteraction,
  ButtonInteraction,
  CacheType,
} from 'discord.js';

import * as api from '../../diplicity';
import { createScopedLogger } from '../../util';
import { createDiscordForm } from '../../util/form';

const log = createScopedLogger('event-handlers/diplicity/add-player');

const addPlayerResponseContent = `
## Add player
Add a new player to the forming game.
`;

type FormData = {
  playerId: string;
};

export const name = 'add-player';
export const once = true;
export const execute = async (
  interaction:
    | AnySelectMenuInteraction<CacheType>
    | ButtonInteraction<CacheType>,
): Promise<void> => {
  try {
    log.info('Executing add-player event handler');
    const { guildId, user } = interaction;

    log.info('Getting bot token');
    const { token: botToken } = await api.login();
    log.info('Bot token retrieved');

    log.info('Getting user token');
    const { token: userToken } = await api.getUserToken(user.id, botToken);
    log.info('user token retrieved');

    log.info('Getting guild members');
    const members = await interaction.guild.members.fetch();
    log.info('Guild members retrieved');

    log.info('Getting staging games');
    const games = await api.listMyGames('Staging', userToken);
    log.info(`Games retrieved for user`);

    log.info('Getting game with guild id');
    const game = games.find((game) => game.name === guildId);
    if (!game) {
      log.info('No game found for channel id. Responding to user.');
      await interaction.reply('No game found for this channel.');
      return;
    }
    log.info(`Game found: ${game.id}`);

    log.info('Filtering out bot users and users which are already in the game');
    const filteredMembers = members.filter((member) => {
      return (
        !member.user.bot && !game.members.some((m) => m.user.id === member.id)
      );
    });
    log.info(`Filtered members: ${filteredMembers.size}`);

    if (filteredMembers.size === 0) {
      log.info('No users to add. Responding to user.');
      await interaction.reply(
        'There are no users in the server which can be added to the game',
      );
      return;
    }

    const addPlayerForm = createDiscordForm<FormData>({
      initialValues: { playerId: '' },
      interactionContent: addPlayerResponseContent,
      submitLabel: 'Add player',
      fields: [
        {
          type: 'string-select',
          name: 'playerId',
          placeholder: 'Player',
          options: filteredMembers.map((member) => ({
            label: member.user.username,
            value: member.user.id,
          })),
        },
      ],
      onSubmit: async (interaction, values) => {
        await interaction.deferReply({ ephemeral: true });

        log.info('Getting user from response');
        const { playerId } = values;
        log.info(`Player ID: ${playerId}`);

        log.info('Getting player token');
        const { token: playerToken } = await api.getUserToken(
          playerId,
          botToken,
        );
        log.info('Player token retrieved');

        if (game.members.some((m) => m.user.id === playerId)) {
          log.info('Member already in game. Responding to user.');
          await interaction.reply('User is already a member of the game');
          return;
        }

        log.info('Adding player to game');
        await api.addMember(game.id, playerToken);
        log.info('User added to game');

        await interaction.editReply(`User added to game.`);
      },
    });
    await addPlayerForm.respond(interaction, { ephemeral: true });
  } catch (error) {
    log.error(error);
  }
};
