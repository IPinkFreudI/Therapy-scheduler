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

const systemPrompt = `You are a therapy practice assistant for Heart and Mind Healing. 
PRACTICE DETAILS:
- Located in Denver, Colorado
- Sessions are 50 minutes, with transition at 45 minutes
- Focus on work-related stress, anxiety, depression, and adjustment issues

SERVICES AND RATES:
- No insurance accepted
- Payment is collected overnight automatically

SCHEDULING:
- Office hours: 10 AM to 4 PM
- Initial consultation available
- Both in-person and virtual sessions available
- 48-hour cancellation policy

LOCATIONS SERVED:
- 11 Denver neighborhoods
- Virtual sessions available

Keep responses professional and under 50 words. Always end with a relevant follow-up question.`;

app.post('/voice', async (req, res) => {
    try {
        const twiml = new twilio.twiml.VoiceResponse();
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: "Generate a welcoming greeting asking how you can help them today."
                }
            ]
        });

        const aiGreeting = completion.choices[0].message.content;
        
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

app.post('/handle-response', async (req, res) => {
    try {
        const userInput = req.body.SpeechResult;
        console.log('User said:', userInput);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        });

        const aiResponse = completion.choices[0].message.content;
        
        const twiml = new twilio.twiml.VoiceResponse();
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
