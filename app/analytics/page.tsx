import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import dbConnect from '@/lib/db'
import Invoice from '@/models/Invoice'
import Client from '@/models/Client'
import User from '@/models/User'

async function getAnalyticsData() {
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
    const draftInvoices = invoices.filter(inv => inv.status === 'draft')
    
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0)
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Calculate monthly revenue for the last 12 months
    const monthlyRevenue = []
    const currentDate = new Date()
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0)
      
      const monthInvoices = paidInvoices.filter(inv => {
        const paidDate = new Date(inv.paidAt || inv.updatedAt)
        return paidDate >= monthStart && paidDate <= monthEnd
      })
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0)
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        count: monthInvoices.length
      })
    }

    // Get top clients by revenue
    const clientRevenue = {}
    const clientInvoiceCount = {}
    
    paidInvoices.forEach(invoice => {
      const clientName = invoice.clientId.name
      clientRevenue[clientName] = (clientRevenue[clientName] || 0) + invoice.total
      clientInvoiceCount[clientName] = (clientInvoiceCount[clientName] || 0) + 1
    })
    
    const topClients = Object.entries(clientRevenue)
      .map(([name, totalPaid]) => ({ 
        name, 
        totalPaid, 
        invoiceCount: clientInvoiceCount[name] || 0 
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10)

    // Calculate payment trends
    const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0
    const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 0
    const revenueGrowth = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0

    // Calculate average invoice value
    const averageInvoiceValue = paidInvoices.length > 0 
      ? totalRevenue / paidInvoices.length 
      : 0

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentInvoices = invoices.filter(inv => 
      new Date(inv.createdAt) >= thirtyDaysAgo
    ).length

    const recentPayments = paidInvoices.filter(inv => 
      new Date(inv.paidAt || inv.updatedAt) >= thirtyDaysAgo
    ).length

    return {
      totalRevenue,
      totalInvoices,
      totalClients,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      draftInvoices: draftInvoices.length,
      pendingAmount,
      overdueAmount,
      monthlyRevenue,
      topClients,
      revenueGrowth,
      averageInvoiceValue,
      recentInvoices,
      recentPayments,
      currentMonthRevenue,
      previousMonthRevenue
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return null
  }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const data = await getAnalyticsData()

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
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
      change: `${data.revenueGrowth >= 0 ? '+' : ''}${data.revenueGrowth.toFixed(1)}%`,
      changeType: data.revenueGrowth >= 0 ? 'positive' : 'negative'
    },
    {
      name: 'Total Invoices',
      value: data.totalInvoices.toString(),
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `${data.recentInvoices} this month`,
      changeType: 'neutral'
    },
    {
      name: 'Total Clients',
      value: data.totalClients.toString(),
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `${data.topClients.length} active`,
      changeType: 'neutral'
    },
    {
      name: 'Avg. Invoice Value',
      value: `$${data.averageInvoiceValue.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: `${data.recentPayments} paid this month`,
      changeType: 'positive'
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500'
      case 'sent':
        return 'bg-blue-500'
      case 'draft':
        return 'bg-gray-500'
      case 'overdue':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
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

        {/* Invoice Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Status Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Paid</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{data.paidInvoices}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    (${data.totalRevenue.toLocaleString()})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{data.pendingInvoices}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    (${data.pendingAmount.toLocaleString()})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Draft</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{data.draftInvoices}</span>
              </div>
              {data.overdueInvoices > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-600">Overdue</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">{data.overdueInvoices}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      (${data.overdueAmount.toLocaleString()})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Revenue Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Monthly Revenue</h3>
              <ChartBarIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {data.monthlyRevenue.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.max(5, (item.revenue / Math.max(...data.monthlyRevenue.map(m => m.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">${item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Clients by Revenue</h3>
          {data.topClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg. Value
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topClients.map((client, index) => (
                    <tr key={client.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${client.totalPaid.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {client.invoiceCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${(client.totalPaid / client.invoiceCount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients yet</h3>
              <p className="mt-1 text-sm text-gray-500">Start by adding your first client.</p>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                <p className={`text-2xl font-semibold ${
                  data.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.revenueGrowth >= 0 ? '+' : ''}{data.revenueGrowth.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${data.currentMonthRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">in revenue</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {data.totalInvoices > 0 ? Math.round((data.paidInvoices / data.totalInvoices) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-500">invoices paid</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 