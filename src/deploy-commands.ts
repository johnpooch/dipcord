import { REST, Routes } from 'discord.js';
import * as commands from './commands';
import dotenv from 'dotenv';

const APPLICATION_ID = '1246942452791644281';

const envConfig = dotenv.config();

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(envConfig.parsed.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async (): Promise<void> => {
  try {
    const commandsData = [];

    commandsData.push(commands.ping.data.toJSON());
    commandsData.push(commands.createGame.data.toJSON());
    commandsData.push(commands.addMember.data.toJSON());

    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(Routes.applicationCommands(APPLICATION_ID), {
      body: commandsData,
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
