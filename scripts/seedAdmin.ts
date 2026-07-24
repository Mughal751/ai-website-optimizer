import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../src/models/User';

/**
 * Promotes the user matching ADMIN_SEED_EMAIL to role "admin". Run this
 * manually (npm run seed:admin) after that user has signed up normally.
 * ADMIN_SEED_EMAIL is read only here, never compiled into client code and
 * never used as a hardcoded check anywhere in the app.
 */
async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const uri = process.env.MONGODB_URI;

  if (!email) throw new Error('ADMIN_SEED_EMAIL is not set');
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with email ${email}. Sign up with that email first, then re-run this script.`);
    process.exit(1);
  }

  console.log(`Promoted ${user.email} to admin.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
