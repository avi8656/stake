const app = require('./app');
const dotenv = require('dotenv');

// config
dotenv.config({path : "./config/config.env"});

const connectDatabase = require("./config/database")

process.on("uncaughtException",(err)=>{
    console.log(`Error:${err.message}`);
    console.log(`shutting down the server due to uncaught Exception`);
        process.exit(1);
});

// databaseconnection
connectDatabase();




const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
})


// unhandle promise rejection
process.on("unhandledRejection",err=>{
    console.log(`Error:${err.message}`);
    console.log(`shutting down the server due to unhandled promise rejection`);
    server.close(()=>{
        process.exit(1);
    })
})