import { useEffect } from "react";

type KeyPressCallback = () => void;

const useKeyPress = (targetKey: string, callback: KeyPressCallback): void => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      // Comprobamos si el foco está dentro de un input o textarea
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if (event.key === targetKey) {
        // Si el foco está en un campo de texto, permitimos la escritura
        if (isInputFocused) {
          return; // No hacemos nada, permitimos que se escriba la tecla
        }

        // Si el foco no está en un campo de texto, prevenimos la acción de escribir
        event.preventDefault();
        event.stopPropagation(); // Detenemos la propagación del evento

        // Ejecutamos el callback (abrir el modal, por ejemplo)
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetKey, callback]);
};

export default useKeyPress;
