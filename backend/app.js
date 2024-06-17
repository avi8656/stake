const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const cors = require('cors');
// const bodyParser = require('body-parser');
require('dotenv').config({path : "./config/config.env"});



app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// Route import
const userRoute = require('./routes/userRoute');
const paymentRoute = require('./routes/paymentRoute');



app.use(cors({
  origin: 'http://localhost:3000',
    credentials: true,
}));



// Routes
app.use('/api/v1', userRoute);
app.use('/api/v1', paymentRoute);


// Error handling middleware
const errorMiddleware = require('./middleware/error');
app.use(errorMiddleware);


module.exports = app;
