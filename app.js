const express = require('express');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

const folderPath = path.join(__dirname, 'json');  // Use a relative path

// Function to validate file names
const validateFileName = (fileName) => {
  const validFileNameRegex = /^[a-zA-Z0-9_-]+\.json$/;
  return validFileNameRegex.test(fileName);
};

// Function to validate JSON data
const validateJSONData = (data) => {
  try {
    JSON.parse(JSON.stringify(data));  // Try to stringify and parse the data
    return true;
  } catch (e) {
    return false;
  }
};

app.get('/json', (req, res) => {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      res.status(500).send({ error: 'Error reading directory', details: err });
    } else {
      const jsonFiles = files.filter(file => path.extname(file) === '.json');
      res.json(jsonFiles.map(file => ({ fileName: file }))); // Ensure to pass the filename correctly
    }
  });
});

app.get('/json/:filename', (req, res) => {
  const fileName = req.params.filename;
  console.log('Requested filename:', fileName); // Log the requested filename

  if (!validateFileName(fileName)) {
    return res.status(400).send({ error: 'Invalid file name' });
  }

  const jsonFile = path.join(folderPath, fileName);
  fs.readFile(jsonFile, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send({ error: 'Error reading file', details: err });
    } else {
      res.json(JSON.parse(data));
    }
  });
});

app.post('/json/:filename', (req, res) => {
  const fileName = req.params.filename;

  if (!validateFileName(fileName)) {
    return res.status(400).send({ error: 'Invalid file name' });
  }

  if (!validateJSONData(req.body)) {
    return res.status(400).send({ error: 'Invalid JSON data' });
  }

  const jsonFile = path.join(folderPath, fileName);
  fs.writeFile(jsonFile, JSON.stringify(req.body, null, 2), 'utf8', err => {
    if (err) {
      res.status(500).send({ error: 'Error writing file', details: err });
    } else {
      res.json({ message: 'File updated successfully' });
    }
  });
});

app.use(express.static(__dirname));

const port = process.env.PORT || 3030;
app.listen(port, () => console.log(`Server started on port ${port}`));
