const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'stored-ips.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}), 'utf8');
}

function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return {};
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ipchecker-stateful' });
});

app.post('/save', (req, res) => {
    try {
        const { items } = req.body;

        if (!items) {
            return res.status(400).json({
                success: false,
                error: 'Missing items parameter'
            });
        }

        const id = uuidv4();
        const data = readData();

        data[id] = {
            items: items,
            timestamp: new Date().toISOString()
        };

        if (writeData(data)) {
            res.json({
                success: true,
                id: id,
                message: 'IP addresses saved successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to save data'
            });
        }
    } catch (error) {
        console.error('Error in /save:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

app.get('/load/:id', (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Missing id parameter'
            });
        }

        const data = readData();

        if (data[id]) {
            res.json({
                success: true,
                items: data[id].items,
                timestamp: data[id].timestamp
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'ID not found'
            });
        }
    } catch (error) {
        console.error('Error in /load:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Stateful service listening on port ${PORT}`);
    });
}

module.exports = app;