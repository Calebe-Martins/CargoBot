// ================= EXPRESS DEPENDENCES ===================
const express = require('express');
const app = express();
const port = 4000;

// ==================== DISCORD.JS =========================
const Discord = require('discord.js');
const client = new Discord.Client();

// ============ DURAÇÃO LEGIVEL PARA HUMANOS ===============
const Duration = require('humanize-duration');

// ================== START EXPRESS ========================
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => console.log(`App rodando em: http://localhost:${port}`));

// ====================== START CARGOBOT ================

const { prefix, token } = require('./config.json');
const fs = require('fs');

client.commands = new Discord.Collection();

client.aliases = new Discord.Collection();
client.categories = fs.readdirSync("./commands/");

const commandFile = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFile) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

// Carregando os comandos
["command"].forEach(handler => {
  require(`./handlers/${handler}`)(client);
});

// Aparece assim que meu bot estiver online
client.on("ready", () => {
  console.log(`Bot foi iniciado, com ${client.users.cache.size} usuários, em ${client.channels.cache.size} canais, em ${client.guilds.cache.size} servidores.`);
  client.user.setActivity(`Eu estou em ${client.guilds.cache.size} servidores`, { type: 'PLAYING' });
});

// Atualiza ao entrar em um servidor novo
client.on("guildCreate", guild => {
  console.log(`O bot entrou no servidor: ${guild.name} (id: ${guild.id}). População: ${guild.memberCount} membros!`);
  client.user.setActivity(`Estou em ${client.guilds.cache.size} servidores`);
});

// Atualiza ao ser deletado de um servidor
client.on("guildDelete", guild => {
  console.log(`O bot foi removido do servidor: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Saving ${client.guilds.cache.size} servers`);
});

// Monitoramento de pessoas entrando no servidor
client.on('guildMemberAdd', member => {

  // Entra no canal Welcome
  const channel = member.guild.channels.cache.find(ch => ch.id === '594982272839450660');

  if (!channel) return;

  // ++++++++++ OTIMIZAR CARGOS ++++++++++
  // Adiciona o cargo ao membros
  try {

    // Separador de cores
    let roleCores = member.guild.roles.cache.find(role => role.id === '823534110378950697');
    if(!roleCores) console.log('Cargo não existente');
    member.roles.add(roleCores);

    // Separador de cargos
    let roleCargos = member.guild.roles.cache.find(role => role.id === '823545589647409182');
    member.roles.add(roleCargos);

    // Cargo padrão
    let rolePadrao = member.guild.roles.cache.find(role => role.id === '822548974597570604');
    member.roles.add(rolePadrao);
    
  } catch (err) {
    console.log("Erro: " + err);
  }

  // Mensagem de Boas Vindas
  channel.send(`Bem vindo ${member}`);
});

// Monitoramento do chat para o bot responder aos comandos
client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName)
    || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  if (command.guildOnly && message.channel.type === 'dm') {
    return message.reply('Eu não consigo executar este comando aqui');
  }

  // Mensagem de faltando argumento
  if (command.args && !args.length) {
    let reply = `Você não forneceu nenhum argumento, ${message.author}!`;

    // Se existir 'usage' no comando. Aparecerá como deve ser usado aqui
    if (command.usage) {
      reply += `\nTente usar: \`${prefix}${command.name} ${command.usage}\``;
    }
    // Apaga o comando do usuário
    message.delete().catch(O_o => { });

    return message.channel.send(reply).then(msg => { msg.delete({ timeout: 5000 }) });
  }

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  // Quando cooldown for sugerido em um comando... bom caso tenha q esperar 24 horas
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = Duration((expirationTime - now), { units: ['d', 'h', 'm', 's'], round: true });
      // Apaga o comando do usuário
      message.delete().catch(O_o => { });

      return message.reply(`Por favor, espere ${timeLeft} antes de usar \`${command.name}\` novamente.`).then(msg => {
        msg.delete({ timeout: 10000 })
      });
    }
  }

  timestamps.set(message.author.id, now); // Apaga o ID do usuario da exceção do colldown
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(client, message, args);
  } catch (error) {
    console.error(error);
  }

});

// Permite meu bot ficar online
client.login(process.env.TOKEN);