// ================== IMPORTS ==================
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const express = require("express");

// ================== CONFIG (RENDER SAFE) ==================
const config = {
  token: process.env.TOKEN, // TOKEN comes from Render Environment Variables
  prefix: "!",
  welcomeChannel: null,
  logChannel: null,
  welcomeText: "Welcome {user} to {server}! 🎉"
};

if (!config.token) {
  console.error("❌ BOT TOKEN NOT FOUND. Set TOKEN in Render Environment Variables.");
  process.exit(1);
}

// ================== DISCORD CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================== EXPRESS SERVER (FOR RENDER) ==================
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("Welcomer is alive!");
});

// handle HEAD requests (important for monitors)
app.head("/", (req, res) => {
  res.status(200).end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ================== BOT READY ==================
client.once("ready", () => {
  console.log(`🤖 Welcomer logged in as ${client.user.tag}`);
  client.user.setActivity("welcoming new members 👋", { type: 3 });
});

// ================== COMMAND HANDLER ==================
client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // set welcome channel
  if (command === "setwelcome") {
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply("❌ Please mention a welcome channel.");
    }
    config.welcomeChannel = channel.id;
    return message.reply(`✅ Welcome channel set to ${channel}`);
  }

  // set logs channel
  if (command === "setlogs") {
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply("❌ Please mention a logs channel.");
    }
    config.logChannel = channel.id;
    return message.reply(`✅ Logs channel set to ${channel}`);
  }

  // set welcome text
  if (command === "setwelcometext") {
    const text = args.join(" ");
    if (!text) {
      return message.reply("❌ Please provide welcome text.");
    }
    config.welcomeText = text;
    return message.reply("✅ Welcome text updated!");
  }
});

// ================== MEMBER JOIN ==================
client.on("guildMemberAdd", async (member) => {
  const messageText = config.welcomeText
    .replace("{user}", `<@${member.id}>`)
    .replace("{server}", member.guild.name);

  const welcomeChannel = config.welcomeChannel
    ? member.guild.channels.cache.get(config.welcomeChannel)
    : null;

  const logChannel = config.logChannel
    ? member.guild.channels.cache.get(config.logChannel)
    : null;

  // Welcome embed
  if (welcomeChannel) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("👋 Welcome!")
      .setDescription(messageText)
      .setThumbnail(member.user.displayAvatarURL())
      .setImage("https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif") // welcome GIF
      .setTimestamp();

    welcomeChannel.send({ embeds: [embed] });
  }

  // DM welcome
  try {
    await member.send({
      content: `👋 Welcome to **${member.guild.name}**!\n\n${messageText}`,
      files: ["https://media.giphy.com/media/OkJat1YNdoD3W/giphy.gif"]
    });
  } catch (err) {
    console.log("⚠️ Could not DM user");
  }

  // Log join
  if (logChannel) {
    logChannel.send(`📥 **${member.user.tag}** joined the server`);
  }
});

// ================== MEMBER LEAVE ==================
client.on("guildMemberRemove", (member) => {
  const logChannel = config.logChannel
    ? member.guild.channels.cache.get(config.logChannel)
    : null;

  if (logChannel) {
    logChannel.send(`📤 **${member.user.tag}** left the server`);
  }
});

// ================== LOGIN ==================
client.login(config.token).catch((err) => {
  console.error("❌ LOGIN ERROR:", err);
});
