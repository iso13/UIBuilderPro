
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    // Get all users
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log("No users found in the database.");
      process.exit(0);
    }
    
    console.log("Available users:");
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} ${user.isAdmin ? "(admin)" : ""}`);
    });
    
    rl.question("Enter the number of the user to toggle admin status: ", async (answer) => {
      const userIndex = parseInt(answer) - 1;
      
      if (isNaN(userIndex) || userIndex < 0 || userIndex >= allUsers.length) {
        console.log("Invalid selection");
        rl.close();
        return;
      }
      
      const selectedUser = allUsers[userIndex];
      const newAdminStatus = !selectedUser.isAdmin;
      
      await db
        .update(users)
        .set({ isAdmin: newAdminStatus })
        .where(eq(users.id, selectedUser.id));
      
      console.log(`Updated ${selectedUser.email} admin status to: ${newAdminStatus}`);
      rl.close();
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

rl.on("close", () => {
  process.exit(0);
});

main();
