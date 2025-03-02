import OpenAI from "openai";
import { config } from "../config/config"
const fs = require('fs');
const path = require('path');


export const openai = new OpenAI({
    apiKey: config.OPEN_AI_SECRET
});

export const subjectsForPost = [
    "Harry Potter and the Philosopher's Stone",
    "The Lord of the Rings: The Return of the King",
    "Inception",
    "Fight Club",
    "The Matrix",
    "Interstellar",
    "The Social Network",
    "Mad Max: Fury Road",
    "The Wolf of Wall Street",
    "Parasite",
    "Whiplash",
    "Joker",
    "Avengers: Endgame",
    "La La Land",
    "Black Panther",
    "Spider-Man: Into the Spider-Verse",
    "Toy Story 3",
    "Frozen",
    "The Grand Budapest Hotel",
    "Guardians of the Galaxy",
    "Get Out",
    "Coco",
    "A Star is Born",
    "Once Upon a Time in Hollywood"
];
export const generateDescForPostWithAi = async (subject: string) => {
    const prompt = `Write a description in 10 words about the destination ${subject} that will be look likes a post description in instagram, with the name of the destination`;
    const response: any = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
    });

    return response.choices[0].message.content;
};

export const generatePostWithAi = async (subject: string) => {
    const prompt = `Generate image of the  destination: ${subject}`;
    const response: any = await openai.images.generate({
        prompt,
        n: 1,
        size: '512x512',
        response_format: 'b64_json'
    });

    return response.data[0].b64_json
};



export const downloadBase64Image = async (base64Image: string, fileName: string) => {
    try {
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const fullFolderPath = path.resolve(__dirname, '../config/uploads');
        if (!fs.existsSync(fullFolderPath)) {
            fs.mkdirSync(fullFolderPath, { recursive: true });
        }

        const filePath = path.join(fullFolderPath, fileName);
        fs.writeFileSync(filePath, buffer);
        console.log('Image saved at: ' + filePath);
    } catch (error) {
        console.error('Error saving base64 image:', error);
    }
}