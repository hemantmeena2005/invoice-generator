import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const EmailLogSchema = new mongoose.Schema({
  sentAt: {
    type: Date,
    default: Date.now,
  },
  messageId: String,
  emailType: {
    type: String,
    enum: ['invoice', 'reminder'],
    required: true,
  },
  recipient: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent',
  },
  error: String,
});

const InvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: [InvoiceItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: String,
  terms: String,
  stripePaymentIntentId: String,
  paidAt: Date,
  emailLogs: [EmailLogSchema],
  lastEmailedAt: Date,
  emailStatus: {
    type: String,
    enum: ['not_sent', 'sent', 'delivered', 'failed'],
    default: 'not_sent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

InvoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema); 