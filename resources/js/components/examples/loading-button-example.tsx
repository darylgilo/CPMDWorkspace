import React, { useState } from 'react';
import { LoadingButton } from '@/components/ui/loading-button';
import { Button } from '@/components/ui/button';

export default function LoadingButtonExample() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simulate API call or async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    console.log('Operation completed!');
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Loading Button Examples</h3>
      
      {/* Basic Usage */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Basic Loading Button</h4>
        <LoadingButton
          loading={isLoading}
          loadingText="Submitting..."
          onClick={handleSubmit}
        >
          Submit Form
        </LoadingButton>
      </div>

      {/* Different Variants */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Different Variants</h4>
        <div className="flex gap-2">
          <LoadingButton
            variant="default"
            loading={isLoading}
            loadingText="Loading..."
          >
            Default
          </LoadingButton>
          
          <LoadingButton
            variant="outline"
            loading={isLoading}
            loadingText="Loading..."
          >
            Outline
          </LoadingButton>
          
          <LoadingButton
            variant="secondary"
            loading={isLoading}
            loadingText="Loading..."
          >
            Secondary
          </LoadingButton>
        </div>
      </div>

      {/* Different Sizes */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Different Sizes</h4>
        <div className="flex gap-2 items-center">
          <LoadingButton
            size="sm"
            loading={isLoading}
            loadingText="Loading..."
          >
            Small
          </LoadingButton>
          
          <LoadingButton
            size="default"
            loading={isLoading}
            loadingText="Loading..."
          >
            Default
          </LoadingButton>
          
          <LoadingButton
            size="lg"
            loading={isLoading}
            loadingText="Loading..."
          >
            Large
          </LoadingButton>
        </div>
      </div>

      {/* Form Integration Example */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Form Integration</h4>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="flex gap-2">
            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Creating..."
              className="bg-green-600 hover:bg-green-700"
            >
              Create Item
            </LoadingButton>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLoading(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
