import { initializeApp } from "firebase/app";
import {
  getVertexAI,
  getGenerativeModel,
  getImagenModel,
} from "@firebase/vertexai";

// TODO(developer) Replace the following with your app's Firebase configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize FirebaseApp
const firebaseApp = initializeApp(firebaseConfig);

// Initialize the Vertex AI service
const vertexAI = getVertexAI(firebaseApp);

// Initialize the generative model with a model that supports your use case
// Gemini 1.5 models are versatile and can be used with all API capabilities
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });

// Wrap in an async function so you can use await
async function geminiApi(prompt: string) {
  console.log("GeminiAPI called with prompt:", prompt);

  try {
    console.log("Attempting Firebase Vertex AI call...");
    // Try Firebase Vertex AI first
    const result = await model.generateContent(prompt);
    console.log("Firebase Vertex AI raw result:", result);

    const response = result.response;
    console.log("Firebase Vertex AI response:", response);

    const text = response.text().replace("```json", "").replace("```", "");
    console.log("Cleaned text:", text);

    return text;
  } catch (error) {
    console.error("Firebase Vertex AI call failed:", error);
    console.log("Falling back to direct Gemini API call...");

    try {
      // Fall back to direct Gemini API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      console.log("Direct Gemini API response status:", response.status);
      const data = await response.json();
      console.log("Direct Gemini API raw data:", data);

      const text = data.candidates[0].content.parts[0].text
        .replace("```json", "")
        .replace("```", "");
      console.log("Cleaned text from direct API:", text);
      return text;
    } catch (fallbackError) {
      console.error("Direct Gemini API call also failed:", fallbackError);
      throw fallbackError;
    }
  }
}

const imagenModel = getImagenModel(vertexAI, {
  model: "imagen-3.0-generate-002",
  // Configure the model to generate multiple images for each request
  // See: https://firebase.google.com/docs/vertex-ai/model-parameters
  generationConfig: {
    numberOfImages: 1,
  },
});

const generateImage = async (prompt: string) => {
  const finalPrompt = `Only stick figure images of yoga poses, no faces, no genders, no children. ${prompt}`;
  const response = await imagenModel.generateImages(finalPrompt);
  // If fewer images were generated than were requested,
  // then `filteredReason` will describe the reason they were filtered out
  if (response.filteredReason) {
    console.log(response.filteredReason);
  }
  if (response.images.length == 0) {
    throw new Error("No images in the response.");
  }
  const images = response.images[0];
  return images;
};

export { geminiApi, generateImage };
