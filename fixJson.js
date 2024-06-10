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
                    fixJsonFile(filePath, data);
                }
            });
        }
    });
});

function fixJsonFile(filePath, data) {
    // Attempt to fix common JSON errors
    try {
        // Remove trailing commas
        data = data.replace(/,\s*([}\]])/g, '$1');
        
        // Ensure proper array and object closures
        if (data.lastIndexOf('}') !== data.length - 1 && data.lastIndexOf(']') !== data.length - 1) {
            data = data.trim() + '\n}';
        }

        JSON.parse(data); // Test if the fixed JSON is valid

        fs.writeFile(filePath, data, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing fixed data to file ${filePath}`, err);
            } else {
                console.log(`Fixed JSON and saved file ${filePath}`);
            }
        });
    } catch (e) {
        console.error(`Failed to fix JSON for file ${filePath}: ${e.message}`);
    }
}
