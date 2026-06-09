/**
 * AI Service for communicating with OpenAI API
 * Powers the Platinum Personal Trainer module.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function generateMesocyclePlan(userBaselines, userPreferences) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key is missing. Please ensure VITE_OPENAI_API_KEY is defined in .env.local.',
      data: null
    };
  }

  const preferredLanguage = userPreferences?.language === 'fa' ? 'Persian/Farsi' : 'English';

  const systemPrompt = `You are an elite RP Hypertrophy coach and scientific sports programming expert.
Your job is to generate a highly optimized weekly mesocycle plan based on the user's baselines and preferences.
You must return the response as a strict JSON object.

IMPORTANT: All text values in the JSON (such as the exercise name, comments, or reason descriptions) MUST be written in ${preferredLanguage}. If Farsi, use clean, professional Persian terminology.

The JSON format must strictly follow this schema:
{
  "action": "CREATE_PLAN_OR_UPDATE_WEEK",
  "mesocycle": {
    "week": 1,
    "exercises": [
      {
        "id": "exercise_id",
        "name": "Exercise Name",
        "sets": 3,
        "reps": "8-12",
        "load": 100,
        "rpe": "3 RIR"
      }
    ]
  }
}`;

  const userPrompt = `
User Baselines:
${JSON.stringify(userBaselines, null, 2)}

User Preferences:
${JSON.stringify(userPreferences, null, 2)}

Please analyze the above data and generate the optimal hyper-optimized hypertrophy workout plan for Week 1.
`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error((errorData?.error?.message) || `OpenAI HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedPayload = JSON.parse(content);

    return {
      success: true,
      error: null,
      data: parsedPayload
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to communicate with the Platinum Trainer AI.',
      data: null
    };
  }
}

export async function sendChatMessage(userMessage, currentContext, lang) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key is missing. Please ensure VITE_OPENAI_API_KEY is defined in .env.local.',
      data: null
    };
  }

  const preferredLanguage = lang === 'fa' ? 'Persian/Farsi' : 'English';

  const systemPrompt = `You are an elite RP Hypertrophy coach and scientific sports programming expert.
The user is talking to you via the Platinum Personal Trainer Console.
Your job is to answer their questions, provide insights on their current plan, and advise on hypertrophy programming.
You have access to their current training context (JSON dump) to provide highly specific answers.

IMPORTANT: You MUST write your conversational reply in ${preferredLanguage}.
You must return the response as a strict JSON object with a single key "reply".

The JSON format must strictly follow this schema:
{
  "reply": "Your detailed, conversational response here..."
}`;

  const userPrompt = `
Current Training Context:
${JSON.stringify(currentContext, null, 2)}

User Message:
${userMessage}
`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error((errorData?.error?.message) || `OpenAI HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsedPayload = JSON.parse(content);

    return {
      success: true,
      error: null,
      data: parsedPayload
    };

  } catch (error) {
    console.error('AI Chat Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to communicate with the Platinum Trainer AI.',
      data: null
    };
  }
}
