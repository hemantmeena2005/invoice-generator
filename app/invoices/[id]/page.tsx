'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeftIcon, DocumentArrowDownIcon, CreditCardIcon, PencilIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'
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
  emailStatus?: string
  lastEmailedAt?: string
  emailLogs?: Array<{
    sentAt: string
    emailType: string
    recipient: string
    status: string
    messageId?: string
  }>
}

export default function InvoiceViewPage() {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string

  useEffect(() => {
    fetchInvoice()
    fetchEmailStatus()
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

  const fetchEmailStatus = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`)
      if (response.ok) {
        const data = await response.json()
        setEmailStatus(data)
      }
    } catch (error) {
      console.error('Error fetching email status:', error)
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

  const handleSendEmail = async (emailType: 'invoice' | 'reminder') => {
    setEmailLoading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailType }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchInvoice() // Refresh invoice data
        fetchEmailStatus() // Refresh email status
      } else {
        const error = await response.json()
        alert(`Failed to send email: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('An error occurred while sending email')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchInvoice()
    fetchEmailStatus()
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

  const hasClientEmail = invoice.clientId.email && invoice.clientId.email.trim() !== ''

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
              {hasClientEmail && (
                <div className="relative">
                  <button
                    onClick={() => handleSendEmail('invoice')}
                    disabled={emailLoading}
                    className="btn-primary inline-flex items-center disabled:opacity-50"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    {emailLoading ? 'Sending...' : 'Send Invoice'}
                  </button>
                </div>
              )}
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

        {/* Email Status */}
        {hasClientEmail && emailStatus && (
          <div className="card mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Email Status</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmailStatusColor(emailStatus.emailStatus)}`}>
                      {emailStatus.emailStatus || 'Not sent'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Sent:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {emailStatus.lastEmailedAt 
                      ? new Date(emailStatus.lastEmailedAt).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Client Email:</span>
                  <p className="text-sm font-medium text-gray-900">{invoice.clientId.email}</p>
                </div>
              </div>
              
              {/* Email Actions */}
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleSendEmail('invoice')}
                  disabled={emailLoading}
                  className="btn-secondary btn-sm inline-flex items-center disabled:opacity-50"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-1" />
                  {emailLoading ? 'Sending...' : 'Send Invoice'}
                </button>
                {invoice.status === 'sent' && (
                  <button
                    onClick={() => handleSendEmail('reminder')}
                    disabled={emailLoading}
                    className="btn-secondary btn-sm inline-flex items-center disabled:opacity-50"
                  >
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {emailLoading ? 'Sending...' : 'Send Reminder'}
                  </button>
                )}
              </div>

              {/* Email Logs */}
              {emailStatus.emailLogs && emailStatus.emailLogs.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Email History</h4>
                  <div className="space-y-2">
                    {emailStatus.emailLogs.map((log: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{log.emailType === 'invoice' ? 'Invoice' : 'Reminder'}</span>
                          <span className="text-gray-500 ml-2">
                            sent to {log.recipient}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEmailStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          <span className="text-gray-500">
                            {new Date(log.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!hasClientEmail && (
          <div className="card mb-6 bg-yellow-50 border-yellow-200">
            <div className="p-4">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    No client email available
                  </h3>
                  <p className="text-sm text-yellow-700">
                    Add an email address to the client to enable email invoicing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Invoice Details</h2>
              </div>
              <div className="p-6">
                {/* Client Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Bill To:</h3>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{invoice.clientId.name}</p>
                    {invoice.clientId.company && <p>{invoice.clientId.company}</p>}
                    {invoice.clientId.address && (
                      <div>
                        {invoice.clientId.address.street && <p>{invoice.clientId.address.street}</p>}
                        <p>
                          {[
                            invoice.clientId.address.city,
                            invoice.clientId.address.state,
                            invoice.clientId.address.zipCode
                          ].filter(Boolean).join(', ')}
                        </p>
                        {invoice.clientId.address.country && <p>{invoice.clientId.address.country}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Invoice Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Items</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rate
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900">{item.description}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.rate.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900 text-right">${item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                      <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes and Terms */}
                {(invoice.notes || invoice.terms) && (
                  <div className="mt-6 space-y-4">
                    {invoice.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Notes:</h4>
                        <p className="text-sm text-gray-600">{invoice.notes}</p>
                      </div>
                    )}
                    {invoice.terms && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Terms & Conditions:</h4>
                        <p className="text-sm text-gray-600">{invoice.terms}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Issue Date:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Due Date:</span>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                {invoice.paidAt && (
                  <div>
                    <span className="text-sm text-gray-500">Paid Date:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(invoice.paidAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Total Amount:</span>
                  <p className="text-lg font-bold text-gray-900">${invoice.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 