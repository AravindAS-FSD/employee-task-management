import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

const port = process.env.PORT ?? 5000;

await connectDB(process.env.MONGODB_URI);
createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
