import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle("👋 Welcome!")
    .setDescription(
      `Hey ${member}, welcome to **${member.guild.name}**!\n\n` +
      `📌 Please read the rules\n` +
      `📚 Study • Work • Grow together`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: "Welcome to the community" })
    .setTimestamp();

  channel.send({
    content: `${member}`,
    embeds: [embed]
  });
});

client.login(process.env.TOKEN);
