import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import dbConnect from '@/lib/db'
import Invoice from '@/models/Invoice'
import Client from '@/models/Client'
import User from '@/models/User'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

async function getDashboardData() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  try {
    await dbConnect()
    
    // Get user
    const user = await User.findOne({ email: session.user.email })
    if (!user) return null

    // Get all invoices for the user
    const invoices = await Invoice.find({ userId: user._id })
      .populate('clientId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)

    // Get all clients for the user
    const clients = await Client.find({ userId: user._id })

    // Calculate statistics
    const totalInvoices = invoices.length
    const totalClients = clients.length
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid')
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent')
    const overdueInvoices = invoices.filter(inv => {
      return inv.status === 'sent' && new Date(inv.dueDate) < new Date()
    })
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Get recent invoices for display
    const recentInvoices = invoices.slice(0, 5).map(invoice => ({
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientId.name,
      amount: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
    }))

    // Calculate monthly revenue for the last 6 months
    const monthlyRevenue = []
    const currentDate = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
      
      const monthInvoices = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.paidAt || inv.updatedAt)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0)
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      })
    }

    // Get top clients by revenue
    const clientRevenue = {}
    paidInvoices.forEach(invoice => {
      const clientName = invoice.clientId.name
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + invoice.total
    })
    
    const topClients = Object.entries(clientRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Email statistics
    const emailStats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      notSent: 0
    }

    const recentEmailActivity = []

    for (const invoice of invoices) {
      if (invoice.emailStatus) {
        emailStats.totalSent++
        if (invoice.emailStatus === 'delivered') {
          emailStats.delivered++
        } else if (invoice.emailStatus === 'failed') {
          emailStats.failed++
        } else {
          emailStats.notSent++
        }
      }

      if (invoice.lastEmailedAt) {
        recentEmailActivity.push({
          invoiceNumber: invoice.invoiceNumber,
          clientName: invoice.clientId.name,
          emailType: invoice.emailType || 'invoice',
          status: invoice.emailStatus || 'sent',
          sentAt: invoice.lastEmailedAt
        })
      }
    }

    return {
      totalInvoices,
      totalClients,
      totalRevenue,
      pendingInvoices: pendingInvoices.length,
      pendingAmount,
      overdueInvoices: overdueInvoices.length,
      overdueAmount,
      recentInvoices,
      monthlyRevenue,
      topClients,
      paidInvoices: paidInvoices.length,
      emailStats,
      recentEmailActivity
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return null
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const data = await getDashboardData()

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Invoices',
      value: data.totalInvoices.toString(),
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${data.paidInvoices} paid`,
      changeType: 'neutral'
    },
    {
      name: 'Total Clients',
      value: data.totalClients.toString(),
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '+2 this month',
      changeType: 'positive'
    },
    {
      name: 'Pending Amount',
      value: `$${data.pendingAmount.toLocaleString()}`,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: `${data.pendingInvoices} invoices`,
      changeType: 'neutral'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).getTime() !== new Date().setHours(0, 0, 0, 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.bgColor} rounded-lg p-3`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {data.overdueInvoices > 0 && (
          <div className="card p-4 bg-red-50 border-red-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {data.overdueInvoices} overdue invoice{data.overdueInvoices > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-700">
                  Total overdue amount: ${data.overdueAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Revenue Trend</h2>
              <ChartBarIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between h-32">
              {data.monthlyRevenue.map((month, index) => (
                <div key={month.month} className="flex flex-col items-center">
                  <div 
                    className="bg-primary-600 rounded-t w-8 mb-2"
                    style={{ 
                      height: `${Math.max(10, (month.revenue / Math.max(...data.monthlyRevenue.map(m => m.revenue))) * 80)}px` 
                    }}
                  ></div>
                  <span className="text-xs text-gray-600">{month.month}</span>
                  <span className="text-xs font-medium text-gray-900">${month.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        {data.topClients.length > 0 && (
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Top Clients by Revenue</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {data.topClients.map((client, index) => (
                <div key={client.name} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${client.revenue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
              <Link href="/invoices" className="text-sm text-primary-600 hover:text-primary-500">
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {data.recentInvoices.length > 0 ? (
              data.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-500">{invoice.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        ${invoice.amount.toLocaleString()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Due {new Date(invoice.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
                <div className="mt-6">
                  <Link href="/invoices/new" className="btn btn-primary">
                    Create Invoice
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/invoices/new" className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <DocumentTextIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Create Invoice</h3>
                <p className="text-sm text-gray-600">Generate a new invoice for your client</p>
              </div>
            </div>
          </Link>

          <Link href="/clients/new" className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <UserGroupIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Add Client</h3>
                <p className="text-sm text-gray-600">Add a new client to your database</p>
              </div>
            </div>
          </Link>

          <Link href="/analytics" className="card p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">View Analytics</h3>
                <p className="text-sm text-gray-600">Check your business performance</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Email Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Email Overview */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Email Statistics</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.emailStats.delivered}</div>
                  <div className="text-sm text-gray-500">Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{data.emailStats.totalSent - data.emailStats.delivered}</div>
                  <div className="text-sm text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.emailStats.failed}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{data.emailStats.notSent}</div>
                  <div className="text-sm text-gray-500">Not Sent</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Emails:</span>
                  <span className="font-medium">{data.emailStats.totalSent + data.emailStats.notSent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivery Rate:</span>
                  <span className="font-medium">
                    {data.emailStats.totalSent > 0 
                      ? `${Math.round((data.emailStats.delivered / data.emailStats.totalSent) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Status */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Invoice Status</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Paid</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.paidInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.pendingInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{data.overdueInvoices}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
                <Link href="/invoices" className="text-sm text-indigo-600 hover:text-indigo-900">
                  View all
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {data.recentInvoices.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  No invoices yet
                </div>
              ) : (
                data.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          {invoice.emailStatus && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEmailStatusColor(invoice.emailStatus)}`}>
                              {invoice.emailStatus === 'delivered' && <EnvelopeIcon className="h-3 w-3 mr-1" />}
                              {invoice.emailStatus}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{invoice.clientName}</p>
                        <p className="text-xs text-gray-400">
                          Due {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                          {isOverdue(invoice.dueDate) && invoice.status !== 'paid' && (
                            <span className="ml-2 text-red-600">(Overdue)</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${invoice.amount.toFixed(2)}</p>
                        {invoice.lastEmailedAt && (
                          <p className="text-xs text-gray-500">
                            Emailed {format(new Date(invoice.lastEmailedAt), 'MMM dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Email Activity */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Email Activity</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {data.recentEmailActivity.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">
                  No email activity yet
                </div>
              ) : (
                data.recentEmailActivity.map((activity, index) => (
                  <div key={index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {activity.emailType === 'invoice' ? 'Invoice' : 'Reminder'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {activity.invoiceNumber}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{activity.clientName}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(activity.sentAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEmailStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 