// ================= EXPRESS DEPENDENCES ===================
const express = require('express');
const app = express();
const port = 4000;

// ==================== DISCORD.JS =========================
const Discord = require('discord.js');
const client = new Discord.Client();

// ================== START EXPRESS ========================
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => console.log(`App rodando em: http://localhost:${port}`));


// Permite meu bot ficar online
client.login(process.env.TOKEN);