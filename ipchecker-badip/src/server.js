const express = require('express');
const cors = require('cors');
const { checkBadIPs } = require('./IPbad');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    try {
        const items = req.query.items || '';
        
        if (!items) {
            return res.json({
                error: false,
                message: 'No IP addresses provided',
                items: '',
                results: [],
                good_ips: 0,
                bad_ips: 0
            });
        }
        
        const result = checkBadIPs(items);
        res.json(result);
        
    } catch (error) {
        res.status(500).json({
            error: true,
            message: `Internal server error: ${error.message}`,
            items: '',
            results: [],
            good_ips: 0,
            bad_ips: 0
        });
    }
});

app.listen(PORT, () => {
    console.log(`Bad IP Checker running on port ${PORT}`);
});

module.exports = app;