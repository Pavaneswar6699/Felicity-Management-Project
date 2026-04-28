require('dotenv').config();
const mongoose=require('mongoose');

const connectDB=async()=>{
  try {
    const cdb=await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected:', cdb.connection.host);
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

module.exports=connectDB;