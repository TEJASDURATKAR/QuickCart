import { Inngest } from "inngest";
import User from '../models/userModel.js';
import connectDb from '../config/db.js';



     // Your Mongoose user model

// 1. Create an Inngest client instance
export const inngest = new Inngest({ id: "quickcart-next" });

// 2. Define the function to sync user creation from Clerk
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { id, email, first_name, last_name, image_url } = event.data;

    // Connect to MongoDB
    await connectDb();

    // Create a user document
    await step.run("save-user", async () => {
      const existingUser = await User.findById(id);
      if (existingUser) {
        return; // Avoid duplicate entries
      }

      await User.create({
        _id: id,
        name: `${first_name} ${last_name}`,
        email,
        image: image_url,
        cartItems: {}
      });
    });
  }
);

// Inngest Function to update user data in the database
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { id, email, first_name, last_name, image_url } = event.data;

    await connectDb();

    await step.run("update-user", async () => {
      await User.findByIdAndUpdate(
        id,
        {
          name: `${first_name} ${last_name}`,
          email,
          image: image_url,
        },
        { new: true, upsert: false } // only update existing users
      );
    });
  }
);

// Inngest Function to update user data in the database
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-delete-from-clerk" },  // <== new unique ID
  { event: "clerk/user.deleted" },       // <== correct event for deletion
  async ({ event, step }) => {
    const { id, email, first_name, last_name, image_url } = event.data;

    await connectDb();

    await step.run("update-user", async () => {
      await User.findByIdAndUpdate(
        id,
        {
          name: `${first_name} ${last_name}`,
          email,
          image: image_url,
        },
        { new: true, upsert: false } // only update existing users
      );
    });
  }
);

// Inngest Function to delete a user from the database
export const deleteUser = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    const { id } = event.data;

    await connectDb();

    await step.run("delete-user", async () => {
      await User.findByIdAndDelete(id);
    });
  }
);