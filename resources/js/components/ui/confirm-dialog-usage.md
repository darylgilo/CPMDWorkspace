# ConfirmDialog Component Usage

The `ConfirmDialog` component is a reusable confirmation dialog that can be used throughout the application for actions that require user confirmation (delete, reset, etc.).

## Props

| Prop | Type | Default | Description |
|-------|--------|-----------|
| `open` | `boolean` | Required | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Required | Called when dialog opens/closes |
| `title` | `string` | Required | Dialog title |
| `message` | `string` | Required | Confirmation message |
| `confirmText` | `string` | `"Confirm"` | Text for confirm button |
| `cancelText` | `string` | `"Cancel"` | Text for cancel button |
| `onConfirm` | `() => void` | Required | Called when user confirms |
| `onCancel` | `() => void` | Optional | Called when user cancels (defaults to closing dialog) |
| `isLoading` | `boolean` | `false` | Shows loading state on confirm button |
| `loadingText` | `string` | `"Processing..."` | Text shown during loading |
| `variant` | `'default' \| 'destructive'` | `'default'` | Button style for confirm action |

## Basic Usage

```tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function MyComponent() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        // Perform delete action
        setTimeout(() => {
            setIsDeleting(false);
            setShowConfirm(false);
            // Show success message
        }, 1000);
    };

    return (
        <ConfirmDialog
            open={showConfirm}
            onOpenChange={setShowConfirm}
            title="Delete Item"
            message="Are you sure you want to delete this item? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDelete}
            isLoading={isDeleting}
            loadingText="Deleting..."
            variant="destructive"
        />
    );
}
```

## Examples for Different Actions

### Delete Confirmation
```tsx
<ConfirmDialog
    open={showDeleteConfirm}
    onOpenChange={setShowDeleteConfirm}
    title="Delete User"
    message="Are you sure you want to delete this user? All associated data will be permanently removed."
    confirmText="Delete User"
    onConfirm={deleteUser}
    isLoading={isDeleting}
    loadingText="Deleting..."
    variant="destructive"
/>
```

### Save Confirmation
```tsx
<ConfirmDialog
    open={showSaveConfirm}
    onOpenChange={setShowSaveConfirm}
    title="Save Changes"
    message="Do you want to save your changes before leaving?"
    confirmText="Save"
    cancelText="Don't Save"
    onConfirm={saveChanges}
    isLoading={isSaving}
    loadingText="Saving..."
    variant="default"
/>
```

### Reset Confirmation (Current Whereabouts Usage)
```tsx
<ConfirmDialog
    open={showResetConfirm}
    onOpenChange={setShowResetConfirm}
    title="Confirm Reset"
    message="Are you sure you want to reset this whereabouts entry? This action cannot be undone."
    confirmText="Yes, Reset"
    cancelText="No"
    onConfirm={confirmReset}
    isLoading={isSubmitting}
    loadingText="Resetting..."
    variant="destructive"
/>
```

## Features

- **Reusable**: Can be used for any action requiring confirmation
- **Customizable**: Flexible props for different scenarios
- **Loading States**: Built-in loading support with LoadingButton
- **Variants**: Default and destructive button styles
- **Accessible**: Proper dialog semantics and keyboard navigation
- **Dark Mode**: Full dark mode support
- **Consistent Design**: Matches existing UI components
