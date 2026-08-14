import ConfirmationModal from "./ConfirmationModal";
import { createContext, useState, useContext, useCallback } from "react";

type ShowModalProps = {
  title: string;
  question: string;
  onConfirm: () => Promise<void>;
};

type ConfirmationModalProviderState = {
  showModal: ({ title, question, onConfirm }: ShowModalProps) => void;
  closeModal: () => void;
};

const initialState: ConfirmationModalProviderState = {
  showModal: () => null,
  closeModal: () => null,
};

const ConfirmationModalContext = createContext(initialState);

type ConfirmationModalProviderProps = {
  children: React.ReactNode;
};

export const ConfirmationModalProvider = ({
  children,
}: ConfirmationModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalProps, setModalProps] = useState({
    title: "",
    question: "",
    onConfirm: () => Promise.resolve(),
  });

  const showModal = useCallback(
    ({ title, question, onConfirm }: ShowModalProps) => {
      setModalProps({ title, question, onConfirm });
      setIsOpen(true);
    },
    []
  );

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ConfirmationModalContext.Provider value={{ showModal, closeModal }}>
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={closeModal}
        title={modalProps.title}
        question={modalProps.question}
        onConfirm={modalProps.onConfirm}
      />
    </ConfirmationModalContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useConfirmationModal = () => {
  const context = useContext(ConfirmationModalContext);
  if (!context) {
    throw new Error(
      "useConfirmationModal debe ser usado dentro de un ConfirmationModalProvider"
    );
  }
  return context;
};
