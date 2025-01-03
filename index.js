const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Therapy Scheduler AI - Test Server Running');
});

// Handle initial call
app.post('/voice', async (req, res) => {
    try {
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Get AI greeting
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "You are a friendly therapy practice assistant. Keep responses under 30 words."
                },
                {
                    "role": "user",
                    "content": "Generate a welcoming greeting asking how you can help them today."
                }
            ]
        });

        const aiGreeting = completion.choices[0].message.content;
        
        // Say greeting and gather speech input
        const gather = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 'auto'
        });
        
        gather.say({ voice: 'alice' }, aiGreeting);
        
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

// Handle voice response
app.post('/handle-response', async (req, res) => {
    try {
        const userInput = req.body.SpeechResult;
        console.log('User said:', userInput);

        // Get AI response to user's input
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "You are a friendly therapy practice assistant. Keep responses under 50 words and professional. Focus on scheduling, services, and general practice information."
                },
                {
                    "role": "user",
                    "content": userInput
                }
            ]
        });

        const aiResponse = completion.choices[0].message.content;
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Respond and gather next input
        const gather = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 'auto'
        });
        
        gather.say({ voice: 'alice' }, aiResponse);
        
        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        console.error('Error:', error);
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say({ voice: 'alice' }, 'I apologize, but I had trouble understanding. Could you please repeat that?');
        res.type('text/xml');
        res.send(twiml.toString());
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log('Server running on port:', port);
});

