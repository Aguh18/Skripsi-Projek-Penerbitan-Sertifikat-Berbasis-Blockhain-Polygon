import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BrowserProvider, Contract } from "ethers";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function Root() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <Navbar />
            <div className="flex h-[calc(100vh-64px)]">
                <div className="w-64 hidden md:block">
                    <Sidebar />
                </div>
                <div className="flex-1 overflow-y-auto">
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
