const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try{

        await mongoose.connect(db,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
        console.log('MONGODB connected');

    }catch (err){
        console.error(err.message);
        // exit if fail
        process.exit(1);
    }
}

module.exports = connectDB;