import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import startCronJobs from "./src/utils/cronJobs.js";

dotenv.config();
connectDB();
startCronJobs();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
