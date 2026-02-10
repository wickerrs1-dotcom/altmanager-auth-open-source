const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("alts")
    .setDescription("Alt manager (manual text commands)")
    .addStringOption(o =>
      o.setName("cmd")
       .setDescription('Manual command, e.g. start alt1 | list | logs alt1')
       .setRequired(false)
    ),
  async execute(interaction) {
    const { handleAlts } = require("../../alts");
    return handleAlts(interaction);
  }
};
