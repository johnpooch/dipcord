import { AnySelectMenuInteraction, ButtonInteraction, ButtonStyle, CacheType, ComponentType, Events, Interaction } from 'discord.js';

const addPlayerResponseContent = `
## Add player
Add a new player to the forming game.
`;

export const name = 'add-player';
export const once = true;
export const execute = async (interaction: AnySelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>): Promise<void> => {
    interaction.reply({
        content: addPlayerResponseContent,
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.UserSelect,
                        placeholder: 'Select a user',
                        customId: 'add-player-select',
                    },
                ],
            },
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        label: 'Cancel',
                        style: ButtonStyle.Danger,
                        customId: 'add-player-cancel',
                    },
                    {
                        type: ComponentType.Button,
                        label: 'Add to game',
                        style: ButtonStyle.Primary,
                        customId: 'add-player-submit',
                    },
                ],
            }
        ],
        ephemeral: true,
    });
}
