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
                    "content": `You are a therapy practice assistant for Heart and Mind Healing. 

                    PRACTICE DETAILS:
                    - Located in Denver, Colorado
                    - Sessions are 50 minutes, with transition at 45 minutes
                    - Focus on work-related stress, anxiety, depression, and adjustment issues.
                    
                    SERVICES AND RATES:
                    - No insurance accepted
                    - Payment is collected overnight.
                    
                    SCHEDULING:
                    - Office hours: 10 AM to 4 PM
                    - Initial consultation available
                    - 33% of sessions are telehealth
                    - 24-hour cancellation policy
                    
                    LOCATIONS SERVED:
                    - 11 Denver neighborhoods
                    - Both in-person and virtual options
                    
                    RESPONSE GUIDELINES:
                    For scheduling questions:
                    - Ask for preferred day/time
                    - Mention both in-person and telehealth options
                    - Ask if they prefer morning or afternoon
                    
                    For service questions:
                    - Mention specific therapy types relevant to their needs
                    - Include pricing information
                    - Explain session structure
                    
                    For location questions:
                    - Mention Denver area coverage
                    - Discuss telehealth options
                    
                    For pricing questions:
                    - Be clear about rates
                    - Mention no insurance policy
                    - Explain payment timing
                    
                    Keep responses professional and under 50 words. Always end with a relevant follow-up question to maintain conversation.`
                },
                {
                    "role": "user",
                    "content": userInput
                }
            ],
            temperature: 0.7
        });

        const aiResponse = completion.choices[0].message.content;
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        // Gather next input with longer timeout
        const gather = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 'auto',
            timeout: 3
        });
        
        gather.say({ voice: 'alice' }, aiResponse);
        
        // Add a fallback if no input is received
        twiml.say({ voice: 'alice' }, 'I didn\'t hear anything. Please call back if you need assistance.');
        
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

