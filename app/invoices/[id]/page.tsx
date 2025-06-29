'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeftIcon, DocumentArrowDownIcon, CreditCardIcon, PencilIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { format } from 'date-fns'

interface Invoice {
  _id: string
  invoiceNumber: string
  clientId: {
    name: string
    email: string
    company?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  issueDate: string
  dueDate: string
  notes?: string
  terms?: string
  paidAt?: string
}

export default function InvoiceViewPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      } else {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      router.push('/invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoice?.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Failed to create payment session')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      alert('An error occurred while processing payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchInvoice()
  }

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Invoice not found</p>
          <Link href="/invoices" className="btn-primary mt-4">
            Back to Invoices
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Invoices
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-gray-600">Invoice for {invoice.clientId.name}</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={handleRefresh}
                className="btn-secondary inline-flex items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <Link
                href={`/invoices/${invoiceId}/edit`}
                className="btn-secondary inline-flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Link>
              <button
                onClick={handleDownloadPDF}
                className="btn-secondary inline-flex items-center"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Download PDF
              </button>
              {invoice.status !== 'paid' && (
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="btn-primary inline-flex items-center disabled:opacity-50"
                >
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  {paymentLoading ? 'Processing...' : 'Pay Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">From</h3>
              <div className="text-gray-600">
                <p className="font-medium">Your Company Name</p>
                <p>your@email.com</p>
                <p>Your Address</p>
              </div>
            </div>

            {/* To */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">To</h3>
              <div className="text-gray-600">
                <p className="font-medium">{invoice.clientId.name}</p>
                <p>{invoice.clientId.email}</p>
                {invoice.clientId.company && <p>{invoice.clientId.company}</p>}
                {invoice.clientId.address && (
                  <div>
                    {invoice.clientId.address.street && <p>{invoice.clientId.address.street}</p>}
                    <p>
                      {invoice.clientId.address.city && `${invoice.clientId.address.city}, `}
                      {invoice.clientId.address.state && `${invoice.clientId.address.state} `}
                      {invoice.clientId.address.zipCode}
                    </p>
                    {invoice.clientId.address.country && <p>{invoice.clientId.address.country}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Issue Date</p>
              <p className="font-medium">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
            {invoice.paidAt && (
              <p className="text-sm text-gray-500 mt-1">
                Paid on {format(new Date(invoice.paidAt), 'MMM dd, yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${item.rate.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                <span>${invoice.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Terms</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 