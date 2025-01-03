const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Parse incoming requests
app.use(express.urlencoded({ extended: true }));

// Basic webpage to show server is running
app.get('/', (req, res) => {
    res.send('Therapy Scheduler AI - Test Server Running');
});

// Handle incoming calls
app.post('/voice', async (req, res) => {
    try {
        console.log('Voice endpoint called');
        
        // Get AI response
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "You are a friendly therapy practice assistant. Keep responses under 50 words and professional."
                },
                {
                    "role": "user",
                    "content": "Generate a welcoming greeting for someone calling the therapy practice."
                }
            ]
        });

        const aiResponse = completion.choices[0].message.content;
        
        // Create TwiML response
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({ voice: 'alice' }, aiResponse);
        
        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        console.error('Error:', error);
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({ voice: 'alice' }, 'I apologize, but I encountered an error. Please try your call again.');
        res.type('text/xml');
        res.send(twiml.toString());
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Server running on port:', port);
});
