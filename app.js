// app.js
const express = require('express');
const { Command } = require('commander');
const app = express();
const program = new Command();

// Налаштування команд за допомогою Commander.js
program
    .option('-p, --port <port>', 'set port', '3000')
    .parse(process.argv);

const port = program.port;

// Простий роут на Express
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});