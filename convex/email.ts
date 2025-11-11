import { action } from "./_generated/server";
import { v } from "convex/values";

// This will only work if you set up a separate email service
export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    userName: v.string(),
  },
  handler: async (_, args) => {
    // For now, just log that we would send an email
    console.log(`Would send welcome email to ${args.email} for user ${args.userName}`);
    
    // In the future, you can integrate with:
    // - Resend.com
    // - SendGrid
    // - AWS SES
    // - Or any other email service that provides a REST API
    
    return { success: true, message: "Email would be sent in production" };
  },
});