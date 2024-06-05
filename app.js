const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

const folderPath = path.join(__dirname, 'json');  // Use a relative path

app.get('/json', (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      res.status(500).send(err);
    } else {
      const jsonFiles = files.filter(file => path.extname(file) === '.json');
      res.json(jsonFiles);
    }
  });
});

app.get('/json/:filename', (req, res) => {
  const jsonFile = path.join(folderPath, req.params.filename);
  fs.readFile(jsonFile, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(JSON.parse(data));
    }
  });
});

app.post('/json/:filename', (req, res) => {
  const jsonFile = path.join(folderPath, req.params.filename);
  console.log(req.body);
  fs.writeFile(jsonFile, JSON.stringify(req.body, null, 2), 'utf8', err => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json({ message: 'File updated successfully' });
    }
  });
});

app.use(express.static(__dirname));

app.listen(3030, () => console.log('Server started on port 3030'));
