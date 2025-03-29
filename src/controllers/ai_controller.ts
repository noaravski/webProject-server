import { Request, response, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { text } from "body-parser";

const genAI = new GoogleGenerativeAI("AIzaSyDRPgxIL2JVr7ZgqVKlkSzUfVajeQ55J-s");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const enhanceReview = async (req: Request, res: Response) => {
  const reviewContent = req.body.content;
  const promt = `I'm sending you a json with a text field, please make the text more proffesional, and respond with a json with a text field inside it with the more proffesional text {text: "${reviewContent}"}`;

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
