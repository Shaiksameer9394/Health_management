/**
 * Message Model - Patient-Doctor Chat
 */

const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Conversation",
  index: true,
},
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "file", "voice", "system", "prescription_share"],
      default: "text",
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    isRead: { type: Boolean, default: false },
    readAt: Date,
    isDeleted: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, receiver: 1 });

const Message = mongoose.model("Message", MessageSchema);

// ─── Conversation Model ───────────────────────────────────────────────────────
const ConversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: Date,
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = { Message, Conversation };
