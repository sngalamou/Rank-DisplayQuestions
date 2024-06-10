const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'json');

fs.readdir(folderPath, (err, files) => {
    if (err) {
        console.error('Error reading directory', err);
        return;
    }
    
    files.forEach(file => {
        if (path.extname(file) === '.json') {
            const filePath = path.join(folderPath, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`Error reading file ${file}`, err);
                    return;
                }
                try {
                    JSON.parse(data);
                    console.log(`File ${file} is valid JSON.`);
                } catch (e) {
                    console.error(`File ${file} has invalid JSON: ${e.message}`);
                }
            });
        }
    });
});
