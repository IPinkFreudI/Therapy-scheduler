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

const systemPrompt = `You are Elly, a friendly therapy practice assistant. 

PRACTICE DETAILS:
- Specializing in high-achieving professionals
- Focus on work-related stress, anxiety, depression, and trauma
- Sessions are 50 minutes, with transition at 45 minutes

SERVICES AND RATES:
- Individual therapy sessions
- Payment due at time of service
- No insurance accepted
- \$180 per session

SCHEDULING:
- Office hours: 10 AM to 4 PM
- Initial consultation available
- Both in-person and virtual sessions available
- 48-hour cancellation policy

CONVERSATION STYLE:
- Be warm and friendly, but professional
- Use conversational language rather than formal
- Listen first, then respond appropriately
- Break down scheduling into natural steps
- Don't repeatedly mention the business name or location

SCHEDULING FLOW:
1. When someone wants to schedule:
   - First ask for their name: "While I check availability, can I get your name?"
   - WAIT for their response
   - Then ask if they prefer virtual or in-person
   - Ask about preferred time of day
   - Only provide location details if specifically asked

RESPONSE GUIDELINES:
- Always wait for the caller's complete response before asking the next question
- Never combine multiple questions in one response
- Keep responses conversational and natural
- Maintain context of the conversation
- Only mention location when specifically asked
- Acknowledge their responses before moving to next question
- Use phrases like "Great!" "Sure!" "I'd be happy to help with that"

Remember to:
- Keep responses under 50 words
- Always maintain a warm, helpful tone
- Ask only one question at a time
- Stay focused on the current step in the conversation`;

app.post('/voice', async (req, res) => {
    try {
        const twiml = new twilio.twiml.VoiceResponse();
        const gather = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 10,  // First 10-second wait
        });
        
        gather.say({ voice: 'alice' }, 
            "Thanks for calling Heart and Mind Healing. My name is Elly, how can I help you today?");
        
        // If no response after first 10 seconds
        const gather2 = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 10,  // Second 10-second wait
        });
        
        gather2.say({ voice: 'alice' }, "Hey, are you still there?");
        
        // If no response after second 10 seconds
        const gather3 = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 10,  // Final 10-second wait
        });
        
        gather3.say({ voice: 'alice' }, "I can't hear you if you're talking.");
        
        // Final message before hanging up
        twiml.say({ voice: 'alice' }, "I'll need to end the call now. Please call back when you're ready to talk.");
        
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
            speechTimeout: 10,
        });
        
        gather.say({ voice: 'alice' }, aiResponse);
        
        // First silence check
        const gather2 = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 10,
        });
        
        gather2.say({ voice: 'alice' }, "Hey, are you still there?");
        
        // Second silence check
        const gather3 = twiml.gather({
            input: 'speech',
            action: '/handle-response',
            language: 'en-US',
            speechTimeout: 10,
        });
        
        gather3.say({ voice: 'alice' }, "I can't hear you if you're talking.");
        
        // Final message before hanging up
        twiml.say({ voice: 'alice' }, "I'll need to end the call now. Please call back when you're ready to talk.");
        
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
