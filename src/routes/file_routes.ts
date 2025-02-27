import express, { Request, Response } from "express";
import { uploadMiddleware } from '../middleware/uploadService'

const router = express.Router();

router.post('/api/upload', uploadMiddleware, (req, res) => {
    if (req.file) {
        res.send({ fileUrl: `/uploads/${req.file.filename}` });
    } else {
        res.status(400).send('No file uploaded.');
    }
});


export default router;