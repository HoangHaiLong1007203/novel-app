import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Novel from '../models/Novel.js';

dotenv.config();

const checkNormalized = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const novels = await Novel.find({}, 'title titleNormalized author authorNormalized').limit(5);
    novels.forEach(novel => {
      console.log(`Title: ${novel.title} -> Normalized: ${novel.titleNormalized}`);
      console.log(`Author: ${novel.author} -> Normalized: ${novel.authorNormalized}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

checkNormalized();