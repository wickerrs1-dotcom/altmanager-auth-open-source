const { SlashCommandBuilder } = require('discord.js');

describe('/alts command structure', () => {
  it('should have name "alts"', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const data = command.data;
    expect(data.name).toBe('alts');
  });

  it('should have exactly 1 option named "cmd"', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const json = command.data.toJSON();
    expect(json.options).toHaveLength(1);
    expect(json.options[0].name).toBe('cmd');
  });

  it('should have string type for cmd option', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const json = command.data.toJSON();
    expect(json.options[0].type).toBe(3); // STRING
  });

  it('should have no choices/autocomplete for cmd', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const json = command.data.toJSON();
    const choices = json.options[0].choices || [];
    expect(choices).toHaveLength(0);
  });

  it('should have NO subcommands', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const json = command.data.toJSON();
    const subcommands = json.options.filter(o => o.type === 1 || o.type === 2);
    expect(subcommands).toHaveLength(0);
  });

  it('should be optional', () => {
    const command = require('../src/discord/commands/alts.command.js');
    const json = command.data.toJSON();
    expect(json.options[0].required).toBe(false);
  });
});
