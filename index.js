const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Add conversation memory storage
const conversations = new Map();

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Therapy Scheduler AI - Test Server Running');
});

const systemPrompt = `You are a therapy practice assistant for Heart and Mind Healing. 

PRACTICE DETAILS:
- Located in Denver, Colorado
- Sessions are 50 minutes, with transition at 45 minutes
- Specializing in high-achieving professionals
- Focus on work-related stress, anxiety, depression, and trauma

SERVICES AND RATES:
- Individual therapy sessions
- Payment due at time of service
- No insurance accepted
- \$180 per session

SCHEDULING:
- Office hours: 10 AM to 4 PM
- Initial consultation available
- Both in-person and virtual sessions available
- 24-hour cancellation policy

LOCATIONS SERVED:
- 11 Denver neighborhoods
- Virtual sessions available

Keep responses professional and under 50 words. Maintain context of the conversation. If you asked about appointment preferences, acknowledge their choice and continue scheduling.`;

app.post('/voice', async (req, res) => {
    try {
        const twiml = new twilio.twiml.VoiceResponse();
        const gather = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 'auto'
        });
        
        gather.say({ voice: 'alice' }, 
            "Hi, I'm Alice from Heart and Mind Healing. How can I help you today?");
        
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
        const callSid = req.body.CallSid;
        const userInput = req.body.SpeechResult;
        console.log('User said:', userInput);

        // Get or initialize conversation history
        let conversationHistory = conversations.get(callSid) || [];
        
        // Add user's input to history
        conversationHistory.push({
            role: "user",
            content: userInput
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...conversationHistory // Include previous conversation
            ]
        });

        const aiResponse = completion.choices[0].message.content;
        
        // Save AI response to conversation history
        conversationHistory.push({
            role: "assistant",
            content: aiResponse
        });
        
        // Update conversation history
        conversations.set(callSid, conversationHistory);

        // Clean up old conversations after 10 minutes
        setTimeout(() => {
            conversations.delete(callSid);
        }, 600000);

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
