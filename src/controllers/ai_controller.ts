import { Request, response, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { text } from "body-parser";

const genAI = new GoogleGenerativeAI("AIzaSyDRPgxIL2JVr7ZgqVKlkSzUfVajeQ55J-s");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const enhanceReview = async (req: Request, res: Response) => {
  const reviewContent = req.body.content;
  const promt = `I'm sending you a json with a text field, make a positive recommendation about the movie name - ${reviewContent}. generate up to 300 characters, if the movie exists respond with a json with a text field inside it with your answer {text: "${reviewContent}"}. if the movie does not exists please return i dont know this film`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const textToReturn = JSON.parse(result.response.text()).text;

  res.send(textToReturn);
};

export { enhanceReview };
