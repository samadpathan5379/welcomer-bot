// ================== IMPORTS ==================
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");
const express = require("express");

// ================== CONFIG ==================
const config = {
  token: process.env.TOKEN,
  prefix: "!",
  welcomeChannel: null,
  logChannel: null,
  welcomeText: "Welcome {user} to {server}! 🎉",
  welcomeEnabled: true,
  logsEnabled: true,
  autoRoleId: null,
  autoRoleEnabled: true
};

if (!config.token) {
  console.error("❌ TOKEN missing in environment variables");
  process.exit(1);
}

// ================== CLIENT ==================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================== EXPRESS (RENDER KEEP ALIVE) ==================
const app = express();
app.get("/", (_, res) => res.send("Welcomer Bot is alive"));
app.head("/", (_, res) => res.status(200).end());
app.listen(process.env.PORT || 3000);

// ================== READY ==================
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  client.user.setActivity("welcoming members 👋", { type: 3 });
});

// ================== COMMAND HANDLER ==================
client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("❌ You need **Administrator** permission.");
  }

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "setwelcome") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ Mention a channel.");
    config.welcomeChannel = channel.id;
    return message.reply(`✅ Welcome channel set to ${channel}`);
  }

  if (command === "setlogs") {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply("❌ Mention a channel.");
    config.logChannel = channel.id;
    return message.reply(`✅ Logs channel set to ${channel}`);
  }

  if (command === "setwelcometext") {
    const text = args.join(" ");
    if (!text) return message.reply("❌ Provide welcome text.");
    config.welcomeText = text;
    return message.reply("✅ Welcome text updated.");
  }

  if (command === "welcome") {
    if (!["on", "off"].includes(args[0])) {
      return message.reply("❌ Use `!welcome on` or `!welcome off`");
    }
    config.welcomeEnabled = args[0] === "on";
    return message.reply(`✅ Welcome messages **${args[0]}**`);
  }

  if (command === "logs") {
    if (!["on", "off"].includes(args[0])) {
      return message.reply("❌ Use `!logs on` or `!logs off`");
    }
    config.logsEnabled = args[0] === "on";
    return message.reply(`✅ Logs **${args[0]}**`);
  }

  if (command === "members") {
    return message.reply(`👥 Total members: **${message.guild.memberCount}**`);
  }

  if (command === "setautorole") {
    const role = message.mentions.roles.first();
    if (!role) return message.reply("❌ Mention a role.");
    config.autoRoleId = role.id;
    return message.reply(`✅ Auto-role set to **${role.name}**`);
  }

  if (command === "removeautorole") {
    config.autoRoleId = null;
    return message.reply("✅ Auto-role removed.");
  }

  if (command === "autorole") {
    if (!["on", "off"].includes(args[0])) {
      return message.reply("❌ Use `!autorole on` or `!autorole off`");
    }
    config.autoRoleEnabled = args[0] === "on";
    return message.reply(`✅ Auto-role **${args[0]}**`);
  }
});

// ================== MEMBER JOIN ==================
client.on("guildMemberAdd", async (member) => {
  const welcomeChannel = config.welcomeChannel
    ? member.guild.channels.cache.get(config.welcomeChannel)
    : null;

  const logChannel = config.logChannel
    ? member.guild.channels.cache.get(config.logChannel)
    : null;

  const welcomeMessage = config.welcomeText
    .replace("{user}", `<@${member.id}>`)
    .replace("{server}", member.guild.name)
    .replace("{membercount}", member.guild.memberCount);

  // ===== AUTO ROLE =====
  if (config.autoRoleEnabled && config.autoRoleId) {
    const role = member.guild.roles.cache.get(config.autoRoleId);
    if (role) {
      member.roles.add(role).catch(() => {});
    }
  }

  // ===== WELCOME MESSAGE (CHANNEL) =====
  if (config.welcomeEnabled && welcomeChannel) {
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("👋 Welcome!")
      .setDescription(welcomeMessage)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    welcomeChannel.send({ embeds: [embed] });
  }

  // ===== DM WELCOME =====
  try {
    await member.send(
      `👋 Welcome to **${member.guild.name}**!\n\n` +
      welcomeMessage.replace(/<@!?(\d+)>/g, member.user.username)
    );
  } catch (err) {
    console.log("⚠️ Could not DM user (DMs closed)");
  }

  // ===== LOG JOIN =====
  if (config.logsEnabled && logChannel) {
    logChannel.send(
      `📥 **${member.user.tag}** joined | 👥 Members: **${member.guild.memberCount}**`
    );
  }
});

// ================== MEMBER LEAVE ==================
client.on("guildMemberRemove", (member) => {
  const logChannel = config.logChannel
    ? member.guild.channels.cache.get(config.logChannel)
    : null;

  if (config.logsEnabled && logChannel) {
    logChannel.send(
      `📤 **${member.user.tag}** left | 👥 Members: **${member.guild.memberCount}**`
    );
  }
});

// ================== LOGIN ==================
client.login(config.token).catch(console.error);

