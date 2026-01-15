import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth.js'

/**
 * Generic data fetching hook - eliminates duplicate API patterns
 */
export function useAPI(apiCall, dependencies = [], options = {}) {
  const [data, setData] = useState(options.initialData || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isAuthenticated } = useAuth()

  const fetchData = useCallback(async (...args) => {
    if (!isAuthenticated && options.requireAuth) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall(...args)
      setData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message)
      if (options.fallbackData) {
        setData(options.fallbackData)
      }
    } finally {
      setLoading(false)
    }
  }, [apiCall, isAuthenticated, options.requireAuth, options.fallbackData])

  useEffect(() => {
    fetchData()
  }, dependencies)

  const refetch = useCallback((...args) => fetchData(...args), [fetchData])

  return { data, loading, error, refetch }
}

/**
 * Search and filter hook - eliminates duplicate search logic
 */
export function useSearch(items = [], searchFields = ['name']) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  
  const filteredItems = useState(() => {
    let result = items

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(item =>
        searchFields.some(field => {
          const value = field.split('.').reduce((obj, key) => obj?.[key], item)
          return value?.toString().toLowerCase().includes(term)
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          const itemValue = key.split('.').reduce((obj, k) => obj?.[k], item)
          return itemValue === value
        })
      }
    })

    return result
  }, [items, searchTerm, filters, searchFields])

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setFilters({})
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    filters,
    updateFilter,
    clearFilters,
    filteredItems,
  }
}

/**
 * Pagination hook - eliminates duplicate pagination logic
 */
export function usePagination(items = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }, [totalPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

/**
 * Form state hook - eliminates duplicate form logic
 */
export function useForm(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  const setFieldTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validate = useCallback(() => {
    const newErrors = {}
    
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = values[field]
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${field} is required`
        return
      }
      
      if (rules.minLength && value?.length < rules.minLength) {
        newErrors[field] = `${field} must be at least ${rules.minLength} characters`
        return
      }
      
      if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Invalid email format'
        return
      }
      
      if (rules.custom && typeof rules.custom === 'function') {
        const customError = rules.custom(value, values)
        if (customError) {
          newErrors[field] = customError
          return
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validationRules])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  }
}