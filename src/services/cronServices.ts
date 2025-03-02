import { createPostGeneratedByAI } from "../controllers/posts_controller"

const cron = require('node-cron');

cron.schedule('0 0 * * *', async () => {
    try {
        await createPostGeneratedByAI();
        console.log('executed cron job successfully');
    } catch (e) {
        console.log('failed to execure cron job, got the error:', e);
    }
});