import mognoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    clerkId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    photo: { type: String, required: true },
    planId: { type: Number, default: 1 },
    creditBalance: { type: Number, default: 10 },
})

const User = models?.User || model('User', UserSchema); 
export default User;
