import { REST, Routes } from 'discord.js';
import * as commands from './commands';

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

// and deploy your commands!
(async (): Promise<void> => {
  try {
    const commandsData = [];

    commandsData.push(commands.ping.data.toJSON());
    commandsData.push(commands.createGame.data.toJSON());
    commandsData.push(commands.addMember.data.toJSON());
    commandsData.push(commands.listVariants.data.toJSON());
    commandsData.push(commands.getMap.data.toJSON());
    commandsData.push(commands.createOrder.data.toJSON());

    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID), {
      body: commandsData,
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
