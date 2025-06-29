import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Invoice from '@/models/Invoice';
import Client from '@/models/Client';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all invoices for the user
    const invoices = await Invoice.find({ userId: user._id })
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });

    // Get all clients for the user
    const clients = await Client.find({ userId: user._id });

    // Calculate basic stats
    const totalInvoices = invoices.length;
    const totalClients = clients.length;
    const totalRevenue = invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + invoice.total, 0);

    // Invoice status counts
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'sent');
    const overdueInvoices = invoices.filter(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const today = new Date();
      return dueDate < today && invoice.status !== 'paid';
    });

    // Email statistics
    const emailStats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      notSent: 0
    };

    const recentEmailActivity = [];

    for (const invoice of invoices) {
      if (invoice.emailStatus && invoice.emailStatus !== 'not_sent') {
        emailStats.totalSent++;
        if (invoice.emailStatus === 'delivered') {
          emailStats.delivered++;
        } else if (invoice.emailStatus === 'failed') {
          emailStats.failed++;
        } else if (invoice.emailStatus === 'sent') {
          emailStats.totalSent++;
        }
      } else {
        emailStats.notSent++;
      }

      // Add to recent email activity if email was sent
      if (invoice.lastEmailedAt && invoice.emailLogs && invoice.emailLogs.length > 0) {
        const latestEmail = invoice.emailLogs[invoice.emailLogs.length - 1];
        recentEmailActivity.push({
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientId.name,
          emailType: latestEmail.emailType,
          status: latestEmail.status,
          sentAt: latestEmail.sentAt
        });
      }
    }

    // Sort recent email activity by date
    recentEmailActivity.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    // Get recent invoices with email status
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      _id: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      clientId: {
        name: invoice.clientId.name,
        email: invoice.clientId.email
      },
      total: invoice.total,
      status: invoice.status,
      emailStatus: invoice.emailStatus,
      lastEmailedAt: invoice.lastEmailedAt,
      dueDate: invoice.dueDate
    }));

    // Get top clients by revenue
    const clientRevenue = {};
    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const clientId = invoice.clientId._id.toString();
        clientRevenue[clientId] = (clientRevenue[clientId] || 0) + invoice.total;
      }
    });

    const topClients = Object.entries(clientRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([clientId, revenue]) => {
        const client = clients.find(c => c._id.toString() === clientId);
        return {
          id: clientId,
          name: client?.name || 'Unknown Client',
          revenue: revenue as number,
          invoiceCount: invoices.filter(inv => 
            inv.clientId._id.toString() === clientId && inv.status === 'paid'
          ).length
        };
      });

    // Monthly revenue for the last 6 months
    const monthlyRevenue = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      
      const monthRevenue = invoices
        .filter(invoice => {
          const paidDate = new Date(invoice.paidAt || invoice.createdAt);
          return invoice.status === 'paid' && 
                 paidDate >= month && 
                 paidDate <= monthEnd;
        })
        .reduce((sum, invoice) => sum + invoice.total, 0);

      monthlyRevenue.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }

    return NextResponse.json({
      totalRevenue,
      totalInvoices,
      totalClients,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      emailStats,
      recentInvoices,
      recentEmailActivity: recentEmailActivity.slice(0, 10),
      topClients,
      monthlyRevenue
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 