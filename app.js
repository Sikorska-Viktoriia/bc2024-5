const { program } = require('commander');
const { exit } = require('process');
const express = require('express');
const path = require('path');
const fs = require('fs');

program
    .option('-h, --host <char>', 'server address')
    .option('-p, --port <int>', 'server port')
    .option('-c, --cache <char>', 'path to directory, where cache files will be stored');

program.parse();

const options = program.opts();

if (!options.host) {
    console.error("Please enter host");
    exit(1);
}
if (!options.port) {
    console.error("Please enter port");
    exit(1);
}
if (!options.cache) {
    console.error("Enter path to cache directory");
    exit(1);
}

const app = express();

// Для обробки JSON, текстових запитів
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true })); // Для обробки form-data

// Перевірка наявності каталогу для кешу
const cacheDirectory = path.resolve(options.cache);
if (!fs.existsSync(cacheDirectory)) {
    fs.mkdirSync(cacheDirectory, { recursive: true });
}

app.get('/', function(req, res) {
    res.send('Hello World');
});

app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cacheDirectory, `${noteName}.txt`);

    fs.readFile(notePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('Нотатка не знайдена');
        }
        res.status(200).send(data);
    });
});

app.put('/notes/:name', (req, res) => {
    console.log(req.body); // Лог для перевірки даних
    const noteName = req.params.name;
    const notePath = path.join(cacheDirectory, `${noteName}.txt`);
    let noteContent = req.body;

    // Переконатися, що вміст нотатки - це рядок
    if (typeof noteContent !== 'string') {
        noteContent = JSON.stringify(noteContent); // Якщо це об'єкт, перетворимо його на рядок
    }

    if (!noteContent) {
        return res.status(400).send('Вміст нотатки не може бути порожнім');
    }

    fs.writeFile(notePath, noteContent, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Помилка сервера', error: err });
        }
        res.status(200).send('Нотатка успішно оновлена');
    });
});
app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cacheDirectory, `${noteName}.txt`);

    fs.unlink(notePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('Нотатку не знайдено');
            } else {
                return res.status(500).json({ message: 'Помилка сервера', error: err });
            }
        }
        res.status(200).send('Нотатку успішно видалено');
    });
});

app.post('/write', (req, res) => {
    const noteName = req.body.note_name;
    let noteContent = req.body.note;

    // Переконатися, що вміст нотатки - це рядок
    if (typeof noteContent !== 'string') {
        noteContent = JSON.stringify(noteContent); // Якщо це об'єкт, перетворимо його на рядок
    }

    if (!noteContent) {
        return res.status(400).send('Вміст нотатки не може бути порожнім');
    }

    const notePath = path.join(cacheDirectory, `${noteName}.txt`);

    if (fs.existsSync(notePath)) {
        return res.status(400).send('Нотатка з такою назвою вже існує');
    } else {
        fs.writeFile(notePath, noteContent, 'utf-8', (err) => {
            if (err) {
                return res.status(500).json({ message: 'Помилка сервера', error: err });
            }
            res.status(201).send('Нотатка успішно створена');
        });
    }
});

app.get('/notes', (req, res) => {
    const notesInCache = fs.readdirSync(cacheDirectory);
    console.log(notesInCache);

    const notes = notesInCache.map((note) => {
        const noteName = path.basename(note, '.txt');
        const notePath = path.join(cacheDirectory, note);
        const noteText = fs.readFileSync(notePath, 'utf8');
        return {
            name: noteName,
            text: noteText
        };
    });
    res.status(200).json(notes);
});

app.get('/UploadForm.html', (req, res) => {
    const htmlPage = fs.readFileSync('./UploadForm.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlPage);
});

app.listen(options.port, options.host, () => {
    console.log(`Server is working on http://${options.host}:${options.port}`);
});