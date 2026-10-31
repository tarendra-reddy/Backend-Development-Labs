
const express = require('express');

const app = express();
const PORT = 3000;

// GET / - Welcome route
app.get('/', (req, res) => {
    res.status(200).send('Welcome to my Node.js and Express server!');
});

// GET /about - About route
app.get('/about', (req, res) => {
    res.status(200).json({
        name: 'Tarendra Reddy',
        section: 'CSE GEN AI 2C'
    });
});

// GET /time - Current date and time
app.get('/time', (req, res) => {
    res.status(200).json({
        currentDateTime: new Date()
    });
});

// 404 - Unknown routes
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
