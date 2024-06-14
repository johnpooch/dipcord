import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import {
  CommandInteraction,
  GuildMember,
  PermissionFlagsBits,
} from 'discord.js';
import { createScopedLogger } from '../../util/telemetry';

const log = createScopedLogger('commands/game/add-member');

const data = new SlashCommandBuilder()
  .setName('add-member')
  .setDescription('Adds a member of the server to the game.')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option
      .setName('member')
      .setDescription('The member to add to the game.')
      .setRequired(true),
  );

const execute = async (interaction: CommandInteraction): Promise<void> => {
  log.info('Command invoked');

  const { user, guildId } = interaction;
  log.info(`user: ${user.id}, guildId: ${guildId}`);

  const { options } = interaction;
  const member = (options.resolved.members.first() as GuildMember).user;
  log.info(`member: ${member.id}`);

  try {
    const { token: botToken } = await api.login();
    log.info('Bot token acquired');

    const { token: userToken } = await api.getUserToken(user.id, botToken);
    log.info('User token acquired');

    const { token: memberToken } = await api.getUserToken(member.id, botToken);
    log.info('Member token acquired');

    const games = await api.listMyGames('Staging', userToken);
    log.info(`Games retrieved for user: ${games.length}`);

    log.info(JSON.stringify(games[0]));

    games.filter((game) => game.name === guildId);

    if (games.length === 0) {
      log.info('No pending game for this channel. Responding to user.');
      await interaction.reply('There is no pending game for this channel.');
      return;
    }

    if (games.length > 1) {
      log.info('Multiple pending games for this channel. Responding to user.');
      await interaction.reply(
        'There should only be max one pending game for this channel.',
      );
      return;
    }

    const game = games[0];

    if (game.members.some((m) => m.user.id === member.id)) {
      log.info('Member already in game. Responding to user.');
      await interaction.reply('User is already a member of the game');
      return;
    }

    const result = await api.addMember(game.id, memberToken);
    log.info(`Member added to game: ${result.id}. Responding to user.`);

    await interaction.reply(`User ${result.id} added to game.`);
  } catch (error) {
    log.error(`An error occurred while adding member: ${error.message}`);
    await interaction.reply(
      `Could not add member to the game: ${error.message}`,
    );
  }
};

export { data, execute };
