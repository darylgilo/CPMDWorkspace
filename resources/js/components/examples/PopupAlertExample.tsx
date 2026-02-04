import React from "react"
import { Button } from "@/components/ui/button"
import { usePopupAlert, PopupAlertContainer } from "@/components/ui/popup-alert"

export function PopupAlertExample() {
  const { showSuccess, showError, showWarning, showInfo, showBookmarked, showDeleted } = usePopupAlert()

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-6">Popup Alert Examples</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Button 
          onClick={() => showSuccess("Success!", "Operation completed successfully.")}
          className="bg-green-600 hover:bg-green-700"
        >
          Success
        </Button>
        
        <Button 
          onClick={() => showError("Error!", "Something went wrong. Please try again.")}
          className="bg-red-600 hover:bg-red-700"
        >
          Error
        </Button>
        
        <Button 
          onClick={() => showWarning("Warning!", "Please review your input before proceeding.")}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          Warning
        </Button>
        
        <Button 
          onClick={() => showInfo("Info", "Here's some useful information for you.")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Info
        </Button>
        
        <Button 
          onClick={() => showBookmarked("Bookmarked!", "Item has been added to your bookmarks.")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Bookmarked
        </Button>
        
        <Button 
          onClick={() => showDeleted("Deleted!", "Item has been successfully deleted.")}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Deleted
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Custom Messages:</h3>
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={() => showSuccess("Data Saved", "Your changes have been saved to the database.", 8000)}
            variant="outline"
          >
            Long Duration Success
          </Button>
          
          <Button 
            onClick={() => showError("Validation Failed", "Please fill in all required fields.")}
            variant="outline"
          >
            Validation Error
          </Button>
          
          <Button 
            onClick={() => showBookmarked("Item Favorited", "This item is now in your favorites list.")}
            variant="outline"
          >
            Add to Favorites
          </Button>
        </div>
      </div>

      {/* Container for displaying alerts */}
      <PopupAlertContainer />
    </div>
  )
}
