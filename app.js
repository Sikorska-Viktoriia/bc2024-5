const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const { program } = require('commander');
const { exit } = require('process');

// Command-line options
program
    .option('-h, --host <char>', 'server address')
    .option('-p, --port <int>', 'server port')
    .option('-c, --cache <char>', 'path to directory, where cache files will be stored');

program.parse();
const options = program.opts();

// Validate required parameters
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

// Setup middleware to handle different content types
app.use(express.json()); // Handles application/json
app.use(express.text()); // Handles text/plain
app.use(multer().none()); // Handles form submissions without file uploads

// Endpoint to serve home route
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Endpoint to get a specific note by name
app.get('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);

    fs.readFile(notePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('Note not found');
        }
        res.status(200).send(data);
    });
});

// PUT request to update a note
app.put('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);

    let noteContent;

    if (req.is('application/json')) {
        noteContent = req.body.note; // Extract note content from JSON
    } else if (req.is('text/plain')) {
        noteContent = req.body; // For plain text, it's the body itself
    } else {
        return res.status(400).send('Invalid content type');
    }

    if (!noteContent) {
        return res.status(400).send('The note content cannot be empty');
    }

    if (!fs.existsSync(notePath)) {
        return res.status(404).send('Note not found');
    }

    fs.writeFile(notePath, noteContent, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ message: 'Server error', error: err });
        }

        res.status(200).send('Note successfully updated');
    });
});

// Endpoint to delete a specific note
app.delete('/notes/:name', (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(options.cache, `${noteName}.txt`);

    fs.unlink(notePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('Note not found');
            } else {
                return res.status(500).json({ message: 'Server error', error: err });
            }
        }
        res.status(200).send('Note successfully deleted');
    });
});

// Endpoint to create a new note
app.post('/write', (req, res) => {
    const noteName = req.body.note_name;
    const noteContent = req.body.note;

    if (!noteName || !noteContent) {
        return res.status(400).send('Note name or content is missing');
    }

    const notePath = path.join(options.cache, `${noteName}.txt`);

    if (fs.existsSync(notePath)) {
        return res.status(400).send('Note with this name already exists');
    } else {
        fs.writeFile(notePath, noteContent, 'utf-8', (err) => {
            if (err) {
                return res.status(500).json({ message: 'Server error', error: err });
            }
            res.status(201).send('Note successfully created');
        });
    }
});

// Endpoint to get the list of all notes
app.get('/notes', (req, res) => {
    const notesInCache = fs.readdirSync(options.cache);

    const notes = notesInCache.map((note) => {
        const noteName = path.basename(note, '.txt');
        const notePath = path.join(options.cache, note);
        const noteText = fs.readFileSync(notePath, 'utf8');
        return {
            name: noteName,
            text: noteText
        };
    });
    res.status(200).json(notes);
});

// Endpoint to serve the HTML upload form (if needed)
app.get('/UploadForm.html', (req, res) => {
    const htmlPage = path.join(__dirname, 'UploadForm.html');
    res.sendFile(htmlPage);
});

// Start the server
app.listen(options.port, options.host, () => {
    console.log(`Server is working on http://${options.host}:${options.port}`);
});