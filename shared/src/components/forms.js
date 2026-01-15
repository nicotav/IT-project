/**
 * Shared form components and validation utilities
 * Eliminates duplicate form patterns across all frontends
 */
import React, { useState, useCallback } from 'react'
import { FormInput, LoadingSpinner, ErrorMessage } from './index.js'

/**
 * Generic Form Hook - eliminates duplicate form state management
 */
export function useForm(initialValues = {}, validationSchema = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }, [errors])

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validate = useCallback(() => {
    const newErrors = {}
    
    Object.keys(validationSchema).forEach(field => {
      const rules = validationSchema[field]
      const value = values[field]

      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${rules.label || field} is required`
        return
      }

      if (value && rules.minLength && value.length < rules.minLength) {
        newErrors[field] = `${rules.label || field} must be at least ${rules.minLength} characters`
        return
      }

      if (value && rules.maxLength && value.length > rules.maxLength) {
        newErrors[field] = `${rules.label || field} must be no more than ${rules.maxLength} characters`
        return
      }

      if (value && rules.pattern && !rules.pattern.test(value)) {
        newErrors[field] = rules.patternMessage || `${rules.label || field} format is invalid`
        return
      }

      if (rules.custom) {
        const customError = rules.custom(value, values)
        if (customError) {
          newErrors[field] = customError
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true)
    setTouched(Object.keys(validationSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    try {
      if (validate()) {
        await onSubmit(values)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, validationSchema])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
    validate
  }
}

/**
 * Standard Ticket Form Component
 */
export function TicketForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  companies = [],
  priorities = ['Low', 'Medium', 'High', 'Critical'],
  categories = ['Hardware', 'Software', 'Network', 'Security', 'General']
}) {
  const validationSchema = {
    title: { required: true, label: 'Title', maxLength: 200 },
    description: { required: true, label: 'Description' },
    company_id: { required: true, label: 'Company' },
    priority: { required: true, label: 'Priority' },
    category: { required: true, label: 'Category' }
  }

  const form = useForm({
    title: '',
    description: '',
    company_id: '',
    priority: 'Medium',
    category: 'General',
    ...initialData
  }, validationSchema)

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit) }}>
      <div className="space-y-4">
        <FormInput
          label="Title"
          value={form.values.title}
          onChange={(e) => form.setValue('title', e.target.value)}
          onBlur={() => form.setFieldTouched('title')}
          error={form.touched.title && form.errors.title}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.values.description}
            onChange={(e) => form.setValue('description', e.target.value)}
            onBlur={() => form.setFieldTouched('description')}
            rows={4}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
              form.touched.description && form.errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {form.touched.description && form.errors.description && (
            <p className="mt-1 text-sm text-red-600">{form.errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            value={form.values.company_id}
            onChange={(e) => form.setValue('company_id', e.target.value)}
            onBlur={() => form.setFieldTouched('company_id')}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
              form.touched.company_id && form.errors.company_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
          {form.touched.company_id && form.errors.company_id && (
            <p className="mt-1 text-sm text-red-600">{form.errors.company_id}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={form.values.priority}
              onChange={(e) => form.setValue('priority', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.values.category}
              onChange={(e) => form.setValue('category', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={form.isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={form.isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {form.isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            'Save Ticket'
          )}
        </button>
      </div>
    </form>
  )
}

/**
 * Standard Article Form Component
 */
export function ArticleForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  categories = ['General', 'Troubleshooting', 'Procedures', 'Policies'],
  isEditMode = false
}) {
  const validationSchema = {
    title: { required: true, label: 'Title', maxLength: 200 },
    content: { required: true, label: 'Content' },
    category: { required: true, label: 'Category' },
    tags: { 
      custom: (value) => {
        if (value && value.split(',').some(tag => tag.trim().length > 50)) {
          return 'Each tag must be less than 50 characters'
        }
      }
    }
  }

  const form = useForm({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    is_published: false,
    ...initialData,
    tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : (initialData.tags || '')
  }, validationSchema)

  const handleFormSubmit = (formData) => {
    const submitData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
    }
    onSubmit(submitData)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(handleFormSubmit) }}>
      <div className="space-y-4">
        <FormInput
          label="Title"
          value={form.values.title}
          onChange={(e) => form.setValue('title', e.target.value)}
          onBlur={() => form.setFieldTouched('title')}
          error={form.touched.title && form.errors.title}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.values.category}
            onChange={(e) => form.setValue('category', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <FormInput
          label="Tags (comma-separated)"
          value={form.values.tags}
          onChange={(e) => form.setValue('tags', e.target.value)}
          onBlur={() => form.setFieldTouched('tags')}
          error={form.touched.tags && form.errors.tags}
          placeholder="e.g. network, troubleshooting, windows"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.values.content}
            onChange={(e) => form.setValue('content', e.target.value)}
            onBlur={() => form.setFieldTouched('content')}
            rows={12}
            className={`block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
              form.touched.content && form.errors.content ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {form.touched.content && form.errors.content && (
            <p className="mt-1 text-sm text-red-600">{form.errors.content}</p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_published"
            checked={form.values.is_published}
            onChange={(e) => form.setValue('is_published', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
            Publish article
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={form.isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={form.isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {form.isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">{isEditMode ? 'Updating...' : 'Creating...'}</span>
            </>
          ) : (
            isEditMode ? 'Update Article' : 'Create Article'
          )}
        </button>
      </div>
    </form>
  )
}

/**
 * Standard Company Form Component
 */
export function CompanyForm({ initialData = {}, onSubmit, onCancel }) {
  const validationSchema = {
    name: { required: true, label: 'Company Name', maxLength: 100 },
    email: { 
      required: true, 
      label: 'Email',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address'
    },
    phone: { label: 'Phone' },
    address: { label: 'Address' }
  }

  const form = useForm({
    name: '',
    email: '',
    phone: '',
    address: '',
    ...initialData
  }, validationSchema)

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit) }}>
      <div className="space-y-4">
        <FormInput
          label="Company Name"
          value={form.values.name}
          onChange={(e) => form.setValue('name', e.target.value)}
          onBlur={() => form.setFieldTouched('name')}
          error={form.touched.name && form.errors.name}
          required
        />

        <FormInput
          label="Email"
          type="email"
          value={form.values.email}
          onChange={(e) => form.setValue('email', e.target.value)}
          onBlur={() => form.setFieldTouched('email')}
          error={form.touched.email && form.errors.email}
          required
        />

        <FormInput
          label="Phone"
          value={form.values.phone}
          onChange={(e) => form.setValue('phone', e.target.value)}
          onBlur={() => form.setFieldTouched('phone')}
          error={form.touched.phone && form.errors.phone}
        />

        <FormInput
          label="Address"
          value={form.values.address}
          onChange={(e) => form.setValue('address', e.target.value)}
          onBlur={() => form.setFieldTouched('address')}
          error={form.touched.address && form.errors.address}
        />
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={form.isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={form.isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {form.isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            'Save Company'
          )}
        </button>
      </div>
    </form>
  )
}