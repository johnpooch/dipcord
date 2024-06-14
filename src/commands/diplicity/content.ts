export const createGameCommandResponse = `
## Create a new Diplomacy game

You are about to create a new Diplomacy game in this server. This will authorize
the bot to create new roles for each player, and create new channels in a
category to manage the game.

You will be able to add new players after the game has been initiated.

Note that we are in alpha phase, meaning that there might be issues. If you
have questions or feedback, please contact the developers at
<https://discord.gg/Hc9dbJTz>.
### Game settings:
`;

export const createGameSuccessResponse = `
## Game created
The game has been created. You can now add players.
### Game details:
- Variant: **{{ variantName }}**
- Phase length: **{{ phaseLength }} hours**
### Next steps:
`;
