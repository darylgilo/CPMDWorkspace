import React from 'react'
import { Button } from '@/components/ui/button'
import { usePopupAlert } from '@/components/ui/popup-alert'

export function TestPopupAlert() {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    showBookmarked, 
    showDeleted 
  } = usePopupAlert()

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Test Popup Alerts</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Button 
          onClick={() => showSuccess("Success!", "This is a success message.")}
          className="bg-green-600 hover:bg-green-700"
        >
          Success
        </Button>
        
        <Button 
          onClick={() => showError("Error!", "This is an error message.")}
          className="bg-red-600 hover:bg-red-700"
        >
          Error
        </Button>
        
        <Button 
          onClick={() => showWarning("Warning!", "This is a warning message.")}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Warning
        </Button>
        
        <Button 
          onClick={() => showInfo("Info", "This is an info message.")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Info
        </Button>
        
        <Button 
          onClick={() => showBookmarked("Bookmarked!", "This item has been bookmarked.")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Bookmarked
        </Button>
        
        <Button 
          onClick={() => showDeleted("Deleted!", "This item has been deleted.")}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Deleted
        </Button>
      </div>

      <div className="mt-8">
        <Button 
          onClick={() => {
            showSuccess("Test Alert", "If you see this, the popup alerts are working!")
          }}
          variant="outline"
        >
          Test Basic Alert
        </Button>
      </div>
    </div>
  )
}
