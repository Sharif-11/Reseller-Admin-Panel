import { useEffect, useState } from 'react'
import commissionApi from '../Api/commission.api'
import ConfirmationModal from './ConfirmationModal'

type CommissionRange = {
  startPrice: number
  endPrice: number | null
  commission: number
  level: number
}

type CommissionTableData = {
  priceRanges: {
    startPrice: number
    endPrice: number | null
  }[]
  levels: number[]
  commissions: Record<string, number> // Key format: "startPrice|endPrice|level"
}

const CommissionTable = () => {
  const [, setInitialData] = useState<CommissionTableData | null>(null)
  const [tableData, setTableData] = useState<CommissionTableData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfig, setDeleteConfig] = useState<{
    type: 'level' | 'range'
    level?: number
    rangeIndex?: number
  } | null>(null)

  // Store temporary input values to prevent focus loss
  const [tempPriceInputs, setTempPriceInputs] = useState<Record<string, string>>({})
  const [tempCommissionInputs, setTempCommissionInputs] = useState<Record<string, string>>({})

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  // Fetch commission table on mount
  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        setIsLoading(true)
        const { success, message, data, error } = await commissionApi.getCommissionTable()
        if (success) {
          const commissions = data as CommissionRange[]

          // Extract unique price ranges
          const priceRanges = Array.from(
            new Set(commissions.map(c => `${c.startPrice}|${c.endPrice}`))
          )
            .map(range => {
              const [startPrice, endPrice] = range.split('|')
              return {
                startPrice: parseFloat(startPrice),
                endPrice: endPrice === 'null' ? null : parseFloat(endPrice),
              }
            })
            .sort((a, b) => a.startPrice - b.startPrice)

          // Extract unique levels
          const levels = Array.from(new Set(commissions.map(c => c.level))).sort((a, b) => a - b)

          // Create commissions map
          const commissionsMap: Record<string, number> = {}
          commissions.forEach(c => {
            const key = `${c.startPrice}|${c.endPrice}|${c.level}`
            commissionsMap[key] = c.commission
          })

          const formattedData = {
            priceRanges,
            levels,
            commissions: commissionsMap,
          }

          setInitialData(formattedData)
          setTableData(formattedData)
          setSuccess('Commission table loaded successfully')
        } else {
          const errorMsg = error?.message || message || 'Failed to load commission table'
          setError(errorMsg)
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || 'Failed to load commission table'
        setError(errorMsg)
        console.error('Failed to load commission table:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommissions()
  }, [])

  // Add new level
  const addLevel = () => {
    if (!tableData) return

    const newLevel = Math.max(...tableData.levels, 0) + 1
    const newCommissions = { ...tableData.commissions }

    // Add 0 commission for all price ranges for the new level
    tableData.priceRanges.forEach(range => {
      const key = `${range.startPrice}|${range.endPrice}|${newLevel}`
      newCommissions[key] = 0
    })

    setTableData({
      ...tableData,
      levels: [...tableData.levels, newLevel],
      commissions: newCommissions,
    })

    setSuccess(`Level ${newLevel} added`)
  }

  // Add new price range
  const addPriceRange = () => {
    if (!tableData) return

    // Calculate new start price (last range end + 1 or 1 if empty)
    const lastRange = tableData.priceRanges[tableData.priceRanges.length - 1]
    const newStartPrice = lastRange ? (lastRange.endPrice || lastRange.startPrice) + 1 : 1

    // Create new price ranges array with updated end price for previous last range
    const newPriceRanges = [...tableData.priceRanges]

    if (lastRange) {
      // Update the end price of the previous last range
      newPriceRanges[newPriceRanges.length - 1] = {
        ...lastRange,
        endPrice: newStartPrice,
      }
    }

    // Add the new range
    newPriceRanges.push({
      startPrice: newStartPrice,
      endPrice: null, // Open-ended
    })

    // Add commissions for all levels for the new range
    const newCommissions = { ...tableData.commissions }
    tableData.levels.forEach(level => {
      const key = `${newStartPrice}|${null}|${level}`
      newCommissions[key] = 0
    })

    setTableData({
      ...tableData,
      priceRanges: newPriceRanges,
      commissions: newCommissions,
    })

    setSuccess('New price range added')
  }

  // Handle price range input change (store temporarily)
  const handlePriceRangeInputChange = (
    rangeIndex: number,
    field: 'startPrice' | 'endPrice',
    value: string
  ) => {
    const key = `${rangeIndex}-${field}`
    setTempPriceInputs(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle price range input blur (commit to state)
  const handlePriceRangeInputBlur = (
    rangeIndex: number,
    field: 'startPrice' | 'endPrice',
    value: string
  ) => {
    if (!tableData) return

    const key = `${rangeIndex}-${field}`
    const numericValue = value === '' ? null : parseFloat(value) || 0

    const newPriceRanges = [...tableData.priceRanges]
    newPriceRanges[rangeIndex] = {
      ...newPriceRanges[rangeIndex],
      [field]: numericValue,
    }

    setTableData(prev =>
      prev
        ? {
            ...prev,
            priceRanges: newPriceRanges,
          }
        : null
    )

    // Clear temp input
    setTempPriceInputs(prev => {
      const newTemp = { ...prev }
      delete newTemp[key]
      return newTemp
    })
  }

  // Handle commission input change (store temporarily)
  const handleCommissionInputChange = (rangeIndex: number, level: number, value: string) => {
    const key = `${rangeIndex}-${level}`
    setTempCommissionInputs(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  // Handle commission input blur (commit to state)
  const handleCommissionInputBlur = (rangeIndex: number, level: number, value: string) => {
    if (!tableData) return

    const range = tableData.priceRanges[rangeIndex]
    const commissionKey = `${range.startPrice}|${range.endPrice}|${level}`
    const tempKey = `${rangeIndex}-${level}`

    setTableData(prev =>
      prev
        ? {
            ...prev,
            commissions: {
              ...prev.commissions,
              [commissionKey]: value === '' ? 0 : parseFloat(value) || 0,
            },
          }
        : null
    )

    // Clear temp input
    setTempCommissionInputs(prev => {
      const newTemp = { ...prev }
      delete newTemp[tempKey]
      return newTemp
    })
  }

  // Get display value for price range input
  const getPriceRangeDisplayValue = (
    rangeIndex: number,
    field: 'startPrice' | 'endPrice',
    actualValue: number | null
  ): string => {
    const key = `${rangeIndex}-${field}`
    if (tempPriceInputs.hasOwnProperty(key)) {
      return tempPriceInputs[key]
    }
    return actualValue === null || actualValue === 0 ? '' : actualValue.toString()
  }

  // Get display value for commission input
  const getCommissionDisplayValue = (
    rangeIndex: number,
    level: number,
    actualValue: number
  ): string => {
    const key = `${rangeIndex}-${level}`
    if (tempCommissionInputs.hasOwnProperty(key)) {
      return tempCommissionInputs[key]
    }
    return actualValue === 0 ? '' : actualValue.toString()
  }

  // Delete price range
  const deletePriceRange = (rangeIndex: number) => {
    if (!tableData) return

    const rangeToDelete = tableData.priceRanges[rangeIndex]

    // Create new price ranges array without the deleted range
    const newPriceRanges = tableData.priceRanges.filter((_, i) => i !== rangeIndex)

    // Remove all commissions for the deleted range
    const newCommissions = { ...tableData.commissions }
    tableData.levels.forEach(level => {
      const key = `${rangeToDelete.startPrice}|${rangeToDelete.endPrice}|${level}`
      delete newCommissions[key]
    })

    setTableData({
      ...tableData,
      priceRanges: newPriceRanges,
      commissions: newCommissions,
    })

    setSuccess('Price range deleted')
    setShowDeleteModal(false)
    setDeleteConfig(null)
  }

  // Delete level
  const deleteLevel = (level: number) => {
    if (!tableData || tableData.levels.length <= 1) {
      setError('Must have at least one level')
      return
    }

    // Remove the level from levels array
    const newLevels = tableData.levels.filter(l => l !== level)

    // Remove all commissions for this level
    const newCommissions = { ...tableData.commissions }
    Object.keys(newCommissions).forEach(key => {
      const [, , keyLevel] = key.split('|')
      if (parseInt(keyLevel) === level) {
        delete newCommissions[key]
      }
    })

    setTableData({
      ...tableData,
      levels: newLevels,
      commissions: newCommissions,
    })

    setSuccess(`Level ${level} deleted`)
    setShowDeleteModal(false)
    setDeleteConfig(null)
  }

  // Save all changes
  const saveChanges = async () => {
    if (!tableData) return

    try {
      setIsSaving(true)
      setError(null)

      // Convert to backend format
      const commissionRanges: CommissionRange[] = []

      tableData.priceRanges.forEach(range => {
        tableData.levels.forEach(level => {
          const key = `${range.startPrice}|${range.endPrice}|${level}`
          commissionRanges.push({
            startPrice: range.startPrice,
            endPrice: range.endPrice,
            level,
            commission: tableData.commissions[key] || 0,
          })
        })
      })

      // Save to backend
      const { success, message, error } = await commissionApi.replaceCommissionTable(
        commissionRanges
      )

      if (!success) {
        throw new Error(error?.message || message || 'Failed to save changes')
      }

      // Update initial data and clear temp inputs
      setInitialData(tableData)
      setTempPriceInputs({})
      setTempCommissionInputs({})
      setSuccess(message || 'Changes saved successfully')
    } catch (error: any) {
      setError(error.message || 'Failed to save changes')
      console.error('Failed to save changes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
      </div>
    )
  }

  if (!tableData) {
    return <div className='p-4 text-red-500'>Failed to load commission data. Please try again.</div>
  }

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold text-gray-800 mb-4'>Commission Management</h1>

      {/* Success Message */}
      {success && (
        <div className='mb-4 p-3 bg-green-50 text-green-800 border border-green-200 rounded'>
          <strong>Success:</strong> {success}
          <button
            onClick={() => setSuccess(null)}
            className='float-right text-green-600 hover:text-green-800'
          >
            ✖
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='mb-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded whitespace-pre-line'>
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError(null)}
            className='float-right text-red-600 hover:text-red-800'
          >
            ✖
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex flex-wrap gap-2 mb-4'>
        <button
          onClick={addPriceRange}
          disabled={isSaving}
          className='px-3 py-2 bg-indigo-600 text-white rounded-md text-sm flex items-center disabled:opacity-50'
        >
          <span className='mr-1'>+</span> Add Price Range
        </button>
        <button
          onClick={addLevel}
          disabled={isSaving}
          className='px-3 py-2 bg-green-600 text-white rounded-md text-sm flex items-center disabled:opacity-50'
        >
          <span className='mr-1'>+</span> Add Level
        </button>

        {/* Always visible Save button */}
        <button
          onClick={saveChanges}
          disabled={isSaving}
          className='px-3 py-2 bg-blue-600 text-white rounded-md text-sm flex items-center disabled:opacity-50 ml-auto'
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Commission Table */}
      <div className='overflow-x-auto bg-white rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Price Range
              </th>
              {tableData.levels.map(level => (
                <th
                  key={level}
                  className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  <div className='flex items-center justify-between'>
                    <span>Level {level}</span>
                    {tableData.levels.length > 1 && (
                      <button
                        onClick={() => {
                          setDeleteConfig({ type: 'level', level })
                          setShowDeleteModal(true)
                        }}
                        disabled={isSaving}
                        className='text-red-500 hover:text-red-700 text-xs disabled:opacity-50'
                        title='Delete level'
                      >
                        ❌
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {tableData.priceRanges.length === 0 ? (
              <tr>
                <td
                  colSpan={tableData.levels.length + 2}
                  className='px-4 py-4 text-center text-sm text-gray-500'
                >
                  No commission data available
                </td>
              </tr>
            ) : (
              tableData.priceRanges.map((range, rangeIndex) => (
                <tr
                  key={`${rangeIndex}-${range.startPrice}-${range.endPrice}`}
                  className='hover:bg-gray-50'
                >
                  <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                    <div className='flex items-center'>
                      <input
                        type='text'
                        value={getPriceRangeDisplayValue(
                          rangeIndex,
                          'startPrice',
                          range.startPrice
                        )}
                        onChange={e =>
                          handlePriceRangeInputChange(rangeIndex, 'startPrice', e.target.value)
                        }
                        onBlur={e =>
                          handlePriceRangeInputBlur(rangeIndex, 'startPrice', e.target.value)
                        }
                        className='w-20 p-1 border border-gray-300 rounded mr-1'
                        placeholder='Start'
                      />
                      <span>-</span>
                      <input
                        type='text'
                        value={getPriceRangeDisplayValue(rangeIndex, 'endPrice', range.endPrice)}
                        onChange={e =>
                          handlePriceRangeInputChange(rangeIndex, 'endPrice', e.target.value)
                        }
                        onBlur={e =>
                          handlePriceRangeInputBlur(rangeIndex, 'endPrice', e.target.value)
                        }
                        className='w-20 p-1 border border-gray-300 rounded ml-1'
                        placeholder='End'
                      />
                      <button
                        onClick={() => {
                          setDeleteConfig({ type: 'range', rangeIndex })
                          setShowDeleteModal(true)
                        }}
                        disabled={isSaving || tableData.priceRanges.length <= 1}
                        className='ml-2 text-red-500 hover:text-red-700 text-xs disabled:opacity-50'
                        title='Delete price range'
                      >
                        ❌
                      </button>
                    </div>
                  </td>

                  {tableData.levels.map(level => {
                    const key = `${range.startPrice}|${range.endPrice}|${level}`
                    const commission = tableData.commissions[key] || 0

                    return (
                      <td key={level} className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                        <input
                          type='text'
                          value={getCommissionDisplayValue(rangeIndex, level, commission)}
                          onChange={e =>
                            handleCommissionInputChange(rangeIndex, level, e.target.value)
                          }
                          onBlur={e => handleCommissionInputBlur(rangeIndex, level, e.target.value)}
                          className='w-20 p-1 border border-gray-300 rounded'
                          placeholder='0'
                        />
                      </td>
                    )
                  })}

                  <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                    {/* Additional actions can be added here */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeleteConfig(null)
        }}
        onConfirm={() => {
          if (!deleteConfig) return

          if (deleteConfig.type === 'level' && deleteConfig.level !== undefined) {
            deleteLevel(deleteConfig.level)
          } else if (deleteConfig.type === 'range' && deleteConfig.rangeIndex !== undefined) {
            deletePriceRange(deleteConfig.rangeIndex)
          }
        }}
        title={deleteConfig?.type === 'level' ? 'Delete Level' : 'Delete Price Range'}
        message={
          deleteConfig?.type === 'level'
            ? `Are you sure you want to delete Level ${deleteConfig.level}?`
            : `Are you sure you want to delete price range ${
                deleteConfig?.rangeIndex !== undefined
                  ? tableData.priceRanges[deleteConfig.rangeIndex].startPrice +
                    (tableData.priceRanges[deleteConfig.rangeIndex].endPrice
                      ? `-${tableData.priceRanges[deleteConfig.rangeIndex].endPrice}`
                      : '-∞')
                  : ''
              }?`
        }
        confirmText='Delete'
        cancelText='Cancel'
      />

      {/* Instructions */}
      <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
        <h3 className='text-sm font-medium text-blue-800 mb-2'>Instructions:</h3>
        <ul className='text-xs text-blue-700 space-y-1 list-disc pl-5'>
          <li>Enter numeric values (e.g., 100, 50.5)</li>
          <li>Leave empty or enter 0 for zero values</li>
          <li>Leave end price empty for open-ended ranges</li>
          <li>Values are saved when you click outside the input field</li>
          <li>Click "Save Changes" to submit your updates to the server</li>
        </ul>
      </div>
    </div>
  )
}

export default CommissionTable
