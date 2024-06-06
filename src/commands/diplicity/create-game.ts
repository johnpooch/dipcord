import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import { CommandInteraction } from 'discord.js';

const data = new SlashCommandBuilder()
  .setName('create-game')
  .setDescription('Creates a new game for the current server.');

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const { user, channelId } = interaction;
  try {
    const { token: botToken } = await api.login();
    const { token: userToken } = await api.getUserToken(user.id, botToken);
    const game = await api.createGame(channelId, userToken);
    console.log(game);
  } catch (error) {
    // Respond to the user with the error message
    await interaction.reply(
      `An error occurred while creating the game: ${error.message}`,
    );
  }
};

export { data, execute };
