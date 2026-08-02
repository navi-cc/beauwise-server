import express, { type Response } from 'express';
import { userRouter } from './routes/user.route.js';
import { learnRouter } from '@routes/learn.route.js';
import { errorHandler } from '@middleware/error.js';
import { authenticate } from '@middleware/auth.js';

const app = express();

app.get('/', (_, res: Response) => {
	res.sendStatus(200);
});

app.use(express.json());
app.use(authenticate);
app.use('/users', userRouter);
app.use('/learn', learnRouter);
app.use(errorHandler);
export { app };
