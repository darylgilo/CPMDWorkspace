import logoImage from '@/Assets/Images/bpi-cpmd-logo.png';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center">
                <img
                    src={logoImage}
                    alt="BPI Crop Pest Management Division"
                    className="size-10 object-contain"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-base">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    CPMD Workspace
                </span>
            </div>
        </>
    );
}
