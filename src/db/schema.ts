import mongoose, { Schema, Document, Model } from "mongoose";

/* ---------------------------------- Enums --------------------------------- */
export const UserRole = ["student", "admin"] as const;
export const DocumentStatus = ["processing", "ready", "failed"] as const;
export const MessageRole = ["user", "assistant"] as const;

export type IUserRole = (typeof UserRole)[number];
export type IDocumentStatus = (typeof DocumentStatus)[number];
export type IMessageRole = (typeof MessageRole)[number];

/* ------------------------------- Source type ------------------------------ */
export interface IMessageSource {
  documentId: string;
  title: string;
  category: string;
  score: number;
  snippet: string;
}

/* --------------------------------- Models --------------------------------- */

export interface IUser extends Document {
  name: string;
  email: string;
  firebaseUid?: string;
  passwordHash?: string;
  role: IUserRole;
  createdAt: Date;
}
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: false },
  role: { type: String, enum: UserRole, default: "student" },
  createdAt: { type: Date, default: Date.now },
});
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export interface ISession extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}
const sessionSchema = new Schema<ISession>({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});
export const Session = mongoose.models.Session || mongoose.model<ISession>("Session", sessionSchema);

export interface IDoc extends Document {
  title: string;
  category: string;
  filename: string;
  mimeType: string;
  contentText: string;
  chunkCount: number;
  status: IDocumentStatus;
  summary?: string;
  version: number;
  uploadedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
}
const documentSchema = new Schema<IDoc>({
  title: { type: String, required: true },
  category: { type: String, required: true, index: true },
  filename: { type: String, required: true },
  mimeType: { type: String, default: "text/plain" },
  contentText: { type: String, required: true },
  chunkCount: { type: Number, default: 0 },
  status: { type: String, enum: DocumentStatus, default: "ready" },
  summary: { type: String },
  version: { type: Number, default: 1 },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});
export const Doc = mongoose.models.Document || mongoose.model<IDoc>("Document", documentSchema);

export interface IChunk extends Document {
  documentId: mongoose.Types.ObjectId;
  chunkIndex: number;
  content: string;
  embedding: number[]; // 1024-dim dense vector
  termSet: string[];
  tokenCount: number;
}
const chunkSchema = new Schema<IChunk>({
  documentId: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
  termSet: { type: [String], required: true },
  tokenCount: { type: Number, default: 0 },
});
export const Chunk = mongoose.models.Chunk || mongoose.model<IChunk>("Chunk", chunkSchema);

export interface IKbStats extends Document<string> {
  _id: string;
  df: Record<string, number>;
  chunkTotal: number;
  updatedAt: Date;
}
const kbStatsSchema = new Schema<IKbStats>({
  _id: { type: String, required: true }, // e.g. "global"
  df: { type: Map, of: Number, required: true },
  chunkTotal: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});
export const KbStats = mongoose.models.KbStats || mongoose.model<IKbStats>("KbStats", kbStatsSchema);

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
const conversationSchema = new Schema<IConversation>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "New conversation" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>("Conversation", conversationSchema);

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  role: IMessageRole;
  content: string;
  sources?: IMessageSource[];
  confidence?: number;
  feedback?: 1 | -1;
  createdAt: Date;
}
const messageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  role: { type: String, enum: MessageRole, required: true },
  content: { type: String, required: true },
  sources: { type: Schema.Types.Mixed },
  confidence: { type: Number },
  feedback: { type: Number, enum: [1, -1] },
  createdAt: { type: Date, default: Date.now },
});
export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  documentId: mongoose.Types.ObjectId;
  createdAt: Date;
}
const faqSchema = new Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true, index: true },
  documentId: { type: Schema.Types.ObjectId, ref: "Doc", required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});
export const FAQ = mongoose.models.FAQ || mongoose.model<IFAQ>("FAQ", faqSchema);
