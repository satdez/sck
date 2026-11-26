"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Carries the server-rendered animated logo into the client app shell. */
const LogoCtx = createContext<ReactNode>(null);
export const LogoSlot = ({ logo, children }: { logo: ReactNode; children: ReactNode }) => <LogoCtx.Provider value={logo}>{children}</LogoCtx.Provider>;
export const useLogo = () => useContext(LogoCtx);
