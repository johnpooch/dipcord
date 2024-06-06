import { SlashCommandBuilder } from '@discordjs/builders';

import { makeRequest } from '../../diplicity/util/request';
import { loginRequest } from '../../diplicity/auth/login';

const data = new SlashCommandBuilder()
  .setName('create-game')
  .setDescription('Creates a new game for the current server.');

const execute = async (interaction) => {
  try {
    makeRequest(loginRequest);
  } catch (error) {
    // Respond to the user with the error message
    await interaction.reply(
      `An error occurred while creating the game: ${error.message}`,
    );
  }
};

export { data, execute };
