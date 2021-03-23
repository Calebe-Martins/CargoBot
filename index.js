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

    // Divisão cores
    let roleCores = member.guild.roles.cache.find(role => role.id === '823534110378950697');
    if(!roleCores) console.log('Cargo não existente');
    member.roles.add(roleCores);

    // Divisão cargos
    let roleCargos = member.guild.roles.cache.find(role => role.id === '823545589647409182');
    member.roles.add(roleCargos);

    // Divisão Fun
    let roleFun = member.guild.roles.cache.find(role => role.id === '823620799369183233');
    member.roles.add(roleFun);

    // Divisão personalizada
    let rolePers = member.guild.roles.cache.find(role => role.id === '823568181800206376');
    member.roles.add(rolePers);
    
  } catch (err) {
    console.log("Erro: " + err);
  }

  // Mensagem de Boas Vindas
  channel.send(`Bem vindo ${member}`);
});

// Define os cargos para os novos padrões de cargo
client.on('raw', async padrao => {

  if(padrao.t !== 'MESSAGE_REACTION_ADD' && padrao.t !== 'MESSAGE_REACTION_REMOVE') return;
  if(padrao.d.message_id != '823619420215050260') return;

  let servidor = client.guilds.cache.get('440971255831855124');
  let membro = servidor.members.cache.get(padrao.d.user_id);

  try{
    let cargoCor = servidor.roles.cache.get('823534110378950697'),
      cargoCargo = servidor.roles.cache.get('823545589647409182'),
      cargoFun = servidor.roles.cache.get('823620799369183233'),
      cargoPers = servidor.roles.cache.get('823568181800206376');
      cargoSem = servidor.roles.cache.get('822548974597570604')

    if(padrao.t === 'MESSAGE_REACTION_ADD'){
      if(padrao.d.emoji.id === '823619289479250001'){
        membro.roles.add(cargoCor);
        membro.roles.add(cargoCargo);
        membro.roles.add(cargoFun);
        membro.roles.add(cargoPers);
        membro.roles.remove(cargoSem);
      }
    }
  } catch (err) {
    console.log ('Erro: '+err);
  }

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