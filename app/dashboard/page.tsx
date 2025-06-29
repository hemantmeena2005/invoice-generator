import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CurrencyDollarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

async function getDashboardData() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  // In a real app, you'd fetch this data from your API
  // For now, we'll return mock data
  return {
    totalInvoices: 24,
    totalClients: 12,
    totalRevenue: 45600,
    pendingInvoices: 8,
    recentInvoices: [
      {
        id: '1',
        invoiceNumber: 'INV-2024001',
        clientName: 'Acme Corp',
        amount: 2500,
        status: 'paid',
        dueDate: '2024-01-15',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024002',
        clientName: 'Tech Solutions',
        amount: 1800,
        status: 'sent',
        dueDate: '2024-01-20',
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024003',
        clientName: 'Design Studio',
        amount: 3200,
        status: 'draft',
        dueDate: '2024-01-25',
      },
    ],
  }
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/auth/signin')
  }

  const data = await getDashboardData()

  if (!data) {
    return <div>Loading...</div>
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Invoices',
      value: data.totalInvoices.toString(),
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Clients',
      value: data.totalClients.toString(),
      icon: UserGroupIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Pending Invoices',
      value: data.pendingInvoices.toString(),
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
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
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-lg p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
            {data.recentInvoices.map((invoice) => (
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
            ))}
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
      </div>
    </DashboardLayout>
  )
} 