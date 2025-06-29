'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeftIcon, PencilIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Client {
  _id: string
  name: string
  email: string
  phone?: string
  company?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  createdAt: string
}

export default function ClientViewPage() {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      } else {
        router.push('/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading client...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Client not found</p>
          <Link href="/clients" className="btn-primary mt-4">
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const formatAddress = () => {
    const { address } = client
    if (!address) return 'No address provided'
    
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean)
    
    return parts.length > 0 ? parts.join(', ') : 'No address provided'
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Clients
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600">Client Information</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Link
                href={`/clients/${clientId}/edit`}
                className="btn-primary inline-flex items-center"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Client
              </Link>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-600">
                    {client.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    {client.company}
                  </p>
                )}
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {client.email}
                </p>
                {client.phone && (
                  <p className="text-sm text-gray-500 flex items-center mt-1">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {client.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-2" />
                Address
              </h4>
              <p className="text-sm text-gray-600">
                {formatAddress()}
              </p>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Client since:</span>
                  <p className="text-gray-900">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Client ID:</span>
                  <p className="text-gray-900 font-mono text-xs">
                    {client._id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/invoices/new?clientId=${clientId}`}
              className="card p-4 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">Create Invoice</h4>
                  <p className="text-sm text-gray-600">Generate a new invoice for this client</p>
                </div>
              </div>
            </Link>

            <Link
              href="/clients"
              className="card p-4 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-100 rounded-lg p-3">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium text-gray-900">View All Clients</h4>
                  <p className="text-sm text-gray-600">Return to the clients list</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 