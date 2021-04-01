const Discord = require("discord.js");

module.exports = {
  name: 'color',
  aliases: ['c'],
  description: 'Alterar cor do nome do usuário',
  category: 'cor',
  args: true,
  usage: '<nome da cor>',
  cooldown: 0,
  execute(client, message, args) {
    
    // Apaga o comando do usuário
    message.delete().catch(O_o => { });

    var string = args.join(' ');

    let canalCor = '823658012500688968';
    if(message.channel.id != canalCor) {
      return message.reply('Utilize o canal 『🎨』𝓒𝓸𝓻𝓮𝓼').then(msg => msg.delete ({ timeout: 2500 }));
    }

    //DEFINIR Q O COMANDO SÓ VAI ACONTECER NO CANAL COLOR CHANGE

    let colors = [
      {name: 'Vermelho', id: '823589021527572490'},
      {name: 'Verde Claro', id: '824360805113266317'},
      {name: 'Verde', id: '823593871060762675'},
      {name: 'Verde Escuro', id: '823595155272761475'},
      {name: 'Azul Claro', id: '824360279160782928'},
      {name: 'Azul', id: '823588745562685451'},
      {name: 'Azul Escuro', id: '824360534182854666'},
      {name: 'Amarelo', id: '823594451254902794'},
      {name: 'Roxo', id: '823593980209660014'},
      {name: 'Magenta', id: '823594471798079529'},
      {name: 'Marrom', id: '823593931836620831'},
      {name: 'Laranja', id: '823593896754806804'},
      {name: 'Rosa', id: '823593959636336670'},
      {name: 'Invisivel', id: '823594002308923403'}
    ];

    var names = colors.map(function(item) {
      return item['name'].toLowerCase();
    });
    var ids = colors.map(function(item) {
      return item['id'];
    });

    // Retorna true caso exista cargo com o nome igual ao das cores
    var role = message.guild.roles.cache.find(r => r.name.toLowerCase() === string.toLowerCase());

    if(args[0].toLowerCase() === 'remove') {
      message.member.roles.remove(ids);
    } else if(!names.includes(string.toLowerCase()) || !role) {
      message.reply(`Não existe a cor ${string}. Solicitar cor no canal 📢𝓢𝓾𝓰𝓮𝓼𝓽õ𝓮𝓼`).then(msg => { msg.delete({ timeout: 2500 }) });
    } else {
      try {
        // Remove todas as cores antes de adicionar uma nova
        message.member.roles.remove(ids);
        // Adiciona a cor
        message.member.roles.add(role);
      } catch (err) {
        console.log('Erro: ' + err);
      }
    }
    
  }
};