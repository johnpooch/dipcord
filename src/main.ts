import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

import * as ready from './events/ready';
import * as interactionCreate from './events/interaction-create';
import * as commands from './commands';

const envConfig = dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
client.commands.set(commands.ping.data.name, commands.ping);
client.commands.set(commands.createGame.data.name, commands.createGame);
client.commands.set(commands.addMember.data.name, commands.addMember);
client.commands.set(commands.listVariants.data.name, commands.listVariants);

(client as Client<true>).on(Events.InteractionCreate, async (interaction) => {
  // check if the interaction is a command
  if (interaction.isCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      }
    }
  }
});

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(interactionCreate.name, interactionCreate.execute);

// Log in to Discord with your client's token
client.login(envConfig.parsed.DISCORD_BOT_TOKEN);

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received.');
  // Perform cleanup tasks here

  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
  // Perform cleanup tasks here

  process.exit(0);
});
