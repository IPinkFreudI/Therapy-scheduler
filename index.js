const express = require('express');
const twilio = require('twilio');
const app = express();

// Parse incoming requests
app.use(express.urlencoded({ extended: true }));

// Basic webpage to show server is running
app.get('/', (req, res) => {
    res.send('Therapy Scheduler AI - Test Server Running');
});

// Handle incoming calls
app.post('/voice', (req, res) => {
    try {
        console.log('Voice endpoint called');
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({ voice: 'alice' }, 
            'Hello! This is the therapy scheduler test system. Thank you for calling.');
        
        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        console.error('Error in /voice:', error);
        res.status(500).send('Voice Processing Error');
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Server running on port:', port);  // Changed this line
});
