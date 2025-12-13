const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");
const fs = require("fs");
const config = require("./config.json");

// ===== DISCORD CLIENT =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== UPTIMEROBOT SERVER =====
const app = express();
app.get("/", (req, res) => res.send("Welcomer is alive!"));
app.listen(3000, () => console.log("Uptime server running"));

// ===== SAVE CONFIG =====
function saveConfig() {
  fs.writeFileSync("./config.json", JSON.stringify(config, null, 2));
}

// ===== READY =====
client.once("ready", () => {
  console.log(`Welcomer logged in as ${client.user.tag}`);
  client.user.setActivity("welcoming new members 👋", { type: 3 });
});

// ===== COMMAND HANDLER =====
client.on("messageCreate", message => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // set welcome channel
  if (command === "setwelcome") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ Mention a channel.");
    config.welcomeChannel = channel.id;
    saveConfig();
    message.reply(`✅ Welcome channel set to ${channel}`);
  }

  // set log channel
  if (command === "setlogs") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ Mention a channel.");
    config.logChannel = channel.id;
    saveConfig();
    message.reply(`✅ Log channel set to ${channel}`);
  }

  // set welcome text
  if (command === "setwelcometext") {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Provide welcome text.");
    config.welcomeText = text;
    saveConfig();
    message.reply("✅ Welcome text updated!");
  }
});

// ===== MEMBER JOIN =====
client.on("guildMemberAdd", async member => {
  const messageText = config.welcomeText
    .replace("{user}", `<@${member.id}>`)
    .replace("{server}", member.guild.name);

  const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannel);
  const logChannel = member.guild.channels.cache.get(config.logChannel);

  // server message
  if (welcomeChannel) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("👋 Welcome!")
      .setDescription(messageText)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    welcomeChannel.send({ embeds: [embed] });
  }

  // DM message
  try {
    await member.send(
      `👋 Welcome to **${member.guild.name}**!\n\n${messageText}`
    );
  } catch {
    console.log("User has DMs closed");
  }

  // log join
  if (logChannel) {
    logChannel.send(`📥 **${member.user.tag}** joined`);
  }
});

// ===== MEMBER LEAVE =====
client.on("guildMemberRemove", member => {
  const logChannel = member.guild.channels.cache.get(config.logChannel);
  if (logChannel) {
    logChannel.send(`📤 **${member.user.tag}** left`);
  }
});

// ===== LOGIN =====
client.login(config.token);
