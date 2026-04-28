"use client";

import React, { createContext, ReactNode, useCallback, useMemo, useState } from "react";

export type ToastSeverity = "success" | "error";

interface DashboardModalContextType {
  isDeleteModalOpen: boolean;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  toastOpen: boolean;
  toastMessage: string;
  toastSeverity: ToastSeverity;
  showToast: (message: string, severity: ToastSeverity) => void;
  closeToast: () => void;
}

export const DashboardModalContext = createContext<DashboardModalContextType | undefined>(
  undefined
);

export const DashboardModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<ToastSeverity>("success");

  const openDeleteModal = useCallback(() => setIsDeleteModalOpen(true), []);
  const closeDeleteModal = useCallback(() => setIsDeleteModalOpen(false), []);

  const showToast = useCallback((message: string, severity: ToastSeverity) => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  }, []);

  const closeToast = useCallback(() => setToastOpen(false), []);

  const contextValue = useMemo(
    () => ({
      isDeleteModalOpen,
      openDeleteModal,
      closeDeleteModal,
      toastOpen,
      toastMessage,
      toastSeverity,
      showToast,
      closeToast,
    }),
    [
      isDeleteModalOpen,
      openDeleteModal,
      closeDeleteModal,
      toastOpen,
      toastMessage,
      toastSeverity,
      showToast,
      closeToast,
    ]
  );

  return (
    <DashboardModalContext.Provider value={contextValue}>{children}</DashboardModalContext.Provider>
  );
};

export const useDashboardModals = () => {
  const context = React.useContext(DashboardModalContext);
  if (!context) {
    throw new Error("useDashboardModals must be used within DashboardModalProvider");
  }
  return context;
};
