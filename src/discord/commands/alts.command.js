const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("alts")
    .setDescription("Alt Manager")
    .addStringOption(option =>
      option
        .setName("cmd")
        .setDescription("")
        .setRequired(true)
        .setAutocomplete(false)
    ),

  async execute(interaction, ctx) {
    const { handleAlts } = require("../../alts");
    return handleAlts(interaction, ctx);
  }
};
