const mongoose = require('mongoose');

// Function to connect to MongoDB
const connectDatabase = () => {
    const dbUri = process.env.DB_URI;
    
    if (!dbUri) {
        console.error('Error: DB_URI environment variable is not set.');
        return;
    }

    mongoose.connect(dbUri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
    })
    .then((data) => {
        console.log(`MongoDB connected with host: ${data.connection.host}`);
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });
};

// Export the connectDatabase function
module.exports = connectDatabase;
