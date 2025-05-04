const express = require('express');
const http = require('http');
const cors = require('cors');
const cron = require("node-cron");

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Signup = require("./auth/Signup");
const Login = require("./auth/Login");
const initializeSocket = require("./socket/socketmain");
const Passwordreset = require("./auth/passreset");
const Message = require("./schemas/messageschema");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: "https://just-frd-chatapp-2.onrender.com/", 
  methods: ["GET", "POST", "PUT"],
  credentials: true,
}));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    
    cron.schedule("* * * * *", async () => {
     

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      try {
        const result = await Message.deleteMany({
          seen: true,
          seenAt: { $lte: oneDayAgo },
        });

        if (result.deletedCount > 0) {
          console.log(`${result.deletedCount} old seen messages deleted`);
        } 
      } catch (err) {
        console.error("Error deleting old seen messages:", err);
      }
    });
  })
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes and socket init
app.use('/', Signup);
app.use('/', Login);
app.use('/', Passwordreset);

initializeSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});