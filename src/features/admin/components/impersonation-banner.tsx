"use client";

import { useEffect, useState } from "react";
import {
    isImpersonating,
    getImpersonationInfo,
    stopImpersonation,
    type ImpersonationInfo,
} from "@/features/admin/utils/impersonation";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function ImpersonationBanner() {
    const [info, setInfo] = useState<ImpersonationInfo | null>(null);

    useEffect(() => {
        if (isImpersonating()) {
            setInfo(getImpersonationInfo());
        }
    }, []);

    if (!info) return null;

    const handleStop = () => {
        stopImpersonation();
        // Full page reload to reset auth context + middleware evaluation
        window.location.href = "/admin/users";
    };

    return (
        <div className="sticky top-0 z-[9999] bg-warning text-warning-foreground">
            <div className="flex items-center justify-between px-4 py-2 text-sm max-w-screen-2xl mx-auto">
                {/* Left side: info */}
                <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                        Viewing as{" "}
                        <strong className="font-semibold">{info.user.name}</strong>
                        <span className="hidden sm:inline opacity-75">
                            {" "}
                            ({info.user.email})
                        </span>
                    </span>
                </div>

                {/* Right side: back button */}
                <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 shrink-0 ms-4 rounded-md bg-warning-foreground/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-warning-foreground/30 active:scale-[0.98] cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Admin
                </button>
            </div>
        </div>
    );
}