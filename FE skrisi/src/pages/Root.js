import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function Root() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <Navbar />
            <div className="flex h-[calc(100vh-64px)]">
                <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:block transition-all duration-300 ease-in-out`}>
                    <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
                </div>
                <div className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out">
                    <div className="container mx-auto px-4 py-6">
                        <div className="animate-fade-in">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default Root;
