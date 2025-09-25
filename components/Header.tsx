"use client";
import LogoText from "./branding/LogoText";
import Logo from "./branding/Logo";
export default function Header() {

    return (
        <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="w-full">
                <div className="flex items-center h-16 pl-6 pr-8 sm:pr-12 lg:pr-16 gap-3">

                    {/* Logo */}
                    <Logo width={32} height={32} />
                    <LogoText />

                    {/* Divider */}
                    {/* <div className="h-6 w-px bg-gray-200 mx-4" /> */}

                    {/* Right side - Search
                    <SearchInput
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        placeholder="Search..."
                    /> */}
                </div>
            </div>
        </header>
    );
} 